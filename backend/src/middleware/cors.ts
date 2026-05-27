/**
 * @fileoverview CORS middleware configuration.
 *
 * Reads allowed origins from the `ALLOWED_ORIGINS` environment variable
 * (comma-separated).  Falls back to permitting chrome-extension:// and
 * localhost origins for local development.
 */

import cors from 'cors';

/** Origins allowed when no `ALLOWED_ORIGINS` env var is set. */
const DEFAULT_ORIGINS: string[] = [
  'chrome-extension://',
  'http://localhost:3000',
  'http://localhost:5173',
];

/**
 * Build the CORS middleware with environment-driven origin allow-list.
 *
 * Chrome extension origins use the `chrome-extension://` scheme followed
 * by the extension ID — we match by prefix so any extension ID is accepted
 * when the `chrome-extension://` wildcard is in the list.
 *
 * @returns Configured CORS middleware.
 */
export function createCorsMiddleware() {
  const envOrigins = process.env['ALLOWED_ORIGINS'];

  const allowedOrigins: string[] = envOrigins
    ? envOrigins.split(',').map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ORIGINS;

  return cors({
    origin(origin, callback) {
      // Allow server-to-server requests (no origin header).
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed = allowedOrigins.some((allowed) => {
        // Prefix match for schemes like chrome-extension://
        if (allowed.endsWith('://')) {
          return origin.startsWith(allowed);
        }
        return origin === allowed;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin "${origin}" is not allowed by CORS policy`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86_400, // Cache preflight for 24 hours
  });
}
