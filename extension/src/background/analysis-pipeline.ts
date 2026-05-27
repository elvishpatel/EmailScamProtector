import type { EmailData } from '../types/email';
import type { AnalysisResult, RuleMatch, AIAnalysisResponse, RiskLevel as RiskLevelType, SenderVerification, LinkAnalysisDetail } from '../types/analysis';
import { RiskLevel, RuleCategory } from '../types/analysis';
import type { ExtensionSettings } from '../types/settings';
import { runRuleEngine } from '../rules/engine';
import { analyzeWithAI } from '../ai/client';
import { analyzeUrl } from '../utils/url-analyzer';
import { scoreToRiskLevel } from '../rules/scorer';
import { isTrustedSender } from '../utils/domain-checker';

/**
 * Threshold above which AI analysis is triggered.
 * Raised from 25 to 20 — the rule scores are now much more conservative,
 * so a score of 20+ actually means something suspicious was found.
 */
const AI_TRIGGER_THRESHOLD = 20;

/** Convert AI risk_level string to a numeric score */
function aiRiskToScore(riskLevel: string): number {
  const map: Record<string, number> = {
    'SAFE': 5,
    'LOW_RISK': 20,
    'SUSPICIOUS': 40,
    'HIGH_RISK': 60,
    'DANGEROUS': 80,
  };
  return map[riskLevel.toUpperCase().replace(' ', '_')] ?? 25;
}

/**
 * Run the hybrid analysis pipeline: Rule Engine (Layer 1) + AI (Layer 2).
 *
 * KEY ACCURACY CHANGES:
 * 1. Rule engine now considers sender trust (verified brand domains → near-zero score)
 * 2. AI only triggered when rules find real suspicious signals
 * 3. Final score uses heavier AI weight when AI is used (AI is better at context)
 * 4. Trusted sender emails get "safe" explanations when score is low
 */
export async function runAnalysisPipeline(
  email: EmailData,
  settings: ExtensionSettings
): Promise<AnalysisResult> {
  // Check sender trust status
  const trustResult = isTrustedSender(email.sender.domain);
  const senderIsTrusted = trustResult !== null;

  // Layer 1: Rule Engine (always runs — now trust-aware)
  const ruleResult = runRuleEngine(email);

  // Layer 2: AI Analysis (conditional)
  let aiAnalysis: AIAnalysisResponse | null = null;
  let aiScore: number | null = null;
  let analyzedWith: 'rules-only' | 'hybrid' = 'rules-only';

  // Only call AI if:
  // - AI is enabled
  // - Rule score exceeds threshold (meaning real issues were found)
  // - Backend URL is configured
  // - Sender is NOT a verified trusted brand (trusted = no need for AI)
  if (
    settings.aiEnabled &&
    ruleResult.score >= AI_TRIGGER_THRESHOLD &&
    settings.backendUrl &&
    !senderIsTrusted
  ) {
    try {
      aiAnalysis = await analyzeWithAI(email, ruleResult.matches, settings.backendUrl);
      if (aiAnalysis) {
        aiScore = aiRiskToScore(aiAnalysis.risk_level);
        analyzedWith = 'hybrid';
      }
    } catch (error) {
      console.error('[ESP] AI analysis failed, using rules only:', error);
    }
  }

  // Combine scores
  let finalScore: number;
  if (aiScore !== null) {
    // Give AI more weight when it's used — it understands context better than keywords
    finalScore = Math.round(ruleResult.score * 0.4 + aiScore * 0.6);
  } else {
    finalScore = ruleResult.score;
  }

  // Cap at 100
  finalScore = Math.min(finalScore, 100);
  const finalRiskLevel = scoreToRiskLevel(finalScore);

  // Build sender verification
  const senderVerification = buildSenderVerification(email, ruleResult.matches, senderIsTrusted, trustResult?.brand);

  // Build link analysis
  const linkAnalysis = buildLinkAnalysis(email);

  // Merge explanations
  const explanations = buildExplanations(ruleResult.matches, aiAnalysis, senderIsTrusted, trustResult?.brand, finalRiskLevel);

  // Merge recommended actions
  const recommendedActions = buildRecommendedActions(finalRiskLevel, ruleResult.matches, aiAnalysis);

  return {
    emailId: email.id,
    timestamp: Date.now(),
    riskLevel: finalRiskLevel,
    riskScore: finalScore,
    ruleScore: ruleResult.score,
    aiScore,
    ruleMatches: ruleResult.matches,
    aiAnalysis,
    explanations,
    recommendedActions,
    senderVerification,
    linkAnalysis,
    analyzedWith,
  };
}

