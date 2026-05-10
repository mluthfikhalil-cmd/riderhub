# RiderHub — Feature Status Tracker

**Last updated:** 2026-05-10 (post-Phase 0-6 recovery)
**Purpose:** single source of truth for feature state in local source.

Status meanings:
- ✅ **Done** — implemented, typechecked, bundled
- 🟢 **Works** — functional but has known limitations
- 🟡 **Partial** — UI exists but logic incomplete
- 🔴 **Broken** — screen exists but broken
- ⚫ **Missing** — not yet implemented

---

## Core infrastructure

| Feature | Local | Notes |
|---|---|---|
| Supabase client | ✅ | safeFetch + env-validated |
| Auth context | ✅ | signOut fixed — only clears sb-* keys |
| Root navigator (typed) | ✅ | RootStackParamList with param types |
| Deep linking | ✅ | all routes mapped incl. Landing, RideSummary, ServiceTracker |
| Theme tokens | ✅ | |
| TeslaCard component | ✅ | Pressable-based, proper press states |
| TS strict compile | ✅ | 0 errors |

## Authentication

| Feature | Local | Notes |
|---|---|---|
| Landing page with hero (64px) | ✅ | |
| Landing marquee ticker | ✅ | CSS-animated on web, static fallback on native |
| Landing auth modal (login/register) | ✅ | single entry point |
| Sign out | ✅ | selective storage clear, confirm prompt on web |
| Session refresh | ✅ | Supabase autoRefresh + exposed `refresh()` |

## Onboarding

| Feature | Local | Notes |
|---|---|---|
| Brand picker (22 brands) | ✅ | |
| Model picker (searchable, 200+ models) | ✅ | |
| Plate number input | ✅ | |
| **Odometer reading input** | ✅ | step 3 |
| **Oil change km input** | ✅ | step 3 |
| Save to profiles + bikes | ✅ | demote-then-insert pattern for primary |
| Skip / complete later | ✅ | calls auth.refresh() |
| 4-step progress | ✅ | |

## Home

| Feature | Local | Notes |
|---|---|---|
| Welcome header with bike | ✅ | |
| Ducati hero image | ✅ | |
| Quick action buttons (Ride/Servis/Badges/3D) | ✅ | all routed to real screens |
| Status card | 🟢 | hardcoded 80%, cosmetic only |
| Menu items (relabeled) | ✅ | all route to real screens |

## Events

| Feature | Local | Notes |
|---|---|---|
| Event list by category | ✅ | `borderWidth` fixed |
| Create event modal | ✅ | |
| Create group modal | ✅ | wired to + button when tab = GRUP |
| Join / leave group | ✅ | rpc call removed |
| Admin approval | ✅ | |

## Parts / Marketplace

| Feature | Local | Notes |
|---|---|---|
| Parts list | ✅ | |
| Category filter | ✅ | |
| Detail modal | ✅ | |
| Add to cart | ✅ | string IDs, persisted |
| Buy via WhatsApp | 🟢 | hardcoded phone number |

## Cart

| Feature | Local | Notes |
|---|---|---|
| Show cart items from DB | ✅ | fetched via `in: cartIds` |
| Quantity persisted | ✅ | localStorage |
| Remove item | ✅ | |
| Checkout (WA) | 🟢 | |

## Community

| Feature | Local | Notes |
|---|---|---|
| Communities rail (DB + fallback) | ✅ | |
| Feed | ✅ | |
| Create post + image | 🟢 | web-only upload |
| Like / unlike | 🟢 | client-side count (non-atomic) |
| Comments | ✅ | |
| Community detail | ✅ | DB-backed membership, param-guarded |

## Profile

| Feature | Local | Notes |
|---|---|---|
| Avatar + name | ✅ | |
| Lifetime stats | ✅ | |
| Recent badges | ✅ | |
| Edit profile | ✅ | |
| Menu | ✅ | |
| Sign out with confirm | ✅ | |

## Garage

| Feature | Local | Notes |
|---|---|---|
| List bikes (scoped to user) | ✅ | |
| Add bike (real errors) | ✅ | no silent mock fallback |
| Set primary (safe ordering) | ✅ | demote → promote with partial unique index |
| Delete bike | ✅ | |
| Odometer display | ✅ | |

## Ride tracking

| Feature | Local | Notes |
|---|---|---|
| Start/stop | ✅ | guarded against double-start; stop hides HUD immediately |
| Live HUD with GPS status | ✅ | `acquiring` → `locked` → `lost`, colored dot + message |
| Distance calc | ✅ | 5m-2km gate, dedupes <500ms callbacks |
| Loose accuracy filter | ✅ | allows first 3 fixes regardless, then drops >150m |
| GPS error handling | ✅ | handles PERMISSION_DENIED / UNAVAILABLE / TIMEOUT explicitly |
| GPS watchdog | ✅ | every 5s checks staleness, auto-marks `lost` after 15s, reconnects |
| Opt-in simulation | ✅ | shown only when GPS denied or acquiring >30s; never auto-replaces real tracking |
| Snap to road (OSRM) | ✅ | 98-point cap |
| Route map (Leaflet lazy-load) | ✅ | async script injection |
| Save ride | ✅ | rejects empty rides (<2 coords) |
| Segment detection | ✅ | requires 3+ samples, bounds-checked avg speed |
| Group ride detection | ⚫ | disabled pending overlap logic |
| Achievement sync | ✅ | |
| Navigate to RideSummary after save | ✅ | with newlyUnlocked badges |

