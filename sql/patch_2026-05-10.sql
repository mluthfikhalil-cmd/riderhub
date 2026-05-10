-- RiderHub — post-migration patch
-- Run this ONCE after schema.sql has been applied.
-- Fixes: duplicate segments, events.location backfill.

-- 1. Dedupe segments (keep oldest row per unique name+city+start coords)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY name, city, start_lat, start_lng, end_lat, end_lng
    ORDER BY created_at ASC
  ) AS rn
  FROM segments
)
DELETE FROM segments WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Also dedupe by name only (keep oldest) — some duplicates have slight
--    coord drift from re-seeding. The 8 canonical Palembang segments are
--    all uniquely named, so dedup-by-name is safe.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) AS rn
  FROM segments
)
DELETE FROM segments WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3. Add UNIQUE index on name so future re-seeds are truly idempotent
CREATE UNIQUE INDEX IF NOT EXISTS segments_name_idx ON segments(name);

-- 4. Backfill events.location from location_start for old rows
UPDATE events
SET location = location_start
WHERE (location IS NULL OR location = '')
  AND location_start IS NOT NULL
  AND location_start <> '';

-- 5. Verify counts
DO $$
DECLARE
  seg_count INTEGER;
  evt_empty_loc INTEGER;
BEGIN
  SELECT COUNT(*) INTO seg_count FROM segments;
  SELECT COUNT(*) INTO evt_empty_loc FROM events WHERE location IS NULL OR location = '';
  RAISE NOTICE 'segments count: %', seg_count;
  RAISE NOTICE 'events with empty location: %', evt_empty_loc;
END $$;
