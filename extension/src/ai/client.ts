import type { EmailData } from '../types/email';
import type { RuleMatch, AIAnalysisResponse } from '../types/analysis';
import { sanitizeForAI } from './sanitizer';

/**
 * Send sanitized email data to the backend for AI analysis.
 * Returns null on any error — the extension gracefully falls back to rules-only.
 */
export async function analyzeWithAI(
  email: EmailData,
  ruleFindings: RuleMatch[],
  backendUrl: string
): Promise<AIAnalysisResponse | null> {
  try {
    const sanitized = sanitizeForAI(email);

    const requestBody = {
      sender: {
        name: email.sender.name,
        email: email.sender.email,
        domain: email.sender.domain,
      },
      subject: sanitized.subject,
      bodySnippet: sanitized.bodySnippet,
      links: sanitized.links,
      ruleFindings: ruleFindings.map(r => ({
        ruleId: r.ruleId,
        severity: r.severity,
        explanation: r.explanation,
      })),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${backendUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[ESP] AI API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.success && data.data) {
      return data.data as AIAnalysisResponse;
    }

    console.error('[ESP] AI API returned unsuccessful response');
    return null;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('[ESP] AI request timed out');
    } else {
      console.error('[ESP] AI request failed:', error);
    }
    return null;
  }
}
