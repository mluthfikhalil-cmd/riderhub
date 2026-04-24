-- RiderHub Database Schema
-- Run this in Supabase SQL Editor

-- 1. Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location_start TEXT,
  location_end TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  organizer_name TEXT,
  participants_count INTEGER DEFAULT 0,
  max_participants INTEGER,
  category TEXT DEFAULT 'Sunmori',
  status TEXT DEFAULT 'upcoming',
  image_emoji TEXT DEFAULT '🏍️',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Parts/Marketplace Table
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER,
  condition TEXT,
  category TEXT,
  seller_name TEXT,
  location TEXT,
  status TEXT DEFAULT 'available',
  image_emoji TEXT DEFAULT '🔧',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  motor TEXT,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  image_emoji TEXT DEFAULT '🏍️',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROWN LEVEL SECURITY;

-- 5. Public read access
CREATE POLICY "Public events" ON events FOR SELECT USING (true);
CREATE POLICY "Public parts" ON parts FOR SELECT USING (true);
CREATE POLICY "Public posts" ON posts FOR SELECT USING (true);