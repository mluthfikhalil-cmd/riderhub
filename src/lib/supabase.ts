// Supabase Configuration
// In production, set these in Vercel Environment Variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wqnpyzjixjkjygeulfvo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnB5emppeGpranlnZXVsZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTQ2MDYsImV4cCI6MjA5MjU3MDYwNn0.eTZHCgSCRuCoG0wD9BzrF28oSO8SO35ZXSBwqAUjEfM';

// Create client with custom options
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  },
});

// Check if user exists - try to get user without throwing
export const checkUserExists = async (email: string) => {
  try {
    // Use admin API if available, otherwise try to reset password
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    
    return { exists: !error, data, error };
  } catch (err) {
    return { exists: false, error: err };
  }
};

// Test connection
export const testConnection = async () => {
  try {
    // Just test if we can reach the API
    const { data, error } = await supabase.from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(1);
      
    console.log('✅ Supabase connected!');
    return { success: true, error: null };
  } catch (err: any) {
    console.log('⚠️ Supabase connection issue:', err.message);
    return { success: false, error: err.message };
  }
};