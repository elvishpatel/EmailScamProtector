/**
 * @fileoverview Gemini 2.5 Flash adapter for email scam analysis.
 *
 * Wraps the @google/generative-ai SDK and implements the {@link AIService}
 * interface so the provider can be swapped without touching calling code.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

import type { AnalyzeRequest, AnalyzeResponse } from '../types/index.js';
import { AnalyzeResponseSchema } from '../types/index.js';
import { SYSTEM_PROMPT } from '../prompts/system-prompt.js';
import { buildAnalysisPrompt } from '../prompts/analysis-prompt.js';
import type { AIService } from './ai-service.js';

/** Gemini model identifier. */
const MODEL_NAME = 'gemini-2.5-flash';

/** Maximum time (ms) to wait for a Gemini response. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Sampling temperature — low for deterministic analysis. */
const TEMPERATURE = 0.3;

/**
 * Adapter that sends analysis requests to Google Gemini 2.5 Flash.
 *
 * Implements {@link AIService} so consumers are decoupled from the provider.
 */
export class GeminiAdapter implements AIService {
  private readonly model;

  /**
   * @param apiKey - Google AI Studio API key.  Defaults to the
   *   `GEMINI_API_KEY` environment variable.
   * @throws {Error} If no API key is available.
   */
  constructor(apiKey?: string) {
    const key = apiKey ?? process.env['GEMINI_API_KEY'];
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY is not set. Provide it via the environment or constructor argument.',
      );
    }

    const genAI = new GoogleGenerativeAI(key);
    this.model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: TEMPERATURE,
        responseMimeType: 'application/json',
      },
    });
  }

  /**
   * Analyze an email for scam / phishing indicators.
   *
   * @param request - Pre-validated analysis request.
   * @returns Parsed {@link AnalyzeResponse} from the model.
   * @throws {Error} On timeout, network failure, or unparseable model output.
   */
  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const prompt = buildAnalysisPrompt(request);

    const result = await Promise.race([
      this.model.generateContent(prompt),
      this.createTimeout(),
    ]);

    const text = result.response.text();
    return this.parseResponse(text);
  }

  /* ---------------------------------------------------------------- */
  /*  Private helpers                                                  */
  /* ---------------------------------------------------------------- */

  /**
   * Create a promise that rejects after {@link REQUEST_TIMEOUT_MS}.
   */
  private createTimeout(): Promise<never> {
    return new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Gemini request timed out after ${REQUEST_TIMEOUT_MS}ms`));
      }, REQUEST_TIMEOUT_MS);
    });
  }

  /**
   * Parse and validate raw model output into a typed {@link AnalyzeResponse}.
   *
   * Strips markdown code fences if the model accidentally wraps its output.
   */
  private parseResponse(raw: string): AnalyzeResponse {
    let cleaned = raw.trim();

    // Strip markdown fences the model may emit despite instructions.
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(
        `Failed to parse Gemini response as JSON. Raw output starts with: "${raw.slice(0, 120)}…"`,
      );
    }

    const validated = AnalyzeResponseSchema.safeParse(parsed);
    if (!validated.success) {
      const issues = validated.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new Error(`Gemini response failed schema validation: ${issues}`);
    }

    return validated.data;
  }
}
