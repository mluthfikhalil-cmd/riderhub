import { createClient } from '@supabase/supabase-js';

// Use environment variables - Replace these with your actual values
// In production, set these in Vercel dashboard
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wqnpyzjixjkjygeulfvo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count');
    if (error) throw error;
    console.log('✅ Supabase connected!');
    return true;
  } catch (err) {
    console.log('❌ Supabase error:', err.message);
    return false;
  }
};