## Ride Summary

| Feature | Local | Notes |
|---|---|---|
| Hero card with distance | ✅ | |
| Calories (40 cal/km) | ✅ | |
| 10km+ milestone badge | ✅ | |
| Unlocked achievements display | ✅ | |
| Share (native + web) | ✅ | |
| Relive from summary | ✅ | |

## Ride replay

| Feature | Local | Notes |
|---|---|---|
| Canvas animation | ✅ | |
| Preview + record (WebM) | ✅ | |
| Download | ✅ | |
| Proper TS types | ✅ | NativeStackScreenProps |

## Leaderboard

| Feature | Local | Notes |
|---|---|---|
| Segments tab with top-3 | ✅ | single query, client-side grouping |
| Segment detail modal | ✅ | |
| Group rides tab | ✅ | |
| Palembang 8-segment seed | ✅ | in schema.sql |
| Your-best row | ✅ | |

## Achievements

| Feature | Local | Notes |
|---|---|---|
| Badge grid | ✅ | |
| Tier filter | ✅ | progressInfo style fixed |
| Progress card | ✅ | |
| Next milestone | ✅ | |
| Secret badges | ✅ | |

## 3D Configurator

| Feature | Local | Notes |
|---|---|---|
| Screen shell | ✅ | |
| Three.js via CDN (proper script load) | ✅ | lazy promise-based loader |
| Color swatches | ✅ | |
| Wheel style selector | ✅ | |
| Primitive bike geometry | ✅ | boxes/cylinders — GLTF is future work |
| **Meshy GLTF models** | ⚫ | needs asset pipeline |
| Pointer drag rotation | ✅ | listeners cleaned on unmount |
| Native fallback | ✅ | "Web only" message |
| Resize handling | ✅ | |

## Service Tracker

| Feature | Local | Notes |
|---|---|---|
| 7 service types with intervals | ✅ | oli, ban, rem, busi, filter, rantai, aki |
| Status bar (OK/soon/due) | ✅ | km + days ratio |
| Record service modal | ✅ | updates odometer if higher |
| History query | ✅ | |
| Empty state if no primary bike | ✅ | routes to Garage |

## Notifications

| Feature | Local | Notes |
|---|---|---|
| DB-backed list | ✅ | notifications table in schema |
| Mark read (single + all) | ✅ | |
| Delete | ✅ | |
| Category filter | ✅ | |
| Relative time format | ✅ | |

## Insurance

| Feature | Local | Notes |
|---|---|---|
| Documents list | 🟡 | synthesized from bikes; coming-soon banner added |
| View / Renew | ⚫ | buttons disabled pending real integration |

## Admin

| Feature | Local | Notes |
|---|---|---|
| Admin login | 🟢 | metadata check (RLS is the real gate) |
| Dashboard | ✅ | |
| Event/parts CRUD | ✅ | |
| Approval queue | ✅ | |

## PWA (new)

| Feature | Local | Notes |
|---|---|---|
| Manifest.json with shortcuts | ✅ | `/service`, `/history`, `/garage` shortcuts |
| Service worker (network-first HTML, cache-first assets) | ✅ | `/sw.js` |
| Install prompt helper | ✅ | `src/lib/pwa.ts` |
| iOS Safari meta tags | ✅ | apple-mobile-web-app-* |
| OG social tags | ✅ | |
| Theme color | ✅ | #00D67D accent, #000000 dark |
| robots.txt | ✅ | |
| Post-build icon copy | ✅ | favicon + icon + adaptive-icon to dist root |
| Vercel headers for sw.js | ✅ | no-cache, Service-Worker-Allowed: / |

## Build / Deploy

| Item | Status | Notes |
|---|---|---|
| TypeScript strict | ✅ | 0 errors |
| Web bundle | ✅ | 1.77 MB (1.69 MB minified) |
| Post-build PWA injection | ✅ | runs on `npm run build:web` |
| Vercel config | ✅ | manifest/sw passthrough + SPA fallback |
| `npm run typecheck` | ✅ | new script |

---

## Remaining missing vs live bundle

| Feature | Gap |
|---|---|
| Meshy AI GLTF models in Configurator | primitive geometry only; need asset pipeline |
| MapLibre GL (live uses it; we use Leaflet) | Leaflet works; migration optional |
| Group ride auto-detection | disabled in local (too aggressive in previous impl) |
| Custom bottom bar repositioning | using standard RN tabs |

These are all "nice to have" improvements — none block a working PWA deploy.
