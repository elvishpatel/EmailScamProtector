import type { RuleMatch } from '../types/analysis';
import { RiskLevel, RuleCategory, RISK_THRESHOLDS } from '../types/analysis';

/**
 * Categories where matches are STRUCTURAL signals — they indicate
 * the email itself is deceptive, not just that it uses certain words.
 * These keep full weight even for trusted senders.
 */
const STRUCTURAL_CATEGORIES = new Set<string>([
  RuleCategory.IMPERSONATION,
  RuleCategory.SUSPICIOUS_LINKS,
  RuleCategory.CREDENTIAL_THEFT,  // Includes phishing-link rule now
]);

/**
 * Categories where matches are CONTENT-BASED — they detect keywords
 * that are normal in legitimate business emails. These get heavily
 * discounted for trusted corporate senders.
 */
const CONTENT_CATEGORIES = new Set<string>([
  RuleCategory.FINANCIAL,
  RuleCategory.URGENCY,
  RuleCategory.EMOTIONAL,
  RuleCategory.FORMATTING,
]);

/**
 * Compute a weighted risk score from rule matches.
 *
 * SCORING PHILOSOPHY:
 * - Structural signals (phishing links, impersonation, suspicious URLs) are
 *   always weighted at full strength because they indicate real deception.
 * - Content signals (financial words, urgency) are discounted for trusted
 *   corporate senders but NOT for personal email senders.
 * - A single structural match CAN make an email dangerous (phishing link alone
 *   is enough to flag an email).
 * - A single content-only match is capped at LOW_RISK.
 */
export function computeRiskScore(
  matches: RuleMatch[],
  isTrustedSender: boolean = false,
): { score: number; riskLevel: RiskLevel } {
  if (matches.length === 0) {
    return { score: 0, riskLevel: RiskLevel.SAFE };
  }

  const categoryCounts = new Map<string, number>();
  let totalScore = 0;
  let hasStructuralMatch = false;

  // Sort by severity descending
  const sorted = [...matches].sort((a, b) => b.severity - a.severity);

  for (const match of sorted) {
    const count = categoryCounts.get(match.category) ?? 0;
    categoryCounts.set(match.category, count + 1);

    // Track if any structural signal was found
    if (STRUCTURAL_CATEGORIES.has(match.category)) {
      hasStructuralMatch = true;
    }

    // Diminishing returns: first match full, subsequent 50%
    const diminishingMultiplier = count === 0 ? 1.0 : 0.5;

    // Trust-based multiplier — only for content categories
    let trustMultiplier = 1.0;
    if (isTrustedSender && CONTENT_CATEGORIES.has(match.category)) {
      // Content matches from verified corporate senders → near-zero weight
      trustMultiplier = 0.05;
    }
    // NOTE: Structural categories always get full weight, even for trusted senders

    totalScore += match.severity * diminishingMultiplier * trustMultiplier;
  }

  // MULTI-SIGNAL REQUIREMENT — only for content-only matches
  // If we ONLY found content keywords (no structural issues) AND only 1 category,
  // cap at LOW_RISK because single keyword matches aren't reliable.
  // But if ANY structural match exists (phishing link, impersonation), let the score stand.
  const uniqueCategories = categoryCounts.size;
  if (!hasStructuralMatch && uniqueCategories <= 1 && totalScore > 30) {
    totalScore = 30;
  }

  // Cap at 100
  const score = Math.min(Math.round(totalScore), 100);
  const riskLevel = scoreToRiskLevel(score);

  return { score, riskLevel };
}

/** Maps a numeric score (0-100) to the appropriate RiskLevel */
export function scoreToRiskLevel(score: number): RiskLevel {
  for (const [level, { min, max }] of Object.entries(RISK_THRESHOLDS) as [RiskLevel, { min: number; max: number }][]) {
    if (score >= min && score <= max) {
      return level;
    }
  }
  return score > 75 ? RiskLevel.DANGEROUS : RiskLevel.SAFE;
}
