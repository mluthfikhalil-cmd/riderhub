# RiderHub Progress Framework

Three files, each with a single responsibility:

| File | What it is | When to update |
|---|---|---|
| `FEATURE_STATUS.md` | Per-feature matrix: ✅ Done / 🟢 Works / 🟡 Partial / 🔴 Broken / ⚫ Missing, for local vs live | Every time a feature's state changes |
| `RECOVERY_PLAN.md` | Ordered, phased plan to reach live-bundle parity and re-deploy safely | When a task is done (check the box) or scope changes |
| `../audit/AUDIT_2026-05-10.md` | Snapshot of all bugs/incomplete logic found in one review pass | When a new audit is run (create a new dated file) |

## Workflow

1. Start any work by reading `../steering/session-checkpoint.md` first.
2. Pick the next unchecked item from `RECOVERY_PLAN.md`.
3. Cross-reference its audit ID (e.g. `E-Ev`, `C1`) in `AUDIT_2026-05-10.md` for details.
4. Work on a branch `fix/phase-N-short-desc`.
5. When done: check the box in `RECOVERY_PLAN.md`, update the corresponding row in `FEATURE_STATUS.md`.
6. Move to next item.

## Current phase

**Phase 0 — Stabilize before touching features** (not started)

See `RECOVERY_PLAN.md` for details.
