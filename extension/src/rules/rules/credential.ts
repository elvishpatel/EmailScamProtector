import { RuleCategory } from '../../types/analysis';
import type { RuleMatch } from '../../types/analysis';
import type { EmailData } from '../../types/email';
import type { DetectionRule } from '../types';
import { countPatternMatches } from '../../utils/text-analyzer';
import { isCommonEmailProvider } from '../../utils/domain-checker';

/**
 * Phrases that ALWAYS indicate credential theft — regardless of sender.
 * These ask users to directly share sensitive data via reply/form.
 */
const ALWAYS_SCAM_PHRASES: readonly string[] = [
  'enter your otp',
  'send us your otp',
  'reply with your password',
  'send your password',
  'share your login credentials',
  'send your credit card',
  'reply with your pin',
  'enter your social security',
  'send your pan card number',
  'share your aadhaar number',
  'send your bank account number',
  'enter your cvv',
  'reply with your bank details',
  'provide your login details',
  'share your pin number',
  'enter your debit card number',
  'enter your credit card number',
];

/**
 * Phrases that are suspicious when combined with OTHER signals
 * (like sender being a personal email, or links going to unrelated domains).
 * On their own from a real corporate sender, these are normal.
 */
const CONTEXT_SUSPICIOUS_PHRASES: readonly string[] = [
  'verify your account',
  'confirm your identity',
  'update your password',
  'click here to verify',
  'update your information',
  'verify your email address',
  'confirm your account',
  'click the link below to verify',
  'click the secure link',
  'use the secure link below',
];

/**
 * Detects credential and OTP theft attempts.
 *
 * Two-tier detection:
 * 1. "Always scam" phrases → fire immediately (severity 30-50)
 * 2. "Context suspicious" phrases → only fire when sender is a personal
 *    email provider (gmail, yahoo, etc.) because a real company wouldn't
 *    use a personal email to ask you to verify your account.
 */
export class CredentialRule implements DetectionRule {
  readonly id = 'credential-theft';
  readonly name = 'Credential / OTP Theft';
  readonly description = 'Detects explicit requests for passwords, OTPs, or sensitive personal data.';
  readonly category = RuleCategory.CREDENTIAL_THEFT;

  detect(email: EmailData): RuleMatch[] {
    const combinedText = `${email.subject} ${email.body}`;
    const matches: RuleMatch[] = [];

    // Tier 1: Always-scam phrases
    const { count: alwaysCount, matched: alwaysMatched } = countPatternMatches(
      combinedText,
      [...ALWAYS_SCAM_PHRASES],
    );

    if (alwaysCount > 0) {
      const severity = Math.min(50, 30 + (alwaysCount - 1) * 5);
      matches.push({
        ruleId: this.id,
        ruleName: this.name,
        severity,
        category: this.category,
        explanation:
          'This email asks you to share sensitive information like passwords, OTPs, or card numbers. ' +
          'No real company ever asks for this by email.',
        evidence: alwaysMatched,
      });
    }

    // Tier 2: Context-suspicious phrases — only when sender is a personal email provider
    const isPersonalSender = isCommonEmailProvider(email.sender.domain);
    if (isPersonalSender) {
      const { count: contextCount, matched: contextMatched } = countPatternMatches(
        combinedText,
        [...CONTEXT_SUSPICIOUS_PHRASES],
      );

      if (contextCount > 0) {
        const severity = Math.min(40, 20 + (contextCount - 1) * 5);
        matches.push({
          ruleId: `${this.id}-context`,
          ruleName: 'Suspicious Account Verification Request',
          severity,
          category: this.category,
          explanation:
            `This email asks you to verify or update your account, but it was sent from a personal email address (${email.sender.domain}). ` +
            `Real companies always send these requests from their official company email.`,
          evidence: [
            `Sender domain: ${email.sender.domain} (personal email)`,
            ...contextMatched,
          ],
        });
      }
    }

    return matches;
  }
}
