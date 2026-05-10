# 🔒 Production Deployment Lock

**Last saved:** 2026-05-10 15:30 WIB

## Current Production Alias

- **Public URL:** https://riderhub-ten.vercel.app
- **Deployment URL:** https://riderhub-9npx07yul-lils-projects-776e7e74.vercel.app
- **Deployment ID:** `dpl_63vct5uHGyatBTsLZ6gA8kFaBGpU`
- **Deployed:** 2026-05-10 12:01:52 WIB
- **Bundle hash:** `index-142fd5756e2e34bf1f7dd77da78f3eb2.js`
- **Bundle size:** 2.88 MB

## Features Confirmed in this Bundle

- ✅ 3D Bike Configurator (Three.js + GLTFLoader + Meshy AI assets)
- ✅ Repositioned bottom bar with custom tab styling
- ✅ Multi-step Onboarding (17 brands, 80+ models)
- ✅ Service/Maintenance tracker
- ✅ Enhanced Ride Tracker (MapLibre GL)
- ✅ RideSummary with calorie calculation
- ✅ Enhanced RideReplay with MediaRecorder
- ✅ Palembang segments leaderboard
- ✅ Achievement tiers (bronze/silver/gold/platinum)

## Backup Bundles

- `live_bundle_2026-05-10.js` — current live bundle (2.88 MB)
- `previous_bundle_2026-05-10.js` — previous live bundle (2.78 MB)

Both contain 3D features and can be used for source code reverse-engineering if needed.

## ⚠️ How to Restore if Alias Breaks

```powershell
vercel alias set https://riderhub-9npx07yul-lils-projects-776e7e74.vercel.app riderhub-ten.vercel.app
```

## ⚠️ DO NOT Redeploy from Local Source

Local `src/` code does NOT have the 3D features. Running `vercel --prod` or `npx expo export` + `vercel --prod` will OVERWRITE the production alias with an older version missing 3D.

To safely deploy new changes:
1. First recover 3D source code from `.backups/` bundles
2. Merge with local changes
3. Build and deploy
4. Verify new deployment has all features before aliasing
