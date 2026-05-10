import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (e.g. in .env.local / Vercel env).'
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