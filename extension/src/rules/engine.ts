import type { EmailData } from '../types/email';
import type { RuleMatch } from '../types/analysis';
import { RiskLevel } from '../types/analysis';
import { allRules } from './rules/index';
import { computeRiskScore } from './scorer';
import { isTrustedSender } from '../utils/domain-checker';

/**
 * Run all detection rules against an email and compute the aggregate risk score.
 * This is the main entry point for Layer 1 (local heuristic) analysis.
 *
 * KEY ACCURACY FEATURE: If the sender domain belongs to a known trusted brand
 * (e.g., hdfcbank.com, nseindia.com, chase.com), the final score is heavily
 * discounted because legitimate companies naturally use financial/urgency language.
 * Only structural red flags (impersonation, suspicious links) keep their full weight.
 */
export function runRuleEngine(
  email: EmailData
): { matches: RuleMatch[]; score: number; riskLevel: RiskLevel } {
  const allMatches: RuleMatch[] = [];

  for (const rule of allRules) {
    try {
      const ruleMatches = rule.detect(email);
      allMatches.push(...ruleMatches);
    } catch (error) {
      console.error(`[ESP] Rule "${rule.id}" failed:`, error);
    }
  }

  // Check if sender is from a verified trusted domain
  const trustResult = isTrustedSender(email.sender.domain);
  const isTrusted = trustResult !== null;

  const { score, riskLevel } = computeRiskScore(allMatches, isTrusted);

  return { matches: allMatches, score, riskLevel };
}
