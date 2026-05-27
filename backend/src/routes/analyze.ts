/**
 * @fileoverview Route definition for the `/api/analyze` endpoint.
 */

import { Router } from 'express';
import { validateAnalyzeRequest } from '../middleware/validator.js';
import { analyzeEmail } from '../controllers/analyze-controller.js';

/** Router for email analysis endpoints. */
export const analyzeRouter = Router();

/**
 * POST /api/analyze
 *
 * Validates the request body, then delegates to the analyze controller.
 */
analyzeRouter.post('/', validateAnalyzeRequest, analyzeEmail);
