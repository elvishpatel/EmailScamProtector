import { RuleCategory } from '../../types/analysis';
import type { RuleMatch } from '../../types/analysis';
import type { EmailData } from '../../types/email';
import type { DetectionRule } from '../types';
import { countPatternMatches } from '../../utils/text-analyzer';

/**
 * Financial keywords that ONLY appear in scam contexts.
 * Removed normal business words like "invoice", "refund", "account details",
 * "payment due" — real companies use these all the time.
 *
 * KEEP: Phrases that are strong scam indicators even in isolation.
 * REMOVED: "invoice", "refund", "account details", "payment due", "upi",
 *          "bank transfer" — too generic, cause false positives on real banking emails.
 */
const SCAM_FINANCIAL_KEYWORDS: readonly string[] = [
  'wire transfer to',
  'buy gift card',
  'purchase gift card',
  'send gift card',
  'pay via bitcoin',
  'pay in cryptocurrency',
  'pay in bitcoin',
  'send money to this',
  'transfer money to',
  'claim your prize',
  'you have won a lottery',
  'lottery winner',
  'claim your inheritance',
  'unclaimed inheritance',
  'send your bank details',
  'share your bank details',
  'western union',
  'moneygram',
  'pay via gift cards',
  'outstanding fine',
  'pay penalty immediately',
];

/**
 * Detects financial scam pressure.
 *
 * ACCURACY IMPROVEMENT: This rule now only fires on phrases that are
 * strong scam indicators — not normal financial terms. "Payment due" or
 * "invoice" appearing in an email from HDFC Bank or NSE is completely normal.
 *
 * Requires 2+ matches before triggering (single match = likely legitimate).
 */
export class FinancialRule implements DetectionRule {
  readonly id = 'financial-pressure';
  readonly name = 'Financial / Payment Pressure';
  readonly description = 'Detects scam-specific money transfer requests, not normal financial correspondence.';
  readonly category = RuleCategory.FINANCIAL;

  detect(email: EmailData): RuleMatch[] {
    const combinedText = `${email.subject} ${email.body}`;
    const { count, matched } = countPatternMatches(combinedText, [...SCAM_FINANCIAL_KEYWORDS]);

    // Require 2+ matches to reduce false positives
    if (count < 2) {
      return [];
    }

    // 20 base + 5 per match beyond 2, capped at 50
    const severity = Math.min(50, 20 + (count - 2) * 5);

    return [
      {
        ruleId: this.id,
        ruleName: this.name,
        severity,
        category: this.category,
        explanation:
          'This email asks you to send money through unusual methods like gift cards, wire transfers, or cryptocurrency. Legitimate companies never ask for payments this way.',
        evidence: matched,
      },
    ];
  }
}
