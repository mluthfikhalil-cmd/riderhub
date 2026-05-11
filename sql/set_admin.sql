-- Set admin flag for your account
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- Replace the email below with YOUR email address

-- Option A: Set by profile name "lil"
UPDATE profiles SET is_admin = TRUE WHERE name = 'lil';

-- Option B: Set by user ID (safer)
-- UPDATE profiles SET is_admin = TRUE WHERE id = '86e89b49-f3b7-424f-b098-47ea32a444d4';

-- Also update auth metadata so the check in AdminScreen works
-- (This requires service role key — do it via Supabase Dashboard → Authentication → Users → Edit user → user_metadata)
-- Or run this if you have service role access:
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
-- WHERE id = '86e89b49-f3b7-424f-b098-47ea32a444d4';

-- Verify
SELECT id, name, is_admin FROM profiles WHERE name = 'lil';
