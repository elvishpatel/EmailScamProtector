/**
 * @fileoverview Shared backend types and Zod validation schemas.
 *
 * All request/response shapes are defined here as Zod schemas so they can be
 * used both for TypeScript inference and runtime validation in middleware.
 */

import { z } from 'zod';

/* ------------------------------------------------------------------ */
/*  Request schemas                                                    */
/* ------------------------------------------------------------------ */

/** Schema for a parsed email link. */
export const LinkSchema = z.object({
  href: z.string().url('Link href must be a valid URL'),
  displayText: z.string().max(500, 'Display text must be 500 characters or fewer'),
});

/** Schema for a single rule-engine pre-finding. */
export const RuleFindingSchema = z.object({
  ruleId: z.string().min(1, 'ruleId is required'),
  severity: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'severity must be low, medium, high, or critical' }),
  }),
  explanation: z.string().min(1, 'explanation is required'),
});

/** Schema for sender metadata. */
export const SenderSchema = z.object({
  name: z.string().max(200, 'Sender name must be 200 characters or fewer'),
  email: z.string().email('Sender email must be a valid email address'),
  domain: z.string().min(1, 'Sender domain is required'),
});

/**
 * Schema for the POST /api/analyze request body.
 *
 * Validated in the request-validator middleware before reaching the controller.
 */
export const AnalyzeRequestSchema = z.object({
  sender: SenderSchema,
  subject: z.string().max(998, 'Subject must be 998 characters or fewer'),
  bodySnippet: z.string().max(5000, 'Body snippet must be 5 000 characters or fewer'),
  links: z.array(LinkSchema).max(50, 'At most 50 links are accepted'),
  ruleFindings: z.array(RuleFindingSchema).max(30, 'At most 30 rule findings are accepted'),
});

/* ------------------------------------------------------------------ */
/*  Response schemas                                                   */
/* ------------------------------------------------------------------ */

/**
 * Schema for the structured JSON returned by the AI model.
 *
 * Used to validate + type-narrow the parsed model output.
 */
export const AnalyzeResponseSchema = z.object({
  risk_level: z.string(),
  confidence: z.number().min(0).max(1),
  detected_patterns: z.array(z.string()),
  explanation: z.string(),
  recommended_actions: z.array(z.string()),
  sender_risk: z.string(),
  link_risk: z.string(),
  urgency_detected: z.boolean(),
  impersonation_detected: z.boolean(),
});

/* ------------------------------------------------------------------ */
/*  Inferred TypeScript types                                          */
/* ------------------------------------------------------------------ */

/** Validated request body for email analysis. */
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/** Structured AI analysis result. */
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

/** A single link extracted from the email. */
export type Link = z.infer<typeof LinkSchema>;

/** A single heuristic rule finding. */
export type RuleFinding = z.infer<typeof RuleFindingSchema>;

/** Sender metadata. */
export type Sender = z.infer<typeof SenderSchema>;
