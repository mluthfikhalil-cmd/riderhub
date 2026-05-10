# RiderHub — Project Context

## ⚠️ READ THIS FIRST (Critical for Agents)

**Source code di disk ini TIDAK match dengan app yang live di `riderhub-ten.vercel.app`.**

Alasannya: ada progress besar (3D Configurator dengan Meshy AI assets, Onboarding multi-step, Service tracker, Ride tracker dengan MapLibre, bottom bar repositioning, dll) yang **di-deploy tapi nggak pernah di-commit ke git**. Bundle-nya masih live di Vercel, tapi source TS/TSX belum di-recover.

**JANGAN deploy ulang dari local code tanpa konfirmasi user.** Deploy akan overwrite live app dan ngilangin versi 3D.

**Live app pin:**
- Production URL: `https://riderhub-ten.vercel.app`
- Pinned deployment ID: `dpl_63vct5uHGyatBTsLZ6gA8kFaBGpU`
- Pinned deployment URL: `https://riderhub-9npx07yul-lils-projects-776e7e74.vercel.app`
- Deployed: 2026-05-10 12:01 WIB
- Bundle hash: `index-142fd5756e2e34bf1f7dd77da78f3eb2.js` (2.88 MB)

**Backup bundles** (di `.backups/`):
- `live_bundle_2026-05-10.js` — bundle production saat ini (versi 3D)
- `previous_bundle_2026-05-10.js` — bundle sebelumnya (juga punya 3D)

Bundle ini bisa dipakai buat reverse-engineer source code kalau perlu.

---

## Overview

RiderHub adalah all-in-one mobile app untuk komunitas pemotor Indonesia. Menggabungkan marketplace spareparts, event touring, komunitas rider, ride tracking, 3D bike configurator, dan fitur utilitas lainnya.

**Target:** Komunitas motor Indonesia (Sunmori, touring, jual-beli parts, dll.)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81.5 + Expo SDK 54 (New Arch enabled) |
| Language | TypeScript 5.9 |
| Navigation | React Navigation 7 (native-stack + bottom-tabs) |
| UI | React Native Paper 5.15, Ionicons, custom Tesla dark theme |
| Backend | Supabase (Auth, Database, Storage, Realtime) |
| 3D Engine | Three.js r128 (injected via CDN in live bundle) + GLTFLoader |
| 3D Assets | Meshy AI generated motorcycle models |
| Maps | MapLibre GL (live bundle) / Leaflet (local source) |
| Web | react-native-web 0.21 |
| Hosting | Vercel (static SPA export) |
| State | React Context (AuthContext) |
| React | 19.1.0 |

---

## Project Structure (Local Source)

```
RiderHub/
├── App.tsx              — Root: AuthProvider → Stack Navigator
├── index.ts             — Expo entry (registerRootComponent)
├── src/
│   ├── auth/            — Login/Register screens
│   ├── components/      — Reusable components (TeslaCard, etc.)
│   ├── context/         — AuthContext (Supabase auth state)
│   ├── lib/             — Supabase client, uploadPhoto
│   ├── navigation/      — Navigator + type definitions
│   ├── screens/         — 19 screens (barrel exported via index.ts)
│   ├── theme/           — Design system (Tesla dark theme)
│   └── utils/           — Utilities (achievements, etc.)
├── sql/                 — DB schema + seed data
├── assets/              — Icons, splash, images
├── .backups/            — Live bundle backups (for recovery)
└── dist/                — Web build output
```

---

## Features Currently Live (from bundle, NOT in local source)

**Missing from local — exist only in live deployment:**

1. **3D Bike Configurator** — Three.js + GLTFLoader loading Meshy AI-generated motorcycle models
2. **Multi-step Onboarding** — 17 motorcycle brands, 80+ models (Honda, Yamaha, Kawasaki, Ducati, Royal Enfield, BMW, etc), plate number, odometer, oil change km
3. **Service/Maintenance Tracker** — Ganti oli, ban, rem, busi, filter, rantai, aki with auto km intervals
4. **Enhanced Ride Tracker** — MapLibre GL with iframe map, real-time route drawing, pause/resume
5. **RideSummary Screen** — Hero card, calories calculation (40 cal/km), 10km+ badge unlock
6. **Enhanced RideReplay** — MediaRecorder WebM export, canvas animation
7. **Leaderboard** — 8 Palembang segments (Ampera, Jakabaring, Bukit Siguntang, etc.) with group ride detection
8. **Landing Page** — Hero 64px heading, marquee ticker, bento grid layout
9. **Achievement Screen** — Tier filter (bronze/silver/gold/platinum), next milestone card
10. **Bottom Bar** — Repositioned tabs with custom styling

