/**
 * @fileoverview Main server entry point for the Email Scam Protector backend.
 *
 * Bootstraps Express with security middleware, routes, and error handling,
 * then listens on the configured port.
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';

import { createCorsMiddleware } from './middleware/cors.js';
import { createRateLimiter } from './middleware/rate-limiter.js';
import { globalErrorHandler } from './middleware/error-handler.js';
import { analyzeRouter } from './routes/analyze.js';
import { healthRouter } from './routes/health.js';

/* ------------------------------------------------------------------ */
/*  App initialisation                                                 */
/* ------------------------------------------------------------------ */

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

/* ------------------------------------------------------------------ */
/*  Global middleware                                                  */
/* ------------------------------------------------------------------ */

// Security headers
app.use(helmet());

// CORS — must come before routes so preflight requests are handled.
app.use(createCorsMiddleware());

// Rate limiting
app.use(createRateLimiter());

// Parse JSON bodies (limit size to avoid abuse).
app.use(express.json({ limit: '100kb' }));

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

app.use('/api/analyze', analyzeRouter);
app.use('/api/health', healthRouter);

/* ------------------------------------------------------------------ */
/*  Error handling (must be registered after all routes)               */
/* ------------------------------------------------------------------ */

app.use(globalErrorHandler);

/* ------------------------------------------------------------------ */
/*  Start server                                                       */
/* ------------------------------------------------------------------ */

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   Email Scam Protector — Backend API              ║
║   Port:        ${String(PORT).padEnd(35)}║
║   Environment: ${(process.env['NODE_ENV'] ?? 'development').padEnd(35)}║
║   Status:      ✓ Running                         ║
╚═══════════════════════════════════════════════════╝
  `);
});

export { app };