/** Build sender verification from impersonation rule matches */
function buildSenderVerification(
  email: EmailData,
  matches: RuleMatch[],
  isTrusted: boolean,
  trustedBrand?: string,
): SenderVerification {
  const impersonationMatch = matches.find(m => m.category === RuleCategory.IMPERSONATION);

  if (isTrusted) {
    return {
      displayName: email.sender.name,
      actualDomain: email.sender.domain,
      isMismatch: false,
      explanation: `✅ Verified sender — this email is from ${trustedBrand ?? email.sender.domain}, a recognized and trusted organization.`,
    };
  }

  return {
    displayName: email.sender.name,
    actualDomain: email.sender.domain,
    isMismatch: !!impersonationMatch,
    explanation: impersonationMatch?.explanation ??
      `Sender "${email.sender.name}" is from domain ${email.sender.domain}.`,
  };
}

/** Build link analysis from URL analyzer */
function buildLinkAnalysis(
  email: EmailData
): { totalLinks: number; suspiciousLinks: number; details: LinkAnalysisDetail[] } {
  const details: LinkAnalysisDetail[] = [];

  for (const link of email.links.slice(0, 20)) {
    const analysis = analyzeUrl(link.href, link.displayText);
    details.push({
      href: link.href,
      displayText: link.displayText,
      issues: analysis.issues,
      riskLevel: analysis.riskLevel,
    });
  }

  const suspiciousLinks = details.filter(d => d.issues.length > 0).length;

  return {
    totalLinks: email.links.length,
    suspiciousLinks,
    details,
  };
}

/** Build human-friendly explanations */
function buildExplanations(
  matches: RuleMatch[],
  aiAnalysis: AIAnalysisResponse | null,
  isTrusted: boolean,
  trustedBrand?: string,
  riskLevel?: RiskLevelType,
): string[] {
  const explanations: string[] = [];

  // For trusted senders with safe/low scores, give a clear "all good" message
  if (isTrusted && (riskLevel === RiskLevel.SAFE || riskLevel === RiskLevel.LOW_RISK)) {
    explanations.push(
      `This email is from ${trustedBrand ?? 'a verified organization'}. The content looks normal and safe.`
    );
    return explanations;
  }

  if (matches.length === 0 && !aiAnalysis) {
    explanations.push('This email looks safe. No warning signs were found.');
    return explanations;
  }

  // Add AI explanation first (it's usually the most comprehensive)
  if (aiAnalysis?.explanation) {
    explanations.push(aiAnalysis.explanation);
  }

  // Add unique rule explanations (deduplicated)
  const seen = new Set<string>();
  if (aiAnalysis?.explanation) {
    seen.add(aiAnalysis.explanation);
  }

  const sorted = [...matches].sort((a, b) => b.severity - a.severity);
  for (const match of sorted) {
    if (!seen.has(match.explanation)) {
      explanations.push(match.explanation);
      seen.add(match.explanation);
    }
  }

  return explanations;
}

/** Build recommended actions based on risk level */
function buildRecommendedActions(
  riskLevel: RiskLevelType,
  matches: RuleMatch[],
  aiAnalysis: AIAnalysisResponse | null
): string[] {
  const actions: string[] = [];

  // Add AI recommended actions
  if (aiAnalysis?.recommended_actions) {
    actions.push(...aiAnalysis.recommended_actions);
  }

  switch (riskLevel) {
    case RiskLevel.SAFE:
      break;
    case RiskLevel.LOW_RISK:
      if (actions.length === 0) {
        actions.push('Be cautious with any links in this email.');
      }
      break;
    case RiskLevel.SUSPICIOUS:
      if (actions.length === 0) {
        actions.push('Do not click any links in this email.');
        actions.push('If this claims to be from a company, call them directly to verify.');
      }
      break;
    case RiskLevel.HIGH_RISK:
      actions.push('Do not reply to this email or click any links.');
      actions.push('Do not share any personal information.');
      actions.push('Ask a trusted family member for advice before taking any action.');
      break;
    case RiskLevel.DANGEROUS:
      actions.push('Delete this email immediately.');
      actions.push('Do not respond, click links, or download attachments.');
      actions.push('Do not share OTP codes, passwords, or bank details.');
      actions.push('Call a trusted family member or friend for help.');
      actions.push('Report this email as spam or phishing.');
      break;
  }

  return [...new Set(actions)];
}
