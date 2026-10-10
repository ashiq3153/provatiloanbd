import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient<any>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Establishes a Supabase Auth identity before any user-scoped database work.
 * Anonymous Auth is used because Telegram is the product identity; the server
 * securely bridges the verified Telegram ID to this Supabase Auth user.
 *
 * Calls made concurrently during app startup share one sign-in request. This
 * avoids creating two anonymous users and then racing to bind Telegram to them.
 */
let anonymousSessionPromise: ReturnType<typeof supabase.auth.signInAnonymously> | null = null;

export async function ensureSupabaseAuthSession() {
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) return existing.session;

  if (!anonymousSessionPromise) {
    anonymousSessionPromise = supabase.auth.signInAnonymously().finally(() => {
      anonymousSessionPromise = null;
    });
  }

  const { data, error } = await anonymousSessionPromise;
  if (error || !data.session) {
    throw error || new Error('Unable to establish Supabase Auth session');
  }
  return data.session;
}
