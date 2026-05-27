import { RuleCategory } from '../../types/analysis';
import type { RuleMatch } from '../../types/analysis';
import type { EmailData } from '../../types/email';
import type { DetectionRule } from '../types';
import { findBrandMismatch, isDomainSimilar, isTrustedSender } from '../../utils/domain-checker';
import trustedDomains from '../data/trusted-domains.json';

/**
 * Detects sender impersonation — when someone pretends to be from a
 * trusted brand but their email domain doesn't match.
 *
 * ACCURACY FIXES:
 * 1. If the sender domain IS a verified trusted domain, skip ALL checks.
 *    A real email from cdslindia.co.in should never be flagged.
 * 2. Typosquatting check now verifies the sender domain is NOT already
 *    a known trusted domain for a DIFFERENT brand. nse.co.in is NOT
 *    typosquatting nsdl.co.in — they are two separate legitimate organizations.
 * 3. Levenshtein threshold is scaled by domain length to avoid matching
 *    short domains that happen to look similar.
 */
export class ImpersonationRule implements DetectionRule {
  readonly id = 'sender-impersonation';
  readonly name = 'Sender Impersonation';
  readonly description = 'Detects when a sender pretends to represent a known brand but uses an unofficial email domain.';
  readonly category = RuleCategory.IMPERSONATION;

  detect(email: EmailData): RuleMatch[] {
    // CRITICAL: If sender domain is a known trusted domain, SKIP all checks.
    // A real email from hdfcbank.net or cdslindia.co.in is legitimate.
    const senderTrust = isTrustedSender(email.sender.domain);
    if (senderTrust) {
      return [];
    }

    const matches: RuleMatch[] = [];

    // Check 1: Display name claims to be a brand but domain doesn't match
    const brandMismatch = findBrandMismatch(email.sender.name, email.sender.domain);

    if (brandMismatch) {
      const officialList = brandMismatch.officialDomains.slice(0, 3).join(', ');
      matches.push({
        ruleId: this.id,
        ruleName: this.name,
        severity: 40,
        category: this.category,
        explanation:
          `This sender claims to be ${brandMismatch.brand} but the email address doesn't match. ` +
          `Real ${brandMismatch.brand} emails come from ${officialList}.`,
        evidence: [
          `Display name: "${email.sender.name}"`,
          `Actual domain: ${email.sender.domain}`,
          `Expected domains: ${officialList}`,
        ],
      });
    }

    // Check 2: Typosquatting detection
    // ONLY run if Check 1 didn't find a mismatch AND the sender is NOT
    // a trusted domain for ANY other brand.
    if (!brandMismatch) {
      const typoMatch = this.checkTyposquatting(email.sender.domain);
      if (typoMatch) {
        matches.push(typoMatch);
      }
    }

    return matches;
  }

  /**
   * Check if the sender domain is suspiciously similar to a known brand domain.
   * Detects typosquatting like "paypa1.com" mimicking "paypal.com".
   *
   * KEY FIX: Excludes matches where the sender domain belongs to a DIFFERENT
   * legitimate organization. nse.co.in is NOT typosquatting nsdl.co.in.
   */
  private checkTyposquatting(senderDomain: string): RuleMatch | null {
    const brands = trustedDomains as Record<string, string[]>;
    const domainLower = senderDomain.toLowerCase();

    // Get the base part of the domain (before the TLD) for length-based threshold
    const domainBase = domainLower.split('.')[0];

    for (const [brand, officialDomains] of Object.entries(brands)) {
      for (const official of officialDomains) {
        const officialLower = official.toLowerCase();

        // Skip exact matches (already handled by trusted sender check)
        if (domainLower === officialLower) continue;

        // Scale threshold by domain length:
        // Short domains (< 6 chars like nse.co.in) need distance of 1 max
        // Medium domains (6-10 chars) need distance of 2 max
        // Longer domains need distance of 3 max
        const officialBase = officialLower.split('.')[0];
        const minLen = Math.min(domainBase.length, officialBase.length);
        const threshold = minLen < 6 ? 1 : minLen < 10 ? 2 : 3;

        if (isDomainSimilar(domainLower, officialLower, threshold)) {
          // CRITICAL CHECK: Is the sender domain ALSO a known trusted domain
          // for a different brand? If yes, this is NOT typosquatting — it's
          // just two different companies with similar domain names.
          const senderAlsoTrusted = isTrustedSender(senderDomain);
          if (senderAlsoTrusted) {
            // Skip — both domains belong to legitimate brands
            continue;
          }

          return {
            ruleId: `${this.id}-typo`,
            ruleName: this.name,
            severity: 35,
            category: this.category,
            explanation:
              `The sender's domain "${senderDomain}" looks very similar to ${brand}'s real domain "${official}". ` +
              `This could be a typosquatting attack.`,
            evidence: [
              `Sender domain: ${senderDomain}`,
              `Similar to: ${official} (${brand})`,
            ],
          };
        }
      }
    }

    return null;
  }
}
