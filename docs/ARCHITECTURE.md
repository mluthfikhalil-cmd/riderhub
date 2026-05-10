# RiderHub — Architecture & Data Model

**Last updated:** 2026-05-10

## 1. System overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React Native)                       │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Web     │  │  iOS     │  │ Android  │  │  PWA     │             │
│  │ (Metro+  │  │ (Expo)   │  │ (Expo)   │  │ installed│             │
│  │  Vercel) │  │          │  │          │  │          │             │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
│                             │                                       │
│           ┌─────────────────┼────────────────────┐                  │
│           │                 │                    │                  │
│      AuthContext       Navigation          PWA lib                  │
│      (Supabase)        (stack+tabs)    (SW register,                │
│                                        install prompt)              │
└───────────┼─────────────────────────────┼───────────────────────────┘
            │                             │
            │ HTTPS                       │ HTTPS (CDN tiles)
            │                             │
┌───────────▼───────────────┐   ┌─────────▼──────────┐
│  SUPABASE (backend)       │   │  3rd PARTY (web)   │
│                           │   │                    │
│  ┌───────────────────┐    │   │  OSRM (snap-road)  │
│  │  Auth (JWT)       │    │   │  Carto (map tiles) │
│  └───────────────────┘    │   │  unpkg (Leaflet)   │
│  ┌───────────────────┐    │   │  cdnjs (Three.js)  │
│  │  Postgres + RLS   │    │   │  WhatsApp deeplink │
│  │  18 tables        │    │   │                    │
│  └───────────────────┘    │   └────────────────────┘
│  ┌───────────────────┐    │
│  │  Storage          │    │
│  │  (riderhub-       │    │
│  │   uploads bucket) │    │
│  └───────────────────┘    │
│  ┌───────────────────┐    │
│  │  Realtime (unused │    │
│  │   but available)  │    │
│  └───────────────────┘    │
└───────────────────────────┘
```

### Key principles

- **Thin backend**: no custom API server, Supabase handles everything (auth, DB, storage). All business logic lives in the client.
- **RLS-gated data**: every table has Row Level Security. The anon key can only read/write what policies allow, so leaking the key doesn't expose user data.
- **Single canonical source**: `profiles` mirrors info already in `auth.users.user_metadata` — but `user_metadata` is the ultimate source of truth for session-driven flags (`onboarded`), while `profiles` is the queryable source for listings.
- **Web-first**: app designed for web/PWA primarily. Native Expo build works but some features are web-only (Configurator, RideReplay recording, Leaflet map).

---

## 2. Database schema

18 tables, all under `public` schema, all RLS-enabled.

### 2.1 Entity-relationship diagram

```
auth.users (Supabase-managed)
    │
    ├──< profiles (1:1, id = auth.users.id)
    │       │ name, bio, motor_brand, motor_model, motor_plate
    │       │ onboarded, is_admin, updated_at
    │
    ├──< bikes (1:N)
    │       │ brand, model, plate_number, year
    │       │ odometer_km, oil_change_km, last_service_date
    │       │ is_primary (partial UNIQUE per user)
    │       │
    │       └──< service_records (1:N)
    │               │ type, odometer_km, cost, notes, service_date
    │
    ├──< rides (1:N)
    │       │ title, distance, duration, avg_speed, max_speed
    │       │ date, route_path (JSONB: [{lat,lng,speed}])
    │       │
    │       └──< segment_efforts (1:N, ride_id → rides.id)
    │               │ segment_id → segments.id
    │               │ elapsed_seconds, avg_speed, date
    │
    ├──< posts (1:N, global feed)
    │       │ user_name, motor, content, image_url
    │       │ likes_count, comments_count
    │       │
    │       ├──< post_likes (N:M via user_id)
    │       └──< comments (1:N)
    │               │ user_name, content
    │
    ├──< group_members (N:M, user_id ↔ group_id)
    ├──< group_posts (1:N, in specific group)
    ├──< user_achievements (1:N, achievement_id TEXT)
    └──< notifications (1:N)
            │ icon, title, message, category, is_read

events (standalone, organizer-linked)
    │ organizer_id → auth.users.id
    │ title, description, event_date, location
    │ category, status (pending|upcoming|rejected|past)

