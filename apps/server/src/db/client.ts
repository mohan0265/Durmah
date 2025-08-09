import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

let supabase: SupabaseClient;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL || 'http://localhost:54321';
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      'dev';
    supabase = createClient(url, key, { auth: { persistSession: false } });
  }
  return supabase;
}
