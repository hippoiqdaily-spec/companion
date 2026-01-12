import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../env';

/**
 * Server-only Supabase client.
 *
 * Uses the Service Role key so API routes can write to the database safely
 * without requiring user auth. Never expose this key to the browser.
 */
export function supabaseServer() {
  const env = getEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

