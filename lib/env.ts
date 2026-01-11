import { z } from 'zod';

/**
 * Centralized, typed environment variable parsing.
 * Keeps runtime failures obvious and early.
 *
 * IMPORTANT (Next.js): do not parse env at module import time.
 * Next may evaluate route modules during `next build`, and throwing here
 * would break builds in environments where secrets are not present.
 */
const OpenAIModelSchema = z.enum([
  // Keep the allowed set intentionally small and well-supported.
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1-mini',
  'gpt-4.1',
  'gpt-4.1-nano'
]);

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  // Optional: choose a model without code changes.
  OPENAI_MODEL: OpenAIModelSchema.optional()
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = EnvSchema.parse(process.env);
  return cachedEnv;
}

