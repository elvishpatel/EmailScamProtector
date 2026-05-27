import { RuleCategory } from '../../types/analysis';
import type { RuleMatch } from '../../types/analysis';
import type { EmailData } from '../../types/email';
import type { DetectionRule } from '../types';
import { extractDomain } from '../../utils/url-analyzer';
import { isTrustedLinkDomain, isCommonEmailProvider } from '../../utils/domain-checker';

/**
 * Content phrases that indicate the email is about account/credential actions.
 * These are NOT scam-specific on their own — but become VERY suspicious when
 * combined with links to unrelated domains.
 */
const ACCOUNT_ACTION_PHRASES = [
  'reset your password',
  'password reset',
  'verify your account',
  'confirm your identity',
  'update your password',
  'unusual activity',
  'suspicious activity',
  'unauthorized access',
  'account has been',
  'security alert',
  'verify your identity',
  'confirm your account',
  'account verification',
  'secure your account',
  'restore access',
  'account recovery',
  'login attempt',
  'sign-in attempt',
  'update your information',
  'action required',
  'verify your email',
  'reactivate your account',
  'account suspended',
  'account restricted',
  'access restricted',
  'temporary access restriction',
];

/**
 * Detects PHISHING LINKS — the #1 signal of real phishing attacks.
 *
 * A phishing email has a very specific pattern:
 * 1. The email content talks about passwords, accounts, verification
 * 2. There is a link in the email
 * 3. The link goes to a domain that has NOTHING to do with the sender
 *
 * Example: Email from "Google Support" <someone@gmail.com> about
 * "password reset" with a link to https://groww-account.com/reset
 * → The link domain (groww-account.com) doesn't match the sender or
 *   any legitimate service → PHISHING
 *
 * This rule catches phishing regardless of sender. It works because:
 * - Legitimate password reset emails link to their OWN domain
 * - Phishing emails link to FAKE domains designed to steal credentials
 */
export class PhishingLinkRule implements DetectionRule {
  readonly id = 'phishing-link';
  readonly name = 'Phishing Link Detection';
  readonly description = 'Detects when account/credential emails contain links to unrelated or suspicious domains.';
  readonly category = RuleCategory.CREDENTIAL_THEFT;

  detect(email: EmailData): RuleMatch[] {
    // Step 1: Does the email content talk about account/credential actions?
    const combinedText = `${email.subject} ${email.body}`.toLowerCase();
    const matchedPhrases: string[] = [];

    for (const phrase of ACCOUNT_ACTION_PHRASES) {
      if (combinedText.includes(phrase.toLowerCase())) {
        matchedPhrases.push(phrase);
      }
    }

    // If no account-action language, this rule doesn't apply
    if (matchedPhrases.length === 0) {
      return [];
    }

    // Step 2: Check if any links go to suspicious/unrelated domains
    if (email.links.length === 0) {
      return [];
    }

    const senderDomain = email.sender.domain.toLowerCase();
    const senderRoot = getRootDomain(senderDomain);
    const suspiciousLinks: { href: string; domain: string; reason: string }[] = [];

    for (const link of email.links) {
      try {
        const linkDomain = extractDomain(link.href).toLowerCase();
        const linkRoot = getRootDomain(linkDomain);

        // Skip mailto links, # anchors, javascript links
        if (link.href.startsWith('mailto:') || link.href.startsWith('#') || link.href.startsWith('javascript:')) {
          continue;
        }

        // Check 1: Is the link domain a known trusted brand?
        if (isTrustedLinkDomain(linkRoot)) {
          // Link goes to a known brand — check if it matches the sender's domain
          // e.g., email from gmail.com with link to google.com → OK
          // But email from gmail.com with link to groww.in → suspicious for a "Google" password reset
          if (linkRoot === senderRoot || isRelatedDomain(senderRoot, linkRoot)) {
            continue; // Consistent — not suspicious
          }
          // Link goes to a DIFFERENT brand than the sender — that's unusual
          // but not necessarily phishing (could be a forwarded email)
          continue;
        }

        // Check 2: Link goes to an UNKNOWN domain (not in trusted list)
        // In a password reset email, this is the classic phishing pattern

        // Is the link related to the sender?
        if (linkRoot === senderRoot) {
          continue; // Same domain — not phishing
        }

        // The link goes to an unknown, unrelated domain in a credential email
        // This is highly suspicious
        let reason = `Link goes to "${linkDomain}" which is unrelated to the sender "${senderDomain}"`;

        // Extra check: Does the link domain try to impersonate something?
        const suspiciousDomainPatterns = [
          /account/i, /login/i, /verify/i, /secure/i, /reset/i,
          /update/i, /confirm/i, /signin/i, /auth/i, /portal/i,
        ];
        const hasPhishyName = suspiciousDomainPatterns.some(p => p.test(linkDomain));
        if (hasPhishyName) {
          reason = `Link goes to "${linkDomain}" which has a suspicious name designed to look like a login page`;
        }

        suspiciousLinks.push({ href: link.href, domain: linkDomain, reason });
      } catch {
        continue;
      }
    }

    if (suspiciousLinks.length === 0) {
      return [];
    }

    // Calculate severity based on signal strength
    let severity = 40; // Base: account language + unrelated link = very suspicious

    // Boost if sender is from a public email provider (not a corporate domain)
    if (isCommonEmailProvider(senderDomain)) {
      severity += 15; // Personal email claiming to be a service = even more suspicious
    }

    // Boost if link domain has phishing-style naming
    if (suspiciousLinks.some(l => /account|login|verify|secure|reset|auth/i.test(l.domain))) {
      severity += 10;
    }

    // Boost if multiple account-action phrases matched
    if (matchedPhrases.length >= 3) {
      severity += 5;
    }

    severity = Math.min(severity, 70);

    const mainLink = suspiciousLinks[0];
    const evidence = [
      `Sender: ${email.sender.email}`,
      ...matchedPhrases.slice(0, 3).map(p => `Email mentions: "${p}"`),
      ...suspiciousLinks.slice(0, 3).map(l => `Suspicious link: ${l.href}`),
    ];

    return [{
      ruleId: this.id,
      ruleName: this.name,
      severity,
      category: this.category,
      explanation:
        `This email talks about your account or password but contains a link to "${mainLink.domain}" — ` +
        `a website that is not related to the sender. This is a common phishing technique. ` +
        `Real password reset emails always link to the company's own website.`,
      evidence,
    }];
  }
}

/**
 * Extract root/registrable domain from a hostname.
 */
function getRootDomain(domain: string): string {
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;

  const compoundTLDs = ['co.in', 'co.uk', 'co.jp', 'com.au', 'gov.in', 'org.in',
    'ac.in', 'net.in', 'co.za', 'co.nz', 'com.br', 'com.sg', 'co.kr'];
  const last2 = parts.slice(-2).join('.');
  if (compoundTLDs.includes(last2) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }

  return parts.slice(-2).join('.');
}

/**
 * Check if two domains could be related (e.g., google.com and gmail.com).
 * Uses simple heuristic: share a common root word of 4+ chars.
 */
function isRelatedDomain(domain1: string, domain2: string): boolean {
  const root1 = domain1.split('.')[0].toLowerCase();
  const root2 = domain2.split('.')[0].toLowerCase();

  if (root1 === root2) return true;
  if (root1.length >= 4 && root2.includes(root1)) return true;
  if (root2.length >= 4 && root1.includes(root2)) return true;

  return false;
}
