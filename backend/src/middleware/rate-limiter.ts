/**
 * @fileoverview Express rate-limiting middleware.
 *
 * Reads configuration from environment variables so limits can be tuned
 * per-deployment without code changes.
 */

import rateLimit from 'express-rate-limit';

/**
 * Create a configured rate-limiter middleware.
 *
 * Environment variables:
 * - `RATE_LIMIT_MAX`            — Max requests per window (default: 100).
 * - `RATE_LIMIT_WINDOW_MINUTES` — Window duration in minutes (default: 15).
 *
 * @returns An Express middleware that enforces request rate limits.
 */
export function createRateLimiter() {
  const max = parseInt(process.env['RATE_LIMIT_MAX'] ?? '100', 10);
  const windowMinutes = parseInt(process.env['RATE_LIMIT_WINDOW_MINUTES'] ?? '15', 10);

  return rateLimit({
    windowMs: windowMinutes * 60 * 1_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests',
      message: `You have exceeded the limit of ${max} requests per ${windowMinutes} minute(s). Please wait and try again later.`,
      retryAfterMinutes: windowMinutes,
    },
  });
}
