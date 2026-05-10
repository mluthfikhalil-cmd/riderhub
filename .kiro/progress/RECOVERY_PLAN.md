# RiderHub — Recovery Plan (completed)

**Status:** 2026-05-10 — Phases 0-6 + PWA complete.

## ✅ Phase 0 — Stabilize (done)
- [x] `@expo/vector-icons` added to package.json
- [x] SQL typo `ROWN` fixed
- [x] `data.sql` rewritten with quote-safe strings
- [x] Dead files deleted: `App.tsx.bak`, `src/theme_backup/`, `src/components/index.tsx`, `PartsMarketplaceScreen.tsx`, `heroSlides.ts`, `AppNavigator.tsx`, `AuthScreens.tsx`
- [x] All `borderExWidth` typos → `borderWidth`
- [x] HomeScreen trophy icon leading-space typo
- [x] AchievementScreen `progressInfo` style added
- [x] RideHistoryScreen inline TeslaCard rewritten (no more undefined `ts.card`)
- [x] Duplicate auth UI removed (Landing modal is canonical)

## ✅ Phase 1 — Foundation (done)
- [x] `src/types/index.ts` with shared domain types
- [x] `src/navigation/types.ts` with real param types + global augmentation
- [x] App.tsx: `LinkingOptions<RootStackParamList>`, `Landing` path added
- [x] Full SQL schema (13 tables) with RLS + FKs + seed
- [x] `.env.example` sanitized
- [x] `signOut` selective storage clear

## ✅ Phase 2 — Fix broken logic (done)
- [x] GarageScreen — real errors, user-scoped, safe primary ordering, delete
- [x] OnboardingScreen — demote-then-insert for primary, refresh()
- [x] CartScreen — DB-fetched items
- [x] NotificationsScreen — DB-backed
- [x] CommunityDetailScreen — param guard + DB membership
- [x] InsuranceScreen — coming-soon banner
- [x] EventsScreen — submit group wired, rpc removed, category filter fixed
- [x] RideHistoryScreen — safer segment detection, GPS simulate only after 10s no-fix, group-ride detection disabled, Leaflet lazy-load
- [x] HomeScreen — menu relabeled to match destinations
- [x] ProfileScreen — sign-out confirm on web
- [x] CommunityScreen — duplicate `communities` declaration renamed

## ✅ Phase 3 — Missing screens (done)
- [x] `RideSummaryScreen` with calories, 10km+ badge, unlocked achievements, share
- [x] Onboarding odometer + oil change km (step 3)
- [x] `ServiceTrackerScreen` with 7 service types, status bars, record modal
- [x] Landing marquee ticker
- [x] Landing 64px hero heading
- [ ] Custom bottom-bar repositioning — DEFERRED (standard RN tabs work)

## ✅ Phase 4 — Configurator cleanup (done)
- [x] Proper script-tag injection via `document.createElement('script')`
- [x] `react-three-fiber` — DEFERRED (vanilla three.js works, fewer deps)
- [x] Listeners cleaned on unmount, renderer disposed
- [x] Native fallback message
- [ ] Meshy AI GLTF assets — DEFERRED (needs asset export from user's Meshy account)

## ⚪ Phase 5 — MapLibre migration (deferred)
Leaflet works well for route preview. Migration not blocking deploy.

## ✅ Phase 6 — Harden for re-deploy (done)
- [x] `npx tsc --noEmit` → 0 errors
- [x] `npm run build:web` → 1.77 MB bundle
- [x] Feature keyword scan of built bundle confirms all features landed
- [x] `npm run typecheck` script added
- [x] BUILD_VERSION now env-driven (`EXPO_PUBLIC_BUILD_VERSION`)

## ✅ Phase 6.5 — Runtime hardening (done)

After user reported live tracker broken:

- [x] `.single()` → `.maybeSingle()` in HomeScreen and ProfileScreen (was throwing on users w/o primary bike)
- [x] Cart checkout on native — added `Linking.openURL` fallback for WhatsApp
- [x] RideHistoryScreen — full tracker rewrite:
  - Fixed stale closure in watchdog via `trackingRef`, `gpsStatusRef`, `fixCountRef`
  - Loose accuracy filter (first 3 fixes always accepted, then >150m dropped)
  - Handles all 3 GeolocationPositionError codes (1 denied, 2 unavailable, 3 timeout)
  - 5-line GPS status HUD: acquiring / locked / lost / denied / simulated with colored dot
  - GPS watchdog detects staleness >15s, auto-marks lost, auto-recovers when signal returns
  - Opt-in simulation (tombol muncul hanya saat denied or acquiring >30s)
  - Stop button instant — HUD hilang sebelum save modal open
  - Save guard rejects rides with <2 coords
  - Double-start guard via `trackingRef.current`
  - Fix counter displayed in HUD

## ✅ PWA — Extension (done)
- [x] `public/manifest.json` with shortcuts (service/history/garage)
- [x] `public/sw.js` network-first HTML, cache-first assets
- [x] `src/lib/pwa.ts` — register SW, capture beforeinstallprompt
- [x] Post-build script `scripts/postbuild.js` copies public/ + injects manifest + PWA meta
- [x] `vercel.json` with headers for sw.js + manifest
- [x] iOS/Android meta tags (apple-mobile-web-app-*, theme-color)
- [x] OG + Twitter social cards
- [x] robots.txt

## Next steps (user action required before deploy)

1. **Run migrations**: execute `sql/schema.sql` then `sql/data.sql` in Supabase SQL editor.
2. **Rotate Supabase anon key** (was committed to `.env.example` in old state).
3. **Preview deploy**: `vercel` (no `--prod`). Smoke test on preview URL.
4. **Production deploy** (only after QA): `vercel --prod`.
5. **Rollback ready**: alias to `riderhub-9npx07yul-...` if anything looks off (see DEPLOYMENT_LOCK.md).

## Deferred / nice-to-have

- Meshy GLTF assets for Configurator
- MapLibre GL migration
- Custom bottom tab bar repositioning
- Group ride auto-detection v2 (with time-window overlap)
- Atomic like counter (Supabase rpc function)
