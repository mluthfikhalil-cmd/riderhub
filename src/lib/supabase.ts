import { createClient } from '@supabase/supabase-js';

// Hardcoded fallback constants for production builds where Vercel env vars
// are not properly picked up by Metro bundler.
// The anon key is PUBLIC by design (enforced via RLS in Postgres), so committing
// it here is safe as long as RLS policies are correctly set.
// For development, .env.local takes precedence.
const FALLBACK_URL = 'https://wqnpyzjixjkjygeulfvo.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnB5emppeGpranlnZXVsZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTQ2MDYsImV4cCI6MjA5MjU3MDYwNn0.eTZHCgSCRuCoG0wD9BzrF28oSO8SO35ZXSBwqAUjEfM';

const envUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const envKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

const supabaseUrl = envUrl || FALLBACK_URL;
const supabaseAnonKey = envKey || FALLBACK_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (e.g. in .env.local / Vercel env).',
  );
}

// Custom fetch that prevents ISO-8859-1 header errors
const safeFetch: typeof fetch = (input, init) => {
  try {
    if (init?.headers) {
      const entries: [string, string][] = [];
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => entries.push([k, v.replace(/[^\x00-\xff]/g, '')]));
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([k, v]) => entries.push([k, String(v).replace(/[^\x00-\xff]/g, '')]));
      } else {
        Object.entries(init.headers as Record<string, string>).forEach(([k, v]) => entries.push([k, String(v).replace(/[^\x00-\xff]/g, '')]));
      }
      init = { ...init, headers: Object.fromEntries(entries) };
    }
  } catch (_) {}
  return fetch(input, init);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'riderhub-auth' },
  global: { fetch: safeFetch },
});
