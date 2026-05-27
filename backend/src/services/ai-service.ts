/**
 * @fileoverview AI service abstraction layer.
 *
 * Defines a provider-agnostic {@link AIService} interface and a factory
 * function that returns the current concrete implementation (Gemini).
 *
 * To switch providers (e.g. from Gemini to OpenAI), create a new adapter
 * that implements {@link AIService} and update {@link createAIService}.
 */

import type { AnalyzeRequest, AnalyzeResponse } from '../types/index.js';
import { GeminiAdapter } from './gemini-adapter.js';

/**
 * Provider-agnostic interface for email scam analysis.
 *
 * Every AI adapter must implement this contract so the rest of the codebase
 * remains decoupled from any specific vendor SDK.
 */
export interface AIService {
  /**
   * Analyze an email for scam / phishing indicators.
   *
   * @param request - A validated {@link AnalyzeRequest}.
   * @returns A structured {@link AnalyzeResponse}.
   */
  analyze(request: AnalyzeRequest): Promise<AnalyzeResponse>;
}

/**
 * Factory that returns the active AI service implementation.
 *
 * Currently returns a {@link GeminiAdapter}.  Swapping providers is a
 * single-line change here — no other code needs to be modified.
 *
 * @returns A ready-to-use {@link AIService} instance.
 */
export function createAIService(): AIService {
  return new GeminiAdapter();
}
