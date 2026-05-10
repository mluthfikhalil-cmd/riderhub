-- RiderHub — complete database schema
-- Run in Supabase SQL editor. Idempotent (safe to re-run).
-- References auth.users implicitly via UUID; does not modify the auth schema.

-- Extensions -------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- profiles ---------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  bio TEXT,
  motor_brand TEXT,
  motor_model TEXT,
  motor_plate TEXT,
  onboarded BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- bikes ------------------------------------------------------
CREATE TABLE IF NOT EXISTS bikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  year TEXT,
  odometer_km INTEGER DEFAULT 0,
  oil_change_km INTEGER DEFAULT 0,
  last_service_date DATE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bikes_user_idx ON bikes(user_id);
-- Note: unique index for primary-per-user is created below (after ALTERs
-- ensure all required columns exist and after any stale primaries are reset).

-- events -----------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  location_start TEXT,
  location_end TEXT,
  contact TEXT,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organizer_name TEXT,
  participants_count INTEGER DEFAULT 0,
  max_participants INTEGER,
  category TEXT DEFAULT 'Sunmori',
  status TEXT DEFAULT 'pending', -- pending | upcoming | rejected | past
  image_emoji TEXT DEFAULT '🏍️',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS events_status_idx ON events(status);

-- parts ------------------------------------------------------
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER,
  condition TEXT,
  category TEXT,
  seller_name TEXT,
  location TEXT,
  image_url TEXT,
  image_emoji TEXT DEFAULT '🔧',
  affiliate_url TEXT,
  shopee_product_id TEXT,
  shopee_shop_id TEXT,
  rating NUMERIC(3,1) DEFAULT 4.8,
  sold INTEGER DEFAULT 0,
  badge TEXT,
  active BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- posts (global community feed) ------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  motor TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  image_emoji TEXT DEFAULT '🏍️',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- post_likes (for per-user likes; optional but referenced) ---
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- comments ---------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id);

-- groups -----------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  location TEXT,
  description TEXT,
  image_emoji TEXT DEFAULT '🏍️',
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organizer_name TEXT,
  member_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- pending | active | rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- group_members ---------------------------------------------
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- group_posts ------------------------------------------------
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- rides ------------------------------------------------------
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  distance TEXT,
  duration TEXT,
  avg_speed TEXT,
  max_speed TEXT,
  date DATE,
  route_path JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS rides_user_idx ON rides(user_id);
CREATE INDEX IF NOT EXISTS rides_date_idx ON rides(date);

-- segments ---------------------------------------------------
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  distance_km NUMERIC(6,2) NOT NULL,
  start_lat DOUBLE PRECISION NOT NULL,
  start_lng DOUBLE PRECISION NOT NULL,
  end_lat DOUBLE PRECISION NOT NULL,
  end_lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Unique name prevents seed duplicates on re-run
CREATE UNIQUE INDEX IF NOT EXISTS segments_name_idx ON segments(name);

-- segment_efforts --------------------------------------------
CREATE TABLE IF NOT EXISTS segment_efforts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  elapsed_seconds INTEGER NOT NULL,
  avg_speed NUMERIC(5,1),
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS effort_segment_idx ON segment_efforts(segment_id);
CREATE INDEX IF NOT EXISTS effort_user_idx ON segment_efforts(user_id);

