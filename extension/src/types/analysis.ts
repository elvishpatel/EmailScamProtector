/** Risk severity levels from safest to most dangerous */
export enum RiskLevel {
  SAFE = 'SAFE',
  LOW_RISK = 'LOW_RISK',
  SUSPICIOUS = 'SUSPICIOUS',
  HIGH_RISK = 'HIGH_RISK',
  DANGEROUS = 'DANGEROUS',
}

/** Maps risk levels to numeric thresholds for score-based classification */
export const RISK_THRESHOLDS: Record<RiskLevel, { min: number; max: number }> = {
  [RiskLevel.SAFE]: { min: 0, max: 15 },
  [RiskLevel.LOW_RISK]: { min: 16, max: 35 },
  [RiskLevel.SUSPICIOUS]: { min: 36, max: 55 },
  [RiskLevel.HIGH_RISK]: { min: 56, max: 75 },
  [RiskLevel.DANGEROUS]: { min: 76, max: 100 },
};

/** A single match from a detection rule */
export interface RuleMatch {
  /** Unique rule identifier */
  ruleId: string;
  /** Human-readable rule name */
  ruleName: string;
  /** Severity score for this match (0-100) */
  severity: number;
  /** Category of the detection */
  category: RuleCategory;
  /** Plain-language explanation for the user */
  explanation: string;
  /** Evidence snippets that triggered the match */
  evidence: string[];
}

/** Categories for detection rules */
export enum RuleCategory {
  URGENCY = 'urgency',
  IMPERSONATION = 'impersonation',
  SUSPICIOUS_LINKS = 'suspicious_links',
  FINANCIAL = 'financial',
  CREDENTIAL_THEFT = 'credential_theft',
  EMOTIONAL = 'emotional',
  FORMATTING = 'formatting',
}

/** Response from the AI analysis service */
export interface AIAnalysisResponse {
  /** AI-assessed risk level */
  risk_level: string;
  /** AI confidence in the assessment (0-1) */
  confidence: number;
  /** Patterns detected by AI */
  detected_patterns: string[];
  /** Plain-language explanation */
  explanation: string;
  /** Suggested actions for the user */
  recommended_actions: string[];
  /** AI assessment of sender risk */
  sender_risk: string;
  /** AI assessment of link risk */
  link_risk: string;
  /** Whether urgency manipulation was detected */
  urgency_detected: boolean;
  /** Whether impersonation was detected */
  impersonation_detected: boolean;
}

/** Detailed analysis of a single link */
export interface LinkAnalysisDetail {
  /** The URL that was analyzed */
  href: string;
  /** The display text of the link */
  displayText: string;
  /** Specific issues found with this link */
  issues: string[];
  /** Risk assessment for this link */
  riskLevel: RiskLevel;
}

/** Sender verification result */
export interface SenderVerification {
  /** The display name shown */
  displayName: string;
  /** The actual email domain */
  actualDomain: string;
  /** Whether the display name and domain don't match */
  isMismatch: boolean;
  /** Human-friendly explanation */
  explanation: string;
}

/** Complete result of analyzing an email */
export interface AnalysisResult {
  /** Hash ID of the analyzed email */
  emailId: string;
  /** When the analysis was performed */
  timestamp: number;
  /** Final computed risk level */
  riskLevel: RiskLevel;
  /** Final computed risk score (0-100) */
  riskScore: number;
  /** Score from rule engine alone (0-100) */
  ruleScore: number;
  /** Score from AI analysis, null if AI was not used */
  aiScore: number | null;
  /** All rule matches found */
  ruleMatches: RuleMatch[];
  /** AI analysis result, null if AI was not used */
  aiAnalysis: AIAnalysisResponse | null;
  /** Combined human-friendly explanations */
  explanations: string[];
  /** Combined recommended actions */
  recommendedActions: string[];
  /** Sender verification details */
  senderVerification: SenderVerification;
  /** Link analysis summary */
  linkAnalysis: {
    totalLinks: number;
    suspiciousLinks: number;
    details: LinkAnalysisDetail[];
  };
  /** Whether AI was used or rules-only */
  analyzedWith: 'rules-only' | 'hybrid';
}

/** Cached analysis result with expiration */
export interface CachedAnalysis {
  result: AnalysisResult;
  cachedAt: number;
  expiresAt: number;
}

/** Summary for display in history lists */
export interface AnalysisSummary {
  emailId: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  riskLevel: RiskLevel;
  riskScore: number;
  shortExplanation: string;
  timestamp: number;
}