parts (standalone marketplace)
    │ title, price, category, seller_name, location
    │ image_url, image_emoji, active, rating, sold, badge
    │ affiliate_url

groups (communities)
    │ organizer_id → auth.users.id
    │ name, category, location, member_count, status

segments (pre-seeded race routes)
    │ name (UNIQUE), city, distance_km
    │ start_lat/lng, end_lat/lng
    │
    └──< segment_efforts

group_rides (auto-detected; currently disabled)
    │ name, date, leader_id
    │
    └──< group_ride_members (N:M)
```

### 2.2 Table inventory

| Table | Purpose | RLS policy summary |
|---|---|---|
| `profiles` | User's public profile mirror | public read; self insert/update |
| `bikes` | User's motor garage | own read/write/update/delete |
| `events` | Touring/sunmori events | public read; organizer writes |
| `parts` | Marketplace listings | public read (active only); admin writes |
| `posts` | Global community feed | public read; authed writes own |
| `post_likes` | Per-user likes | own read/write/delete |
| `comments` | Post comments | public read; authed writes own |
| `groups` | Rider communities | public read; organizer writes |
| `group_members` | Membership pivot | public read; self join/leave |
| `group_posts` | Per-group discussions | public read; authed writes own |
| `rides` | Completed rides | own read/write/update/delete |
| `segments` | Pre-seeded race segments | public read |
| `segment_efforts` | User's times on segments | public read; authed inserts own |
| `group_rides` | Auto-detected shared rides | public read (generation disabled) |
| `group_ride_members` | Group ride pivot | public read |
| `user_achievements` | Unlocked badge IDs | own read/write |
| `service_records` | Service history | own read/write/update/delete |
| `notifications` | In-app alerts | own read/update/delete |

### 2.3 Important column semantics

**`rides.distance`, `rides.duration`, etc are `TEXT`, not numeric.**
Stored as human-readable ("12.34 km", "45m 30s") because they were pre-rendered at save time. The `parseKm()` / `parseSpeedKmh()` helpers in `src/lib/geo.ts` strip non-digits to do math. Not ideal for aggregations — future migration would split into numeric columns.

**`rides.route_path` is `JSONB`.**
Array of `{lat, lng, speed}` objects. Truncated to last 500 points on save (older points dropped to keep payload small).

**`bikes.is_primary` has a partial UNIQUE index.**
```sql
CREATE UNIQUE INDEX bikes_user_primary_idx ON bikes(user_id) WHERE is_primary = TRUE;
```
Only one primary bike per user. Code uses demote-then-promote pattern to swap.

**`events.location` vs `location_start`/`location_end`.**
Old schema had `location_start`/`location_end`. New code uses `location`. Patch backfills `location` from `location_start`. Both kept for compatibility.

**`segments.name` is now UNIQUE.**
Prevents seed duplication on re-running `schema.sql`. Before the patch, 20 rows accumulated for 8 logical segments.

**`user_achievements.achievement_id` is `TEXT`, not FK.**
The 17 achievement definitions live in `src/utils/achievements.ts` as a TypeScript constant (`ACHIEVEMENTS`). DB only stores which IDs a user has unlocked. Tradeoff: adding/removing achievements is a code deploy, not a DB migration.

### 2.4 RLS pattern

Three levels:
1. **Public read**: `FOR SELECT USING (TRUE)` — events, parts, posts, groups, segments
2. **Own read/write**: `USING (auth.uid() = user_id)` — bikes, rides, service_records, notifications, user_achievements
3. **Authed insert only**: `FOR INSERT WITH CHECK (auth.uid() = user_id)` — comments, posts, segment_efforts (no update/delete policy means those are blocked)

Admin access is NOT enforced via RLS. The `is_admin` flag in `profiles` is only checked client-side in `AdminScreen`. For real admin security, RLS on write-heavy tables would need `OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin)`. Not done yet — admin screen is effectively "trust the client".

---

## 3. Auth flow

```
┌─────────────┐  open app  ┌────────────────┐
│  Landing    │ ─────────► │ AuthProvider   │
│  (public)   │            │ init + listen  │
└─────────────┘            └────────┬───────┘
       │                            │
       │ tap login/register         │ Supabase session exists?
       │                            │
       ▼                            ▼
