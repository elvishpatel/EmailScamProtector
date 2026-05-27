/**
 * @fileoverview Constructs the per-request analysis prompt sent to Gemini.
 *
 * The prompt is deliberately structured with clear sections so the model can
 * extract each signal independently while keeping its output consistent.
 */

import type { AnalyzeRequest } from '../types/index.js';

/** Maximum characters of the email body forwarded to the model. */
const MAX_BODY_LENGTH = 2_000;

/**
 * Build a structured analysis prompt from an incoming request.
 *
 * @param request - The validated analysis request.
 * @returns A formatted prompt string ready to send to the model.
 */
export function buildAnalysisPrompt(request: AnalyzeRequest): string {
  const truncatedBody =
    request.bodySnippet.length > MAX_BODY_LENGTH
      ? `${request.bodySnippet.slice(0, MAX_BODY_LENGTH)}… [truncated]`
      : request.bodySnippet;

  const linkSummary =
    request.links.length > 0
      ? request.links
          .map((link, i) => `  ${i + 1}. Display: "${link.displayText}" → URL: ${link.href}`)
          .join('\n')
      : '  (no links found)';

  const ruleFindingsSummary =
    request.ruleFindings.length > 0
      ? request.ruleFindings
          .map(
            (finding, i) =>
              `  ${i + 1}. [${finding.severity.toUpperCase()}] Rule "${finding.ruleId}": ${finding.explanation}`,
          )
          .join('\n')
      : '  (no heuristic findings)';

  return `Analyze the following email for scam, phishing, and manipulation risks.
Explain everything in simple, non-technical language that an elderly person would understand.

═══════════════════════════════════
SENDER INFORMATION
═══════════════════════════════════
  Name:   ${request.sender.name}
  Email:  ${request.sender.email}
  Domain: ${request.sender.domain}

═══════════════════════════════════
SUBJECT
═══════════════════════════════════
  ${request.subject}

═══════════════════════════════════
EMAIL BODY (snippet)
═══════════════════════════════════
${truncatedBody}

═══════════════════════════════════
LINKS FOUND IN EMAIL
═══════════════════════════════════
${linkSummary}

═══════════════════════════════════
HEURISTIC RULE-ENGINE PRE-FINDINGS
═══════════════════════════════════
Our local rule engine has already flagged the following concerns.
Consider these findings — they may confirm or supplement your analysis:
${ruleFindingsSummary}

═══════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════
Return your analysis as a single JSON object with exactly these fields:

{
  "risk_level":              "safe" | "low" | "medium" | "high" | "critical",
  "confidence":              <number between 0 and 1>,
  "detected_patterns":       [<list of detected scam/phishing patterns>],
  "explanation":             "<plain-language explanation for an elderly user>",
  "recommended_actions":     [<list of simple, actionable steps>],
  "sender_risk":             "<assessment of the sender's trustworthiness>",
  "link_risk":               "<assessment of links — mismatches, suspicious domains, etc.>",
  "urgency_detected":        <true if the email uses urgency/pressure tactics>,
  "impersonation_detected":  <true if the sender appears to impersonate a known entity>
}

IMPORTANT:
- Use simple words. Avoid technical jargon.
- Do NOT wrap the JSON in markdown code fences.
- Return ONLY the JSON object, nothing else.`;
}
