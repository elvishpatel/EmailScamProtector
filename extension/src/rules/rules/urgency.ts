import { RuleCategory } from '../../types/analysis';
import type { RuleMatch } from '../../types/analysis';
import type { EmailData } from '../../types/email';
import type { DetectionRule } from '../types';
import { countPatternMatches } from '../../utils/text-analyzer';

/**
 * Urgency phrases that are SCAM-SPECIFIC — not normal business communication.
 *
 * REMOVED: "urgent", "immediately", "deadline", "as soon as possible", "suspended"
 * — real companies use these legitimately (e.g., "payment deadline", "service suspended
 *   due to maintenance", "please respond as soon as possible").
 *
 * KEPT: Phrases that combine urgency with THREAT — these are strong scam signals.
 */
const SCAM_URGENCY_PHRASES: readonly string[] = [
  'act now or your account will be',
  'account will be closed',
  'account will be terminated',
  'last chance to verify',
  'final warning before',
  'your account will be permanently',
  'failure to respond will result',
  'within 24 hours or',
  'within 48 hours or',
  'respond immediately or face',
  'urgent action required to prevent',
  'your account is at risk of',
  'verify now to avoid',
  'click now before it expires',
  'this is your final notice',
  'do not ignore this warning',
  'immediate action needed to avoid',
];

/**
 * Detects scam-specific urgency and threat tactics.
 *
 * ACCURACY IMPROVEMENT: Only fires on phrases that combine urgency WITH a threat
 * or consequence. Words like "urgent" or "deadline" alone are completely normal
 * in legitimate business emails.
 *
 * Requires 2+ matches — a single urgent phrase is normal business communication.
 */
export class UrgencyRule implements DetectionRule {
  readonly id = 'urgency-pressure';
  readonly name = 'Urgency & Time Pressure';
  readonly description = 'Detects threatening urgency tactics, not normal business deadlines.';
  readonly category = RuleCategory.URGENCY;

  detect(email: EmailData): RuleMatch[] {
    const combinedText = `${email.subject} ${email.body}`;
    const { count, matched } = countPatternMatches(combinedText, [...SCAM_URGENCY_PHRASES]);

    // Require 2+ matches to fire
    if (count < 2) {
      return [];
    }

    // 20 base + 5 per match beyond 2, capped at 45
    const severity = Math.min(45, 20 + (count - 2) * 5);

    return [
      {
        ruleId: this.id,
        ruleName: this.name,
        severity,
        category: this.category,
        explanation:
          'This email threatens bad consequences if you do not act immediately. Scammers use these threats to rush you into making mistakes.',
        evidence: matched,
      },
    ];
  }
}
