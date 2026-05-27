/**
 * @fileoverview Controller for the `/api/analyze` endpoint.
 *
 * Orchestrates request handling: calls the AI service, returns the
 * structured response, and degrades gracefully on AI failure by
 * returning a partial result with an error flag.
 */

import type { Request, Response, NextFunction } from 'express';
import type { AnalyzeRequest, AnalyzeResponse } from '../types/index.js';
import { createAIService } from '../services/ai-service.js';

/** Lazily-initialised singleton AI service. */
let aiService: ReturnType<typeof createAIService> | null = null;

/**
 * Get or create the AI service singleton.
 *
 * Lazy initialisation means the constructor (which reads env vars) runs
 * only when the first request arrives — not at import time.
 */
function getAIService() {
  if (!aiService) {
    aiService = createAIService();
  }
  return aiService;
}

/**
 * Handle POST /api/analyze.
 *
 * Expects a validated {@link AnalyzeRequest} body (enforced by the
 * validator middleware registered on the route).
 *
 * On AI failure, returns a **partial result** so the frontend can still
 * show heuristic findings plus an "AI unavailable" banner instead of a
 * blank screen.
 */
export async function analyzeEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const request = req.body as AnalyzeRequest;

  try {
    const service = getAIService();
    const analysis: AnalyzeResponse = await service.analyze(request);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    // Log without email content to protect privacy.
    console.error('[ANALYZE] AI analysis failed:', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    // Degrade gracefully — return a partial result so the frontend can
    // still render the heuristic rule-engine findings.
    res.status(200).json({
      success: false,
      error: 'AI analysis is temporarily unavailable. Showing rule-engine results only.',
      data: {
        risk_level: 'unknown',
        confidence: 0,
        detected_patterns: [],
        explanation:
          'We could not complete the AI-powered analysis right now. ' +
          'Please rely on the rule-engine findings shown above and exercise caution.',
        recommended_actions: [
          'Do not click any links in this email until the analysis is available.',
          'If the email asks for personal information, do not respond.',
          'Try again in a few minutes.',
        ],
        sender_risk: 'Unable to assess — AI analysis unavailable.',
        link_risk: 'Unable to assess — AI analysis unavailable.',
        urgency_detected: false,
        impersonation_detected: false,
      } satisfies AnalyzeResponse,
    });
  }
}
