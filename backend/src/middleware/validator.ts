/**
 * @fileoverview Request body validation middleware.
 *
 * Uses the Zod schemas defined in `types/index.ts` to validate the
 * incoming request body before it reaches the controller.
 */

import type { Request, Response, NextFunction } from 'express';
import { AnalyzeRequestSchema } from '../types/index.js';

/**
 * Middleware that validates the request body against {@link AnalyzeRequestSchema}.
 *
 * On validation failure, responds with HTTP 400 and a structured error
 * payload listing every field issue.  On success, passes control to the
 * next handler with `req.body` guaranteed to conform to {@link AnalyzeRequest}.
 */
export function validateAnalyzeRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = AnalyzeRequestSchema.safeParse(req.body);

  if (!result.success) {
    const fieldErrors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      error: 'Validation failed',
      message: 'The request body contains invalid or missing fields.',
      details: fieldErrors,
    });
    return;
  }

  // Replace body with the parsed (and potentially coerced) data.
  req.body = result.data;
  next();
}