**Features in local source (standard React Navigation bottom tabs):**
- Home, Events, Parts, Community, Profile tabs
- 19 screens scaffolded with Supabase integration
- Auth flow (Login/Register/Landing)

---

## Architecture Patterns

- **Auth-gated navigation** — Unauthenticated: Landing/Login/Register. Authenticated: Main tabs + stack screens. New users routed through Onboarding (`user_metadata.onboarded`).
- **Stack + Tab hybrid** — 5 main tabs nested in root stack with 12+ additional screens.
- **Deep linking** — Full URL scheme (`riderhub://` + Vercel domain).
- **Context-based state** — AuthContext wraps entire app.
- **Barrel exports** — All screens from `src/screens/index.ts`.

---

## Theme & Design

Tesla-inspired dark minimalist theme:
- Background: OLED black `#000000`
- Surface: `#111111`, `#1C1C1E`
- Primary: White `#FFFFFF`
- Accent: Neon green `#00D67D`
- Warning/Premium: Gold `#EBB040`
- Text: White / `#8E8E93` (secondary) / `#48484A` (muted)

---

## Database (Supabase)

Tables confirmed used in code:
- `users`, `profiles` — User accounts
- `events` — Touring/Sunmori events
- `parts` — Marketplace listings
- `posts`, `post_likes`, `comments` — Community feed
- `groups`, `group_members`, `group_posts` — Community groups
- `rides` — Ride history with route_path
- `bikes` — Garage bikes
- `segments`, `segment_efforts` — Leaderboard segments
- `group_rides`, `group_ride_members` — Auto-detected group rides
- `user_achievements` — Unlocked badges
- `service_records` — Maintenance history (only in live bundle)

RLS enabled on all tables.

---

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=<supabase_url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

---

## Build & Deploy

- **Dev:** `npx expo start`
- **Web build:** `npx expo export --platform web` → `dist/`
- **Deploy:** `vercel --prod` (⚠️ WILL OVERWRITE LIVE 3D VERSION if source doesn't have it)
- **Safe rollback:** `vercel alias set <deployment-url> riderhub-ten.vercel.app`
- **Native:** `eas build -p android/ios --local`
- **Bundle ID:** `com.riderhub.app`

---

## Git Status (at baseline commit)

**Last git commit:** `c7d111c fix: resolve import crashes and add auth safety`

Local source has many uncommitted files (24 modified + 5 untracked) that represent an older in-progress state than the live deployment. These uncommitted changes were made before the 3D upgrades that exist only in the live bundle.

---

## Conventions

- Bahasa Indonesia untuk UI labels dan meta descriptions
- Dark mode only (enforced via app.json)
- Custom safe fetch wrapper di Supabase client (strip non-ISO-8859-1 headers)
- Force-ready timeout 3s untuk loading state
- Build version constant untuk cache-busting Vercel
- TypeScript strict mode

---

## Recovery Strategy (if source code needs to be restored)

1. **Option A — Rebuild from bundle:** Parse `.backups/live_bundle_2026-05-10.js` to extract screen implementations. Minified but functional.
2. **Option B — Re-generate via AI tool:** User created features via Meshy.ai for 3D models. Check with user which tool they used (v0, Bolt.new, Lovable, Meshy) to potentially re-export.
3. **Option C — Cherry-pick migration:** Keep live deployment pinned. Gradually add features back to local source without redeploying until feature-complete.

**Current strategy:** Option C — live deployment pinned to preserve the 3D version while source is recovered incrementally.

---

## Important Rules for Future Agents

1. **NEVER run `vercel --prod` without user confirmation** — will overwrite the live 3D version
2. **NEVER run `git checkout --` on uncommitted work** — those changes may contain recovery-relevant progress
3. **NEVER assume local source represents what user sees live** — check bundle hash first
4. When user says "my app", they likely mean the live Vercel deployment, not local source
5. If user reports features "missing", check Vercel deployment history first before investigating code
