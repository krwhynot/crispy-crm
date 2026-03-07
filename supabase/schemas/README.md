# Schema Reference Snapshots

**Purpose:** Read-only documentation of the current database schema for AI agents and developer onboarding.

These files are **not** execution inputs — they are not wired into `supabase/config.toml` or any migration workflow. They exist solely to give humans and AI tools a single place to understand the final-state schema without replaying 17+ migration files.

## Files

| File | Contents |
|------|----------|
| `tables-core.sql` | 6 core business tables (sales, contacts, organizations, opportunities, activities, products) |
| `tables-notes.sql` | 3 notes tables (contact_notes, opportunity_notes, organization_notes) |
| `tables-junctions.sql` | 9 junction/association tables |
| `tables-reference.sql` | 5 reference/config tables (segments, tags, dashboard_snapshots, notifications, audit_trail) |
| `views.sql` | 24 named views + 3 camelCase compatibility aliases |
| `functions.sql` | Key RPC functions (auth lifecycle, data RPCs, archive/restore, authorization checks) |

## Counts (as of last sync)

- **Tables:** 23 active (tutorial_progress dropped in migration 20260228100000)
- **Views:** 27 (24 named + 3 compatibility aliases)
- **Last synced:** 2026-03-04
- **Migration span:** 20260214003329 through 20260303120000

## Maintenance Workflow

After any new migration:

1. Run `npm run db:types` to regenerate TypeScript types
2. Update the affected SQL reference file(s) with the new/modified table/view/function definitions
3. Update the `Last synced` date and migration span above
4. Rerun the AI readiness database scanner to verify scores