-- group_rides (auto-detected shared rides) -------------------
CREATE TABLE IF NOT EXISTS group_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  date DATE,
  leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_ride_members (
  group_ride_id UUID NOT NULL REFERENCES group_rides(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  PRIMARY KEY (group_ride_id, user_id)
);

-- user_achievements ------------------------------------------
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- service_records --------------------------------------------
CREATE TABLE IF NOT EXISTS service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bike_id UUID REFERENCES bikes(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- oli | ban | rem | busi | filter | rantai | aki
  odometer_km INTEGER,
  notes TEXT,
  cost INTEGER,
  service_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS service_user_idx ON service_records(user_id);
CREATE INDEX IF NOT EXISTS service_bike_idx ON service_records(bike_id);

-- notifications (per-user in-app alerts) ---------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  icon TEXT DEFAULT 'notifications-outline',
  title TEXT NOT NULL,
  message TEXT,
  category TEXT DEFAULT 'System',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notif_user_idx ON notifications(user_id);

-- Backfill columns for pre-existing installs -----------------
-- CREATE TABLE IF NOT EXISTS is idempotent on table existence but NOT on columns;
-- these ALTER statements ensure columns are present before any policy references them.
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS motor_brand TEXT;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS motor_model TEXT;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS motor_plate TEXT;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE bikes     ADD COLUMN IF NOT EXISTS odometer_km INTEGER DEFAULT 0;
ALTER TABLE bikes     ADD COLUMN IF NOT EXISTS oil_change_km INTEGER DEFAULT 0;
ALTER TABLE bikes     ADD COLUMN IF NOT EXISTS last_service_date DATE;

ALTER TABLE events    ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE events    ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE events    ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE parts     ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE parts     ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE parts     ADD COLUMN IF NOT EXISTS affiliate_url TEXT;
ALTER TABLE parts     ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 4.8;
ALTER TABLE parts     ADD COLUMN IF NOT EXISTS sold INTEGER DEFAULT 0;
ALTER TABLE parts     ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE parts     ADD COLUMN IF NOT EXISTS shopee_product_id TEXT;
ALTER TABLE parts     ADD COLUMN IF NOT EXISTS shopee_shop_id TEXT;

-- Unique title on parts prevents seed duplicates on re-run (and rejects
-- admin from accidentally listing two identical products)
CREATE UNIQUE INDEX IF NOT EXISTS parts_title_idx ON parts(title);

ALTER TABLE posts     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE posts     ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE comments  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE groups    ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE groups    ADD COLUMN IF NOT EXISTS organizer_name TEXT;
ALTER TABLE groups    ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 1;

-- Ensure default values exist for active parts rows (in case the column
-- was just added and rows were created with NULL via older schemas)
UPDATE parts SET active = TRUE WHERE active IS NULL;

-- Deduplicate multiple primary bikes per user (artifact of earlier buggy
-- upsert). Must run before the partial unique index is created.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM bikes WHERE is_primary = TRUE
)
UPDATE bikes SET is_primary = FALSE
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Partial unique index: at most one primary bike per user.
CREATE UNIQUE INDEX IF NOT EXISTS bikes_user_primary_idx
  ON bikes(user_id) WHERE is_primary = TRUE;

-- Row Level Security ----------------------------------------
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups           ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides            ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_efforts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_rides      ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_ride_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;

-- Public reads (anyone authenticated can see content) -------
DO $$ BEGIN
  CREATE POLICY "public read events"   ON events   FOR SELECT USING (TRUE);
  CREATE POLICY "public read parts"    ON parts    FOR SELECT USING (active = TRUE);
  CREATE POLICY "public read posts"    ON posts    FOR SELECT USING (TRUE);
  CREATE POLICY "public read comments" ON comments FOR SELECT USING (TRUE);
  CREATE POLICY "public read groups"   ON groups   FOR SELECT USING (TRUE);
  CREATE POLICY "public read group_posts" ON group_posts FOR SELECT USING (TRUE);
  CREATE POLICY "public read segments" ON segments FOR SELECT USING (TRUE);
  CREATE POLICY "public read efforts"  ON segment_efforts FOR SELECT USING (TRUE);
  CREATE POLICY "public read group_rides" ON group_rides FOR SELECT USING (TRUE);
  CREATE POLICY "public read group_ride_members" ON group_ride_members FOR SELECT USING (TRUE);
  CREATE POLICY "public read profiles" ON profiles FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Owner-write policies --------------------------------------
DO $$ BEGIN
  -- profiles: user manages their own profile
  CREATE POLICY "self insert profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  CREATE POLICY "self update profiles" ON profiles FOR UPDATE USING (auth.uid() = id);

  -- bikes: own only
  CREATE POLICY "own read bikes"   ON bikes FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "own write bikes"  ON bikes FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "own update bikes" ON bikes FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "own delete bikes" ON bikes FOR DELETE USING (auth.uid() = user_id);

  -- rides: own only
  CREATE POLICY "own read rides"   ON rides FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "own write rides"  ON rides FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "own update rides" ON rides FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "own delete rides" ON rides FOR DELETE USING (auth.uid() = user_id);

  -- posts: authenticated users can insert; edit/delete own
  CREATE POLICY "auth insert posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "own update posts"  ON posts FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "own delete posts"  ON posts FOR DELETE USING (auth.uid() = user_id);

  -- post_likes
  CREATE POLICY "own read likes"   ON post_likes FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "own write likes"  ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "own delete likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

  -- comments: same pattern
  CREATE POLICY "auth insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "own update comments"  ON comments FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "own delete comments"  ON comments FOR DELETE USING (auth.uid() = user_id);

  -- events: organizer manages own
  CREATE POLICY "auth insert events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
  CREATE POLICY "own update events"  ON events FOR UPDATE USING (auth.uid() = organizer_id);
  CREATE POLICY "own delete events"  ON events FOR DELETE USING (auth.uid() = organizer_id);

  -- groups
  CREATE POLICY "auth insert groups" ON groups FOR INSERT WITH CHECK (auth.uid() = organizer_id);
  CREATE POLICY "own update groups"  ON groups FOR UPDATE USING (auth.uid() = organizer_id);

  -- group_members
  CREATE POLICY "auth read members"  ON group_members FOR SELECT USING (TRUE);
  CREATE POLICY "self join group"    ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "self leave group"   ON group_members FOR DELETE USING (auth.uid() = user_id);

  -- group_posts
  CREATE POLICY "auth insert gposts" ON group_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "own update gposts"  ON group_posts FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "own delete gposts"  ON group_posts FOR DELETE USING (auth.uid() = user_id);

  -- segment_efforts
  CREATE POLICY "auth insert efforts" ON segment_efforts FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- group_rides / members
  CREATE POLICY "auth insert group_rides" ON group_rides FOR INSERT WITH CHECK (TRUE);
  CREATE POLICY "auth insert grmembers"   ON group_ride_members FOR INSERT WITH CHECK (TRUE);

  -- achievements
  CREATE POLICY "own read ach"   ON user_achievements FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "own write ach"  ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- service records
  CREATE POLICY "own read svc"   ON service_records FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "own write svc"  ON service_records FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "own update svc" ON service_records FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "own delete svc" ON service_records FOR DELETE USING (auth.uid() = user_id);

  -- notifications
  CREATE POLICY "own read notif"   ON notifications FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "own update notif" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "own delete notif" ON notifications FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed: Palembang segments -----------------------------------
-- ON CONFLICT(name) prevents duplicates thanks to segments_name_idx.
INSERT INTO segments (name, city, distance_km, start_lat, start_lng, end_lat, end_lng)
VALUES
  ('Jembatan Ampera Sprint', 'Palembang', 1.20, -2.9923, 104.7636, -2.9988, 104.7675),
  ('Jakabaring Circuit',     'Palembang', 3.50, -3.0322, 104.7810, -3.0298, 104.7920),
  ('Bukit Siguntang Climb',  'Palembang', 2.10, -2.9870, 104.7400, -2.9825, 104.7360),
  ('Palembang - Indralaya',  'Palembang', 22.0, -3.0070, 104.7550, -3.2070, 104.6540),
  ('Simpang Polda Sprint',   'Palembang', 1.80, -2.9780, 104.7540, -2.9680, 104.7530),
  ('Prabumulih Highway',     'Palembang', 45.0, -3.1900, 104.6300, -3.4330, 104.2360),
  ('Kayu Agung Loop',        'Palembang', 18.0, -3.3930, 104.8260, -3.3100, 104.7200),
  ('Sriwijaya Route',        'Palembang', 4.60, -2.9900, 104.7550, -2.9850, 104.7680)
ON CONFLICT (name) DO NOTHING;