┌─────────────┐ signIn/Up  ┌────────────────┐
│  Login/Reg  │ ─────────► │ Supabase Auth  │
│  modal      │            │ (JWT + refresh)│
└─────────────┘            └────────┬───────┘
                                    │
                       session change fires
                                    │
                                    ▼
                            ┌────────────────┐
                            │  user state    │
                            │  updates in    │
                            │  context       │
                            └────────┬───────┘
                                     │
                   user.user_metadata.onboarded?
                          yes │         │ no
                              ▼         ▼
                       ┌─────────┐  ┌────────────┐
                       │  Main   │  │ Onboarding │
                       │  Tabs   │  │ (4 steps)  │
                       └─────────┘  └────────────┘
```

- **Source of truth for "onboarded"**: `auth.users.user_metadata.onboarded` (JWT claim).
- Why metadata not DB? Because it's checked on every render in `App.tsx` (`needsOnboarding`) and needs to flip instantly without a query.
- `profiles.onboarded` is the queryable mirror, updated at the same time (useful for admin listings).

**`signOut` storage cleanup**: only clears keys matching `sb-*`, `supabase`, `riderhub-auth`. Explicitly preserves `riderhub_cart_items`, `riderhub_liked_posts`, `riderhub_joined_*` so local state survives re-login.

**Custom `safeFetch`** in `src/lib/supabase.ts`: strips non-ISO-8859-1 chars from request headers. Workaround for a Supabase-JS bug when user metadata contains emoji — the library JSON-encodes metadata into a header, and non-latin1 bytes break Fetch on some browsers. The strip is only for headers, so emoji in body content is fine.

---

## 4. Navigation architecture

```
Root Stack (native-stack)
  │
  ├─ Landing (unauthenticated)
  │    └─ Modal: Login / Register
  │
  ├─ Onboarding (authed but not onboarded)
  │    │ Step 1: Brand (22 options)
  │    │ Step 2: Model (200+ options, searchable)
  │    │ Step 3: Plate + Odometer + Oil km
  │    └ Step 4: Success → "Enter RiderHub"
  │
  └─ Main stack (authed + onboarded)
       │
       ├─ Main (bottom tabs)
       │    ├─ Home        — dashboard + quick actions
       │    ├─ Events      — event list + create
       │    ├─ Parts       — marketplace + cart
       │    ├─ Community   — feed + communities
       │    └─ Profile     — stats + settings
       │
       ├─ Garage           — bike list, add/edit/delete
       ├─ RideHistory      — tracker + history list
       ├─ RideReplay       — canvas animation + WebM export
       ├─ RideSummary      — post-ride card (calories, badges)
       ├─ Leaderboard      — segments + group rides
       ├─ Achievements     — badge grid with tier filter
       ├─ Configurator     — 3D bike preview
       ├─ ServiceTracker   — oil/ban/rem/busi status
       ├─ CommunityDetail  — group feed + membership
       ├─ Cart             — checkout via WhatsApp
       ├─ Insurance        — documents (coming soon)
       ├─ Notifications    — alerts list
       ├─ Support          — FAQ + contact
       └─ Admin            — CRUD for events/parts, approval queue
```

Deep linking is mapped in `App.tsx` linking config. Every route has a URL path (e.g. `/history`, `/ride-summary`, `/service`) so PWA shortcuts + external sharing work.

Type safety is enforced globally: `src/navigation/types.ts` augments `ReactNavigation.RootParamList`, so every `useNavigation()` call or `navigation.navigate()` is fully typed.

---

## 5. PWA architecture

```
Browser
   │
   ├─ 1. Load /
   │    ↓
   │    dist/index.html (static HTML)
   │    ├─ <link rel="manifest" href="/manifest.json">
   │    ├─ theme-color + apple-mobile-web-app-* meta
   │    └─ <script src="/_expo/static/js/web/index-<hash>.js">
   │
   ├─ 2. JS executes
   │    ↓
   │    App.tsx → useEffect(initPWA) in src/lib/pwa.ts
   │    ├─ Register /sw.js (scope: /)
   │    └─ Listen for 'beforeinstallprompt' event
   │
   ├─ 3. Service Worker active
   │    ↓
   │    /sw.js handles fetch events
   │    ├─ Navigation (HTML) → network-first, cache fallback
   │    ├─ Static (.js/.css/.png) → cache-first, update on miss
   │    ├─ Supabase calls → bypass SW (never cached)
   │    └─ POST/PUT/DELETE → bypass SW
   │
   └─ 4. User taps "Install"
        ↓
        Browser prompt → promptPWAInstall() → installed
        ├─ Launches from home screen
        ├─ display: standalone (no browser UI)
        └─ Shortcuts: Ride / Garage / Service
