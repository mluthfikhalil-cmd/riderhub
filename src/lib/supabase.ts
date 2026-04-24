import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
// In production, set these in Vercel Environment Variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wqnpyzjixjkjygeulfvo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnB5emppeGpranlnZXVsZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTQ2MDYsImV4cCI6MjA5MjU3MDYwNn0.eTZHCgSCRuCoG0wD9BzrF28oSO8SO35ZXSBwqAUjEfM';

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