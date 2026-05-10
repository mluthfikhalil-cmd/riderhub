-- RiderHub — post-migration patch
-- Run this ONCE after schema.sql has been applied.
-- Fixes: duplicate segments, events.location backfill, parts reset for Shopee.

-- 1. Dedupe segments (keep oldest row per unique name+city+start coords)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY name, city, start_lat, start_lng, end_lat, end_lng
    ORDER BY created_at ASC
  ) AS rn
  FROM segments
)
DELETE FROM segments WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Also dedupe by name only
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) AS rn
  FROM segments
)
DELETE FROM segments WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3. UNIQUE on segments.name (safe — run once)
CREATE UNIQUE INDEX IF NOT EXISTS segments_name_idx ON segments(name);

-- 4. Backfill events.location from location_start for old rows
UPDATE events
SET location = location_start
WHERE (location IS NULL OR location = '')
  AND location_start IS NOT NULL
  AND location_start <> '';

-- 5. Dedupe existing parts by title (keep oldest)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at ASC) AS rn
  FROM parts
)
DELETE FROM parts WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 6. Ensure UNIQUE title on parts (safe after dedup)
CREATE UNIQUE INDEX IF NOT EXISTS parts_title_idx ON parts(title);

-- 7. Optional: wipe legacy placeholder parts from earlier test data.
--    UNCOMMENT next 2 lines to clear all old parts and re-seed from data.sql
--    (useful if you seeded before the curated Shopee list was added):
-- DELETE FROM parts;
-- (after DELETE, run sql/data.sql to populate with the 32 curated products)

-- 8. Verify counts
DO $$
DECLARE
  seg_count INTEGER;
  evt_empty_loc INTEGER;
  parts_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO seg_count FROM segments;
  SELECT COUNT(*) INTO evt_empty_loc FROM events WHERE location IS NULL OR location = '';
  SELECT COUNT(*) INTO parts_count FROM parts;
  RAISE NOTICE 'segments count: %', seg_count;
  RAISE NOTICE 'events with empty location: %', evt_empty_loc;
  RAISE NOTICE 'parts count: %', parts_count;
END $$;
