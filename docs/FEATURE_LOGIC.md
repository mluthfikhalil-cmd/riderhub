# RiderHub — Feature Logic

Deep dive into how each major feature works. Read alongside `ARCHITECTURE.md`.

---

## Table of contents

1. [Authentication & Session](#1-authentication--session)
2. [Onboarding (4 steps)](#2-onboarding-4-steps)
3. [Home Dashboard](#3-home-dashboard)
4. [Garage (bike management)](#4-garage-bike-management)
5. [Ride Tracking (GPS)](#5-ride-tracking-gps)
6. [Ride Summary](#6-ride-summary)
7. [Ride Replay](#7-ride-replay)
8. [Service Tracker](#8-service-tracker)
9. [Achievements](#9-achievements)
10. [Leaderboard & Segments](#10-leaderboard--segments)
11. [Events](#11-events)
12. [Marketplace (Parts)](#12-marketplace-parts)
13. [Cart & Checkout](#13-cart--checkout)
14. [Community Feed](#14-community-feed)
15. [Community Groups](#15-community-groups)
16. [Notifications](#16-notifications)
17. [Admin Panel](#17-admin-panel)
18. [3D Configurator](#18-3d-configurator)
19. [Landing Page (marketing)](#19-landing-page-marketing)

---

## 1. Authentication & Session

**Files**: `src/context/AuthContext.tsx`, `src/lib/supabase.ts`, `src/screens/LandingScreen.tsx`

### Flow
1. App starts → `AuthProvider` calls `supabase.auth.getSession()` to check for existing session (persisted by Supabase JS in `localStorage` under `riderhub-auth`).
2. If session exists → `setUser(session.user)` → re-render → either `Main` or `Onboarding` based on `user.user_metadata.onboarded`.
3. If no session → render `LandingScreen`.
4. `onAuthStateChange` listener fires on every sign-in/sign-out/refresh, auto-syncing context state.

### Sign-in
`LandingScreen` modal → `signIn(email, password)` → `supabase.auth.signInWithPassword`. Error surfaced as text in modal. On success, session listener auto-navigates.

### Sign-up
Same modal with `name` extra field → `signUp(email, password, name)` writes `user_metadata.name`. If Supabase project requires email confirmation, returns `{ needsVerification: true }` and shows an alert (`window.alert` on web).

### Sign-out
`signOut` → `supabase.auth.signOut({ scope: 'local' })` + **selective** localStorage cleanup. Only keys matching `sb-*`, `supabase`, or `riderhub-auth` are removed. Cart, likes, joined-groups state survives.

### ISO-8859-1 header workaround
`supabase.ts` wraps `fetch` with a header sanitizer that strips non-latin1 chars. This is because Supabase JS encodes `user_metadata` into an `x-client-info` header when making API calls, and emoji in a user's name would crash the Fetch API on some browsers. Body content is untouched so emoji in posts/comments work fine.

### 3-second force-ready
`App.tsx` shows a loading screen while `AuthContext.loading` is true, but after 3 seconds forces `forceReady=true` to prevent infinite stall if auth init hangs. Logs a warning when this fires.

---

## 2. Onboarding (4 steps)

**File**: `src/screens/OnboardingScreen.tsx`

Triggered when `user.user_metadata.onboarded` is falsy.

### Step 1: Brand selection
Grid of 22 motorcycle brands (Honda, Yamaha, Ducati, ...). Tap to select, enables Next button.

### Step 2: Model selection
Shows models for selected brand (200+ across all brands, defined in `MODELS` constant). Searchable via text input — filters by `model.toLowerCase().includes(query)`.

### Step 3: Vehicle details
Three fields:
- **Plate number** — auto-uppercased, max 12 chars
- **Current odometer (km)** — required for accurate service tracking
- **Last oil change (km)** — optional, baseline for next-oil-change calculation

### Step 4: Success
Confirmation card, then "Enter RiderHub" button triggers navigation swap.

### Save logic
`handleSave` writes to 3 places atomically:
1. `profiles` upsert: `{ id, name, motor_brand, motor_model, motor_plate, onboarded: true }`
2. `bikes` — **demote-then-insert** pattern:
   ```typescript
   await supabase.from('bikes').update({ is_primary: false })
     .eq('user_id', uid).eq('is_primary', true);
   await supabase.from('bikes').insert({ ..., is_primary: true });
   ```
   This respects the partial unique index `(user_id) WHERE is_primary = TRUE`. Upsert with `onConflict: 'user_id'` would fail because users can have multiple bikes (no plain UNIQUE on user_id).
3. `auth.updateUser({ data: { motor, plate, onboarded: true } })` — updates JWT metadata, triggers `onAuthStateChange` → navigator swap.

### Skip flow
"Complete later" → only sets `onboarded: true` in metadata, doesn't write profile/bike. User can fill in later via Garage.

---

## 3. Home Dashboard

**File**: `src/screens/HomeScreen.tsx`

Read-only overview screen. Fetches primary bike on mount via `.maybeSingle()` (returns `null` without erroring if user has no primary bike).

### Sections
- **Header**: greeting + bike name + neon cyberpunk styling (purple accent). Notif bell + avatar click → Profile.
- **Hero image**: Ducati PNG from `assets/ducati-hero.png`, 220px high.
- **Quick action grid**: 4 circular icons: Ride / Servis / Badges / 3D — all route to real screens.
- **Info card**: static "Status Kendaraan 80%" — placeholder for future bike telemetry.
- **Menu list**: 5 items linking to Configurator, RideHistory, ServiceTracker, Leaderboard, Achievements.

### Refresh
Pull-to-refresh re-fetches the primary bike. If bike added in Garage, pull-to-refresh here picks it up.

---

## 4. Garage (bike management)

**File**: `src/screens/GarageScreen.tsx`

CRUD for user's bikes. All queries scoped to `user_id = auth.uid()`.

### List
`fetchBikes()` orders by `is_primary DESC, created_at DESC` — primary bike on top, then newest.

### Add
Modal with brand/model/plate/year inputs. `handleAddBike` inserts into `bikes`. First bike auto-set as primary (`is_primary: bikes.length === 0`).

Error handling: errors from Supabase bubble up as alerts; no silent mock fallback (previous version had this bug).

### Set primary
```typescript
await supabase.from('bikes').update({ is_primary: false })
  .eq('user_id', user.id).eq('is_primary', true);
await supabase.from('bikes').update({ is_primary: true })
  .eq('id', id).eq('user_id', user.id);
```
Demote-then-promote. Not wrapped in a transaction — if the second update fails, user briefly has no primary. Acceptable tradeoff since Supabase REST doesn't expose transactions over the anon key.

### Delete
Confirm dialog (web `window.confirm`, native `Alert.alert`), then `DELETE WHERE id AND user_id`.

---

## 5. Ride Tracking (GPS)

**File**: `src/screens/RideHistoryScreen.tsx`

The most complex feature. Uses `navigator.geolocation.watchPosition` on web, `expo-location` on native.

### State machine

GPS status goes through these states:

```
        start ride
           │
           ▼
      ┌─────────┐
      │acquiring│ ─────► (no fix 20s) ─┐
      │ (yellow)│                      │
      └────┬────┘                      │
           │ first fix                 ▼
           │                     ┌──────────┐
           ▼                     │ denied/  │
      ┌─────────┐   no fix 15s   │ lost     │
      │ locked  │ ──────────────►│ (yellow  │
      │ (red)   │                │  or gray)│
      └────┬────┘ ◄──────────────└──────────┘
           │ user taps Stop      fix recovers
           ▼
     save modal → saveRide()
```

States:
- **`idle`** — before tracking starts
- **`acquiring`** (yellow dot) — watch active but no fix yet
- **`locked`** (red dot, "RECORDING LIVE") — actively receiving fixes
- **`lost`** (yellow dot) — had fixes, now stale >15s
- **`denied`** (gray dot) — permission denied by user
- **`simulated`** (green dot) — opt-in fake GPS

### Refs vs state
Watchdog runs inside `setInterval`. If it read React state, the closure would capture the initial value forever. Solution: mirror critical state into refs:
- `trackingRef` — is the ride still active?
- `gpsStatusRef` — current GPS status
- `fixCountRef` — how many real fixes received
- `lastFixTimeRef` — timestamp of most recent fix

The `setGpsStatusSync` helper writes both state and ref in one call.

### Accuracy filter
```typescript
if (accuracy != null && accuracy > 150 && fixCountRef.current > 3) return;
```
First 3 fixes always accepted (GPS hasn't settled yet). After that, drop anything >150m accuracy. Previous version used 30m threshold which dropped every fix on cold starts.

### Distance calculation
Haversine between consecutive points. Accept only if 5m ≤ distance ≤ 2km (rejects jitter at low end, teleports at high end).

### Speed
Two sources:
1. Native `GeolocationCoordinates.speed` (in m/s) — preferred if valid (0 ≤ speed < 70 m/s = 252 km/h).
2. Computed from position delta / time delta — fallback.

Smoothed with a 5-sample rolling mean.

### Watchdog
Every 5 seconds:
- If `fixCountRef === 0` and still `acquiring`: update hint message ("Belum ada sinyal GPS...")
- If last fix >15s ago: mark `lost`, show reconnect message
- If was `lost` but fix just returned (<5s ago): mark `locked` again

### Error handling
Geolocation errors go through `handleGeoError` switch:
- Code 1 (PERMISSION_DENIED) → status `denied`, show "Aktifkan di browser settings"
- Code 2 (POSITION_UNAVAILABLE) → status `lost`, "Cek koneksi / coba di luar ruangan"
- Code 3 (TIMEOUT) → status `lost`, "GPS timeout. Mencari sinyal..."

### Simulation (opt-in)
"Use Simulated GPS" button appears only when:
- Permission denied, OR
- Still acquiring after 30 seconds

Starts from Ampera Palembang coordinates, walks randomly at 20-70 km/h. Never auto-replaces real tracking.

### Stop flow
1. `stopAll()` — clears timer, clears geolocation watch, clears watchdog, clears sim interval
2. `setTracking(false)` — hides HUD immediately
3. `setSaveModal(true)` — open save confirmation
4. If user confirms Save → `saveRide()`
5. If user taps Discard → state resets, no DB write

### Save
`saveRide` rejects rides with fewer than 2 coords ("tidak ada data GPS").

Payload:
```typescript
{
  user_id, title: "Ride May 10",
  distance: "12.34 km", duration: "45m 30s",
  avg_speed: "25.6 km/h", max_speed: "78 km/h",
  date: "2026-05-10",
  route_path: coords.slice(-500)  // last 500 points max
}
```

After insert:
1. Call `detectSegments(coords, rideId)` — detects segment matches, fires insertions (not awaited)
2. Fetch all rides, call `syncAchievements(userId, rides)` — returns newly-unlocked IDs
3. Navigate to `RideSummary` with ride + new unlocks

### Segment detection
For each segment in DB:
1. Find closest point in route to `segment.start_lat/lng` within 250m radius
2. Find closest point to `segment.end_lat/lng` **after** entry, within 250m
3. Require ≥3 samples between entry and exit (filters false positives from rides that briefly cross near a segment)
4. Calculate `elapsedSeconds = samples × 3` (3s is the watch interval cadence)
5. Compute `avg_speed = distance_km / (elapsed/3600)`; reject if outside 5-200 km/h range (sanity check)
6. Insert into `segment_efforts`

Not real PR tracking like Strava — simple first-match-wins per segment per ride.

### Group ride detection
**Currently disabled**. Previous implementation created a group row for every ride sharing the same date, false-positive-ing every day. Needs overlap-window logic (timestamp overlap, geographic proximity at start) to be useful. On backlog.

---

## 6. Ride Summary

**File**: `src/screens/RideSummaryScreen.tsx`

Post-ride celebration screen. Navigated to from `RideHistoryScreen.saveRide()` with `{ ride, newlyUnlocked }`.

### Sections
- **Hero**: accent icon, title, date, big distance number (48px, accent color)
- **Stats grid** (2x2): Duration, Avg Speed, Max Speed, **Calories**
- **Milestone card**: shown if `distanceKm >= 10` — "10KM+ Ride" badge
- **Unlocked achievements**: if `newlyUnlocked` has items, render each badge card with tier border color
- **Share button**: uses Web Share API on web if available, else clipboard, else `Share.share` on native
- **Relive button**: navigates to `RideReplay` with ride
- **Done button**: navigates back to Main tabs

### Calories
Formula: `calories = distanceKm * 40`. The `40 cal/km` figure is an approximation for motorcycle riding (rider physical effort, not engine fuel). Matches the live bundle's calculation.

### Milestone threshold
Hardcoded 10km. Below that, no milestone card shown.

---

## 7. Ride Replay

**File**: `src/screens/RideReplayScreen.tsx` (web-only feature)

Canvas-based animation of the ride route, with optional WebM video export.

### Animation
- Canvas size: 480 × 640px (portrait)
- Projection: lat/lng → pixel coords with configurable scale, tilt to create pseudo-3D perspective
- Duration: min 8s, max 20s, scales with coord count (`DURATION = min(coords/3, 20)`)
- 30 FPS
- Effects: glow trail (outer translucent + inner solid line), pulsing moving marker, top HUD, bottom stats panel, watermark

### Recording
Uses `MediaRecorder` API with `canvas.captureStream(30)`. Tries codecs in order: vp9 > vp8 > default webm. On stop, chunks combined into a Blob, object URL generated, "Download WEBM" button shown.

### Native fallback
If `Platform.OS !== 'web'`, shows a "Web only" message card instead of the canvas. No native MediaRecorder equivalent built.

---

## 8. Service Tracker

**File**: `src/screens/ServiceTrackerScreen.tsx`

Maintenance reminder system. Requires a primary bike.

### Service types
7 items with intervals (km + days):
| Type | Interval km | Interval days | Label |
|---|---|---|---|
| oli | 2500 | 90 | Ganti Oli |
| ban | 15000 | 730 | Ban |
| rem | 10000 | 365 | Kampas Rem |
| busi | 8000 | 365 | Busi |
| filter | 12000 | 365 | Filter Udara |
| rantai | 20000 | 730 | Rantai |
| aki | 0 | 730 | Aki (time-only) |

### Status calculation
For each service type:
1. Fetch most recent `service_records` row for this service type
2. If none exists → status `due` (progress 1.0)
3. If exists:
   - `daysSince(service_date)` → ratio to intervalDays
   - `kmSince = currentOdometer - recordedOdometer` → ratio to intervalKm
   - `progress = max(dayRatio, kmRatio)`
   - Status: `ok` (<0.8) / `soon` (0.8-1.0) / `due` (≥1.0)

Progress bar renders with color matching status: green / yellow / red.

### Record service
Tap any service card → modal with inputs:
- **Odometer (km)** — prefilled with bike's current odometer
- **Cost** (optional)
- **Notes** (optional)

On save:
1. Insert into `service_records` with user_id, bike_id, type, odometer_km, cost, notes, service_date=today
2. If odometer reading is higher than bike's current `odometer_km`, update bike.odometer_km to new value
3. Refetch everything, recalculate statuses

### Empty state
If user has no primary bike, show "Tambahkan motor primer dulu" card with button to Garage.

---

## 9. Achievements

**File**: `src/utils/achievements.ts` (definitions + logic), `src/screens/AchievementScreen.tsx` (UI)

### Definition (code, not DB)
17 achievements across 4 tiers:

**Distance** (6):
- `first_ride` bronze — 1 ride
- `km_10` bronze — 10 km total
- `km_50` bronze — 50 km total
- `km_100` silver — 100 km total
- `km_250` silver — 250 km total
- `km_500` gold — 500 km total
- `km_1000` platinum — 1000 km total

**Ride count** (3):
- `rides_5` bronze — 5 rides
- `rides_20` silver — 20 rides
- `rides_50` gold — 50 rides

**Speed** (4):
- `speed_60` bronze — reach 60 km/h
- `speed_80` silver — reach 80 km/h
- `speed_100` gold — reach 100 km/h
- `speed_120` platinum SECRET — reach 120 km/h

**GPS / Long ride** (3):
- `gps_track` bronze — any ride with route_path
- `long_ride_30` silver — single ride ≥ 30 km
- `long_ride_100` gold SECRET — single ride ≥ 100 km

### Secret badges
`secret: true` flag. Until unlocked, shown in UI as `???` with a `?` icon. Normal badges reveal name+desc even when locked.

### Stats computation (`buildStats`)
Iterates all user rides, aggregates:
- `totalRides` — count
- `totalDistanceKm` — sum of `parseKm(distance)`
- `maxSpeedKmh` — max of `parseSpeed(max_speed)`
- `longestRideKm` — max of `parseKm(distance)`
- `hasGPSRide` — any ride with `route_path.length > 1`

### Unlock check (`checkUnlocked`)
Given stats, returns array of IDs user qualifies for. Pure function, deterministic.

### Sync (`syncAchievements`)
1. Compute stats → list of qualifying IDs
2. Query `user_achievements` for already-saved IDs
3. Diff → new IDs
4. Insert new rows
5. Return the new IDs (so UI can show celebration)

Called at two points:
- After every ride save (`RideHistoryScreen.saveRide`)
- On manual refresh in `AchievementScreen`

### Badge grid UI
- Tier filter pills: All / Bronze / Silver / Gold / Platinum
- 2-column grid
- Locked badges: 50% dark overlay, muted colors
- Unlocked: "UNLOCKED" corner tag in tier color

### Next milestone card
Shows the first non-unlocked, non-secret achievement by array order. "Next Milestone" card at bottom of screen. Simple heuristic; could be smarter (closest-to-unlock) later.

---

## 10. Leaderboard & Segments

**File**: `src/screens/LeaderboardScreen.tsx`

### Data
8 pre-seeded Palembang segments (see `sql/schema.sql` seed block). Each has name, city, distance, start/end coordinates.

### Segments tab
- **Summary card**: user's name + count of segments where they're #1
- **Per segment card**:
  - Name + city + distance chip
  - Route visual (start dot → line with 60% progress → end dot)
  - Top 3 leaderboard with medal emoji
  - User's best time if not in top 3

### Single-query top-3
Previous implementation did N+1 queries (one per segment). Now:
```typescript
const effRes = await supabase.from('segment_efforts')
  .select('*')
  .order('segment_id', { ascending: true })
  .order('elapsed_seconds', { ascending: true });
```
Then client-side groups by `segment_id`, takes first 3 per group. One round-trip total.

### Segment detail modal
Tap any segment → modal with full sorted leaderboard (all efforts, limit 50). Medal emoji for top 3, `#N` for rest. User's row highlighted with accent border.

### Group rides tab
Placeholder: shows info card explaining auto-detection + list of `group_rides` rows (currently empty since detection is disabled).

### Segment seeding
Seed block in `schema.sql`:
```sql
INSERT INTO segments (name, city, distance_km, start_lat, ...) VALUES
  ('Jembatan Ampera Sprint', 'Palembang', 1.20, ...),
  ...
ON CONFLICT (name) DO NOTHING;
```
`segments_name_idx` UNIQUE index guarantees idempotency.

---

## 11. Events

**File**: `src/screens/EventsScreen.tsx`

### List
Fetches `events` + `groups` in parallel, plus user's `group_members` rows to mark joined groups.

Categories: SEMUA / SUNMORI / NIGHTRIDE / TOURING / RACING MEET / GRUP.

Filter logic:
- `GRUP` → show only groups
- `SEMUA` → show upcoming events + user's own events (any status) + active groups
- Other → case-insensitive category match on events

### Create event
`+` button opens modal with fields: Title, Category (radio), Date, Location, Description, Contact. Inserts with `status: 'pending'` and `organizer_id: user.id`. Admin approves via `AdminScreen`.

### Create group
When tab is `GRUP`, the `+` button opens the **Create Group** modal instead. Name, Category, Basecamp location, Description. Also `status: 'pending'`.

### Join/leave group
Cards in GRUP tab show "Gabung Grup" or "Terdaftar" button. Click toggles `group_members` row:
- Join: INSERT `{ group_id, user_id, user_name }`
- Leave: DELETE WHERE `group_id AND user_id`

`member_count` on `groups` table is NOT auto-updated. Would need a DB trigger or atomic RPC. Current UI shows count from the `groups` row which may drift. Low priority since counts are informational.

---

## 12. Marketplace (Parts)

**File**: `src/screens/PartsScreen.tsx`

### List
`fetchParts` → all active parts, ordered by `created_at DESC`.

Category pills: Semua, Oli, Filter, Kampas, Busi, Ban, Aksesoris. Filters client-side.

Search: text input, matches on `title.toLowerCase()` client-side.

### Card
- Square image area (image_url or emoji fallback)
- Badge corner ("HOT", "SALE", "PREMIUM" — stored in `parts.badge`)
- Title (2 lines max)
- Price (IDR, formatted with locale thousand separators)
- Rating + sold count

### Detail modal
Tap card → modal with large image, description, seller row, and two actions:
1. **Cart** icon button — toggles add/remove from localStorage cart
2. **BUY NOW** primary button — opens `affiliate_url` or falls back to WhatsApp deep link

### Cart persistence
Cart IDs stored in `localStorage['riderhub_cart_items']` as JSON array of string UUIDs. Loaded on mount.

---

## 13. Cart & Checkout

**File**: `src/screens/CartScreen.tsx`

### Items
1. Load cart IDs from localStorage
2. Query `parts.select('id, title, category, price, image_url, image_emoji').in('id', cartIds)` — single batch fetch
3. Items not found (deleted parts) are silently dropped

### Quantity
Persisted separately in `localStorage['riderhub_cart_qty']` as `{ [partId]: number }`. Defaults to 1 for items in cart without a qty entry.

### Total
Client-side sum: `parts.reduce((sum, p) => sum + p.price * qty[p.id], 0)`.

### Checkout
Builds a plain-text message listing each item + qty + total, URL-encodes it into a `wa.me` deep link. Opens in new tab (web) or via `Linking.openURL` (native).

No actual order record is created anywhere. This is intentional: the seller confirms via WhatsApp manually. Future iteration could write a `purchase_orders` table.

### WhatsApp number
Hardcoded `6281234567890`. TODO: make configurable via env var or per-seller field on `parts`.

---

## 14. Community Feed

**File**: `src/screens/CommunityScreen.tsx`

### Structure
- **Communities rail** (horizontal scroll) — top 10 active groups by member count, with emoji + name + count
- **Feed** — global `posts` table, latest 20

Fallback rail (hardcoded 5 communities) shown only when `groups` query returns empty — useful during dev before DB has data.

### Create post
Compose modal with text area + optional image picker (web-only via `<input type=file>` + FileReader).

Image pipeline:
1. User picks file
2. Preview via `URL.createObjectURL`
3. On submit, compress to max 1024px JPG (Canvas resize + toBlob at 0.82 quality)
4. Upload to Supabase Storage at `posts/<timestamp>_<name>.jpg`
5. Get public URL
6. Insert `posts` row with `image_url`

### Like toggle
- Local: update `likedPosts` Set + persist to `localStorage['riderhub_liked_posts']`
- Remote: `UPDATE posts SET likes_count = max(0, likes_count ± 1) WHERE id = postId`

Not atomic — two simultaneous likes race. Would need a Postgres function or trigger to be correct at scale. For MVP, acceptable.

### Comments modal
Tap comment icon → modal with existing comments + input. Submit inserts into `comments` and updates `posts.comments_count`.

### Share
Web: tries `navigator.share` first (native share sheet), falls back to `navigator.clipboard.writeText`. Native: no implementation.

---

## 15. Community Groups

**File**: `src/screens/CommunityDetailScreen.tsx`

Navigated to with `{ community }` param. If param missing → immediately redirect to Community tab (guard).

### Hero
Emoji + name + badge (group type) + member count.

### Membership
Queries `group_members` on mount: `WHERE group_id = community.id AND user_id = auth.uid()`. Button label:
- Not joined: "REQUEST MEMBERSHIP"
- Joined: "MEMBERSHIP ACTIVE ✓"

Click toggles the row. Unlike CommunityScreen this writes to DB (not localStorage) because membership persists across devices.

### Discussions
Only visible to members. `group_posts WHERE group_id = community.id`. "New Topic" creates a row with title only (no body yet).

---

## 16. Notifications

**File**: `src/screens/NotificationsScreen.tsx`

### Data
Per-user `notifications` table. Queried with `WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 50`.

### Categories
Hardcoded: System, Event, Store, Community, Vehicle, Service. Color-coded.

### Actions
- **Tap notification** → open detail modal. Auto-mark `is_read: true`.
- **"Mark all read"** — `UPDATE ... SET is_read = true WHERE user_id = ... AND is_read = false`.
- **Delete** (in detail modal) — `DELETE WHERE id`.

### Insertion
Notifications are created by other features (planned; not yet wired). Example triggers:
- New event approved → notify all users with matching preferences
- Service reminder (cron) → "Kampas rem karyawan jatuh tempo"
- New comment on your post → notify post author

Currently the table is empty until something populates it. UI handles empty state with a "No alerts" screen.

---

## 17. Admin Panel

**File**: `src/screens/AdminScreen.tsx`

### Login
Re-prompts for email+password (doesn't reuse session). On successful auth, checks `user_metadata.is_admin === true`. If false, immediately signs out locally and rejects.

**Security note**: this is client-side only. Real admin protection requires RLS policies that check `is_admin` on write-heavy tables. Not yet implemented — the admin panel "works" but can't actually prevent a sufficiently motivated user from bypassing via direct API calls.

### Tabs
- **Dashboard**: counts of events, parts, pending approvals
- **Events**: list all events, click edit icon to modify title/price/location
- **Parts**: list all parts, toggle active flag via eye icon, edit name/price
- **Approvals**: pending events + pending groups, Approve/Reject buttons

### Approve event
`UPDATE events SET status = 'upcoming' WHERE id`. Reject → `status = 'rejected'`.

### Edit modal
Fields depend on type (event has location, part has price). Hand-coded, not dynamic — specific to these two entities.

---

## 18. 3D Configurator

**File**: `src/screens/ConfiguratorScreen.tsx` (web-only)

### Loading Three.js
CDN-loaded via lazy promise:
```typescript
const loadThree = () => {
  if (window.THREE) return Promise.resolve(window.THREE);
  // inject <script src="https://cdnjs...three.min.js">
  // resolve on onload
};
```
Memoized — second call returns same promise. Falls back to `status: 'error'` if CDN blocked.

### Scene
Hand-built primitive motorcycle:
- Body (rectangular box with material)
- Tank (scaled sphere)
- Seat (thin box)
- Handlebar (cylinder)
- Fork (angled cylinder)
- Engine (box)
- Exhaust (long cylinder)

Ground: dark circle disc.

Lights: ambient + directional key + blue rim.

### Wheels
Rebuilt on every spoke-count change. `buildWheels(spokes)`:
- Tire: black torus
- Rim: silver torus
- Spokes: N boxes arranged radially (for ≤10), OR thin cylinders (for 11-36 wire), OR solid cylinder disc (0)

### Interactions
- Auto-rotate: +0.003 rad/frame when not dragging
- Pointer drag: `dx * 0.01` applied to bodyGroup.rotation.y (and wheelGroup to keep synced)

### Color / wheel controls
Via UI:
- Color swatch click → `sceneRef.current.setColor(hex)` → `bodyMat.color.set(hex)`
- Wheel card click → `sceneRef.current.setVelg(spokes)` → `buildWheels(spokes)` (destroys old group, creates new)

### Cleanup
On unmount: `dispose()` handler cancels rAF, removes all event listeners, disposes renderer.

### Native fallback
Shows "3D preview hanya tersedia di web" message with a laptop icon.

---

## 19. Landing Page (marketing)

**File**: `src/screens/LandingScreen.tsx`

Marketing-style landing for unauthenticated users.

### Hero
- Full viewport height with Ducati background
- 64px headline "The Future of Riding"
- Subtitle + two buttons: "Get Started" (→ register modal) / "Existing Account" (→ login modal)

### Stats strip
3 static KPIs: 45K+ RIDERS / 120+ EVENTS / 500+ PARTS.

### Marquee ticker
Horizontal auto-scrolling text with 9 highlights. Web: CSS @keyframes translating -50% infinitely, using a doubled content trick for seamless loop. Native: static single-line fallback showing first 3 items.

### Features grid
6 TeslaCard items: Digital Garage / Ride History / Community / Events / Marketplace / Security.

### Footer
Brand name, copyright, Privacy/Terms/Contact links (not yet routed).

### Auth modal
One modal component that flips between `login` and `register` modes. Same fields (email+password) + `name` when registering. Errors surfaced inline. On success, `onAuthStateChange` auto-navigates away from Landing.

---

## Cross-cutting concerns

### Error surfaces
Every Supabase call is wrapped with error handling. Error messages reach users via:
- Inline error text (auth modals)
- Alert dialogs (`window.alert` on web, `Alert.alert` on native)
- Toast-like error rows in modals (Garage add, ride save)
- Console warn/error for dev

### Loading states
Every fetch has a `loading` boolean with:
- `ActivityIndicator` spinner OR
- Skeleton placeholder text ("Loading...", "...")

### Pull-to-refresh
On list screens (Home, Events, Profile, Notifications, Leaderboard, Achievements). Uses `RefreshControl` with accent tint.

### Safe-area
All screens wrap in `SafeAreaView` to avoid iOS notch/Android status bar.

### Back navigation
Every non-root screen has a back arrow in header. Navigation uses `navigation.goBack()` except in flows where we want to replace (e.g. CommunityDetail with missing params → `navigation.replace`).

### Empty states
Every list has an explicit empty state card with icon + message + optional CTA. No bare "Loading..." or blank screens.

### Dark mode
App enforces dark mode only (`userInterfaceStyle: "dark"` in app.json). Theme tokens in `src/theme/index.ts` are single-light-source (no dark/light variant). Web PWA respects user's OS theme for chrome but app content is always dark.

---

## Known limitations & future work

- **Admin RLS**: is_admin checked client-side only
- **Like atomicity**: client-side counter, racy under load
- **Group ride detection**: disabled, needs overlap logic
- **3D models**: primitive geometry; Meshy GLTF pipeline not re-hooked
- **MapLibre**: using Leaflet, live bundle had MapLibre (cosmetic)
- **Custom bottom tab bar**: using standard RN bottom-tabs, live bundle had repositioned bar
- **Push notifications**: not implemented
- **Payment flow**: WhatsApp-only, no order records
- **Password reset**: no UI yet
- **Avatar upload**: Storage ready, UI missing
- **Service reminders**: calculated but not yet written to notifications
- **Real-time**: Supabase Realtime available but unused (no live post/comment updates yet)
