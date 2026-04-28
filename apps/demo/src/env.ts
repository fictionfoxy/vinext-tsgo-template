import { z } from 'zod';

/**
 * Zod schema for all environment variables used by the demo app.
 * Optional vars have defaults; required vars throw at startup if missing.
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().optional().default('/api'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('[env] Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(` • ${issue.path.join('.')}: ${issue.message}`);
  }
  throw new Error('[env] App cannot start with invalid environment variables. See console for details.');
}

export const env = parsed.data;
