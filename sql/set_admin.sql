-- Set admin untuk akun lo (id: 86e89b49-f3b7-424f-b098-47ea32a444d4)
-- Run di Supabase Dashboard → SQL Editor → New Query → Run

-- 1. Set is_admin di profiles table (sudah done)
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = '86e89b49-f3b7-424f-b098-47ea32a444d4';

-- 2. Set is_admin di auth.users metadata (WAJIB — ini yang dicek AdminScreen)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE id = '86e89b49-f3b7-424f-b098-47ea32a444d4';

-- 3. Verify
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'is_admin' as meta_is_admin,
  p.is_admin as profile_is_admin,
  p.name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.id = '86e89b49-f3b7-424f-b098-47ea32a444d4';
