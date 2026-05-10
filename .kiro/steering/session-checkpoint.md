# RiderHub — Session Checkpoint

**Last updated:** 2026-05-10 (post-recovery, PWA enabled)
**Handoff purpose:** help next agent continue RiderHub development safely.

---

## 🛡️ Production state

| Item | Value |
|---|---|
| Public URL | `https://riderhub-ten.vercel.app` |
| Active deployment | `dpl_63vct5uHGyatBTsLZ6gA8kFaBGpU` (pinned 3D build) |
| Pinned deployment URL | `https://riderhub-9npx07yul-lils-projects-776e7e74.vercel.app` |
| Live bundle hash | `index-142fd5756e2e34bf1f7dd77da78f3eb2.js` (2.88 MB) |

The production alias is currently pinned to the older 3D build. Local source (`recovery/3d-features` branch) is now ahead in most ways (compiles cleanly, schema complete, PWA ready) but lacks the Meshy GLTF 3D models the live bundle has.

---

## 📌 Git state

**Main branch HEAD:** `91c3fbe` (clean, no changes pushed from recovery)
**Active work branch:** `recovery/3d-features`
  - Contains: complete refactor from Phase 0-6 + PWA
  - Status: compiles clean, web build passes (1.77 MB bundle)
  - Ready to commit — user has not given commit approval yet

---

## 🏗️ What was done

Phases 0–6 + PWA complete. See:
- `.kiro/progress/RECOVERY_PLAN.md` — full checklist
- `.kiro/progress/FEATURE_STATUS.md` — per-feature state
- `.kiro/audit/AUDIT_2026-05-10.md` — original audit (for traceability)

Highlights:
- TypeScript strict: 0 errors
- 20+ files refactored, 7 dead files deleted, 4 new screens added
- Full SQL schema (13 tables, RLS, FKs, seed segments)
- PWA: manifest + service worker + install prompt + social tags
- Build pipeline: `npm run build:web` runs postbuild.js → dist ready for Vercel

---

## ✅ Rules for next agent

1. **Do not `vercel --prod`** without user confirmation. The current prod alias is irreplaceable (live 3D build).
2. **Safe deploy path**: preview first (`vercel` without `--prod`), QA, then promote with `vercel alias set`.
3. **Rollback command** if alias gets overwritten:
   ```
   vercel alias set https://riderhub-9npx07yul-lils-projects-776e7e74.vercel.app riderhub-ten.vercel.app
   ```
4. **Before commit**: user hasn't given commit approval for the recovery branch yet. Ask first.
5. **Do not delete `.backups/*.js`** until the replacement is live and stable ≥ 48h.
6. **Schema must be applied**: user needs to run `sql/schema.sql` + `sql/data.sql` in Supabase before new DB features work.
7. **Anon key rotation**: `.env.example` previously committed a real key. Plan to rotate when ready.

## 🎯 Next likely tasks

1. User runs SQL migrations in Supabase dashboard
2. User commits recovery branch
3. Preview deploy on Vercel
4. QA PWA install flow on mobile Chrome + iOS Safari
5. Promote to production

## 📂 Key files to know

| Path | Purpose |
|---|---|
| `App.tsx` | Root, typed linking, navigation |
| `src/types/index.ts` | Domain types (Ride, Bike, Community, Segment) |
| `src/navigation/types.ts` | RootStackParamList + global ReactNavigation augmentation |
| `src/lib/supabase.ts` | Client + safeFetch (ISO-8859-1 header workaround) |
| `src/lib/pwa.ts` | initPWA, promptPWAInstall, isStandalone |
| `src/lib/geo.ts` | haversineKm, formatDuration, parseKm |
| `src/context/AuthContext.tsx` | Selective-clear signOut, refresh() method |
| `scripts/postbuild.js` | Copies public/ + icons to dist, injects PWA meta |
| `public/manifest.json` | PWA manifest with shortcuts |
| `public/sw.js` | Service worker (network-first HTML, cache-first static) |
| `sql/schema.sql` | Complete schema — 13 tables, RLS, FKs |
| `vercel.json` | Build command + sw.js/manifest headers |
