# RiderHub Docs

Technical documentation for developers working on RiderHub.

## Files

| File | Contents |
|---|---|
| `ARCHITECTURE.md` | System overview, database schema, auth flow, navigation, PWA pipeline, build/deploy |
| `FEATURE_LOGIC.md` | Per-feature deep dive (19 features) — how each screen works under the hood |

## Related

- `../.kiro/steering/project-context.md` — quick agent brief (deployment safety rules)
- `../.kiro/steering/session-checkpoint.md` — handoff state between agent sessions
- `../.kiro/audit/AUDIT_2026-05-10.md` — bug catalogue from recovery pass
- `../.kiro/progress/FEATURE_STATUS.md` — per-feature implementation status
- `../.kiro/progress/RECOVERY_PLAN.md` — phased migration plan

## Reading order

- First time on the project? Read `ARCHITECTURE.md` top to bottom, then skim `FEATURE_LOGIC.md` TOC.
- Building a specific feature? Jump to that section in `FEATURE_LOGIC.md`.
- Deploying? `ARCHITECTURE.md` section 7 + `../.backups/DEPLOYMENT_LOCK.md`.
- Database changes? `ARCHITECTURE.md` section 2 + `../sql/schema.sql`.