```

### Manifest contents (`public/manifest.json`)

- **name/short_name**: `RiderHub`
- **display**: `standalone` (hides browser chrome)
- **theme_color**: `#00D67D` (neon green)
- **background_color**: `#000000` (OLED black)
- **start_url**: `/`
- **icons**: 48px favicon, 1024px icon (maskable), adaptive-icon
- **shortcuts**: 3 quick actions for installed app:
  - `Ride Tracker` → `/history`
  - `Garage` → `/garage`
  - `Service` → `/service`

### Service worker strategy

**Network-first for HTML**: always try to fetch fresh, fall back to cache only if offline. Prevents stale-app issue where users see old version after a deploy.

**Cache-first for assets**: JS/CSS/images are cached on first load, used immediately on subsequent loads. Makes the app feel instant after first visit.

**Supabase calls never cached**: URLs matching `supabase.co` skip the SW entirely. All DB reads stay realtime.

### Vercel integration

`vercel.json` sets:
- `sw.js`: `Cache-Control: public, max-age=0, must-revalidate` + `Service-Worker-Allowed: /` (required for root-scope SW)
- `manifest.json`: `Content-Type: application/manifest+json`
- Rewrites: static assets passthrough, everything else → `/index.html` (SPA)

### Post-build injection

`scripts/postbuild.js` runs after `expo export`:
1. Copies `public/*` → `dist/` (manifest, sw.js, robots.txt)
2. Copies `assets/{favicon,icon,adaptive-icon}.png` → `dist/` (so manifest icon paths resolve)
3. Injects PWA meta tags into `dist/index.html` (manifest link, theme-color, apple-* tags, OG/Twitter cards)

Idempotent: re-running doesn't double-inject.

---

## 6. Storage

Supabase Storage bucket: **`riderhub-uploads`** (must be pre-created, publicly readable).

Used by:
- `CommunityScreen.uploadToSupabase` — post image uploads (JPG, compressed to max 1024px on client)
- (Future: profile avatars, event banners, service photos)

Path convention: `posts/<timestamp>_<sanitized-filename>.jpg`.

Public URLs via `supabase.storage.from('riderhub-uploads').getPublicUrl(path)`.

---

## 7. Build & deploy pipeline

```
Local dev
  │
  ├─ npm start           → Expo dev server (Metro)
  ├─ npm run web         → Web dev with HMR
  ├─ npm run typecheck   → tsc --noEmit (strict)
  │
  └─ npm run build:web
      │
      ├─ 1. expo export --platform web
      │      │ Metro bundles to dist/_expo/static/js/web/index-<hash>.js
      │      │ Copies static assets
      │      └─ Writes dist/index.html with auto script tag
      │
      └─ 2. node scripts/postbuild.js
             │ Copies public/ + icons to dist/
             └─ Injects PWA meta into dist/index.html

Deploy (Vercel)
  │
  ├─ vercel                    → preview deployment
  │      URL: riderhub-<hash>-lils-projects-*.vercel.app
  │      Build: npm run build:web (from vercel.json)
  │
  ├─ vercel --prod             → prod (⚠ overwrites alias)
  │      URL: riderhub.vercel.app
  │      Alias: riderhub-ten.vercel.app
  │
  └─ vercel alias set <url> riderhub-ten.vercel.app
         → promote a preview deployment to production alias
         (safer than --prod)
```

**Safety rule**: previous production deployment (`dpl_63vct5uH...`) is the 3D-complete version. Do not `vercel --prod` without confirming the new build has feature-parity. Use `vercel alias set` after QA.

Rollback is always `vercel alias set <old-deployment-url> riderhub-ten.vercel.app`.
