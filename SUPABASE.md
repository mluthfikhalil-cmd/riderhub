# RiderHub Supabase Setup

## 📋 Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bike_model TEXT,
  bike_plate TEXT,
  city TEXT,
  rides_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location_start TEXT,
  location_end TEXT,
  date TIMESTAMP WITH TIME ZONE,
  organizer_id UUID REFERENCES users(id),
  participants_count INTEGER DEFAULT 0,
  max_participants INTEGER,
  category TEXT,
  status TEXT DEFAULT 'upcoming',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Parts/Marketplace Table
```sql
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER,
  condition TEXT,
  category TEXT,
  seller_id UUID REFERENCES users(id),
  buyer_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'available',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Posts Table (Community)
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Post Likes
```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

### 6. Ride History
```sql
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  distance_km INTEGER,
  duration_minutes INTEGER,
  route_coordinates JSONB,
  date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 Auth Configuration

- **Providers**: Email + Password
- **Phone**: Indonesia format (+62)
- **Row Level Security**: Enable untuk semua tabel

---

## 🔗 Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📱 Next Steps

1. [ ] Create Supabase project
2. [ ] Run SQL schema
3. [ ] Get URL + Key
4. [ ] Update App.tsx with Supabase client
5. [ ] Add Auth screens (Login/Register)
6. [ ] Connect data to screens

---

## 📞 Support

- Docs: https://supabase.com/docs
- Dashboard: https://supabase.com/dashboard