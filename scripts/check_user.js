// Check what email is registered for user id 86e89b49-f3b7-424f-b098-47ea32a444d4
// Uses Supabase admin API via service role key from .env.local

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const urlMatch = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

const SUPABASE_URL = urlMatch?.[1]?.trim();
const ANON_KEY = keyMatch?.[1]?.trim();

// We can't get email with anon key (RLS blocks auth.users)
// But we can check what the profile says and test login
console.log('Supabase URL:', SUPABASE_URL);
console.log('User ID: 86e89b49-f3b7-424f-b098-47ea32a444d4');
console.log('Profile name: lil');
console.log('');
console.log('To find your email:');
console.log('  Supabase Dashboard → Authentication → Users → search "lil"');
console.log('  OR check the email you used when you first registered in the app');
console.log('');
console.log('The admin login uses the SAME email+password as your regular app login.');
console.log('Make sure you are using the correct credentials.');
