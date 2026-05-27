/**
 * @fileoverview Health-check route for monitoring and load-balancer probes.
 */

import { Router } from 'express';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Router for health endpoints. */
export const healthRouter = Router();

/**
 * Read the version from package.json at startup.
 *
 * Uses a static read so the value is resolved once — not on every request.
 */
function getVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkgPath = resolve(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const APP_VERSION = getVersion();

/**
 * GET /api/health
 *
 * Returns a lightweight payload indicating the server is running.
 */
healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
  });
});
