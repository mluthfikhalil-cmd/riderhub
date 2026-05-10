-- RiderHub — Reset parts table
-- Jalankan di Supabase SQL Editor KALAU lo mau clean-state marketplace
-- dengan 32 produk curated dari sql/data.sql.
--
-- SAFETY: ini ngapus SEMUA parts termasuk yang lo input manual.
-- Pastikan backup kalau perlu.
--
-- After this script, run sql/data.sql untuk populate ulang.

BEGIN;

-- 1. Wipe all existing parts
DELETE FROM parts;

-- 2. Verify
DO $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining FROM parts;
  RAISE NOTICE 'Parts remaining after wipe: %', remaining;
  IF remaining > 0 THEN
    RAISE EXCEPTION 'Wipe failed, rolling back';
  END IF;
END $$;

COMMIT;

-- Now run sql/data.sql in a new query to seed 32 curated products.
