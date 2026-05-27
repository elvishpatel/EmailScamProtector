/**
 * @fileoverview Global Express error-handling middleware.
 *
 * Catches all uncaught errors, logs them safely (never exposing email
 * content), and returns an appropriate response to the client.
 */

import type { Request, Response, NextFunction } from 'express';

/** Whether the server is running in production mode. */
const isProduction = (): boolean => process.env['NODE_ENV'] === 'production';

/**
 * Global error handler — must be registered **after** all routes.
 *
 * Design decisions:
 * - Email content is never included in log output to protect user privacy.
 * - In development, the error message and stack are returned to aid debugging.
 * - In production, only a generic message is returned.
 */
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log safely — include the error name + message but never request body.
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    stack: isProduction() ? undefined : err.stack,
    timestamp: new Date().toISOString(),
  });

  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500;

  if (isProduction()) {
    res.status(statusCode).json({
      error: 'Internal server error',
      message: 'Something went wrong. Please try again later.',
    });
  } else {
    res.status(statusCode).json({
      error: err.name,
      message: err.message,
      stack: err.stack,
    });
  }
}
