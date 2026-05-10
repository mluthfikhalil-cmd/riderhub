# RiderHub

All-in-One Mobile App untuk Pemotor Indonesia — ride tracker, marketplace parts, komunitas rider, 3D configurator, dan service tracker. Installable PWA on web.

## Stack

- Expo SDK 54 + React Native 0.81 + React 19
- TypeScript strict mode
- React Navigation 7 (stack + tabs)
- Supabase (Auth, Database, Storage, Realtime)
- Three.js (3D), Leaflet (maps), MediaRecorder (ride replay)
- PWA: manifest + service worker + install prompt

## Setup

1. Copy env:

   ```bash
   cp .env.example .env.local
   ```

   Fill `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.

2. Install:

   ```bash
   npm install
   ```

3. Apply database schema — run these in Supabase SQL Editor:
   - `sql/schema.sql` (idempotent; creates 13 tables + RLS + seed segments)
   - `sql/data.sql` (sample events + parts)

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Expo dev server |
| `npm run web` | Web dev server |
| `npm run android` / `npm run ios` | Native dev |
| `npm run typecheck` | TypeScript strict check |
| `npm run build:web` | Export for web + PWA post-build |
| `npm run preview` | Serve `dist/` locally |
| `npm run deploy:vercel` | Deploy to Vercel prod (⚠ check DEPLOYMENT_LOCK.md first) |

## Project structure

```
src/
├── auth/                  — (deprecated, folded into LandingScreen)
├── components/            — TeslaCard
├── context/               — AuthContext
├── lib/                   — supabase, geo, pwa, uploadPhoto
├── navigation/            — types.ts (RootStackParamList)
├── screens/               — 20 screens
├── theme/                 — Tesla dark theme tokens
├── types/                 — domain types (Ride, Bike, Community, Segment)
└── utils/                 — achievements
public/                    — PWA assets (manifest, sw.js, robots.txt)
scripts/postbuild.js       — PWA injection + icon copy into dist/
sql/                       — schema.sql + data.sql
.kiro/                     — agent checkpoints, audit, progress tracker
.backups/                  — deployment lock + live bundle recovery archives
```

## Deploy safety

Before any production deploy: read `.backups/DEPLOYMENT_LOCK.md` and `.kiro/steering/project-context.md`. The production alias is pinned to a deployment whose source isn't fully in git yet; overwriting it is destructive.

Safe path: preview deploy (`vercel` without `--prod`), QA, then `vercel alias set`.

## Feature matrix

See `.kiro/progress/FEATURE_STATUS.md` for the full per-feature state.
