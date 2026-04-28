import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wqnpyzjixjkjygeulfvo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnB5emppeGpranlnZXVsZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTQ2MDYsImV4cCI6MjA5MjU3MDYwNn0.eTZHCgSCRuCoG0wD9BzrF28oSO8SO35ZXSBwqAUjEfM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);