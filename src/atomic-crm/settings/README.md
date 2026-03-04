# Settings Module

Application configuration and user profile management for Crispy CRM. Handles personal profile edits, notification/digest preferences, password reset, audit log access, and team user management. Used by all authenticated users; admin-only sections (Team and Activity Log) are gated by role check at runtime.

## Key Components

| File | Purpose |
|------|---------|
| `SettingsPage.tsx` | Top-level page; composes sections and wires `useSalesUpdate` and `updatePassword` mutations |
| `SettingsLayout.tsx` | Tabbed shell that renders section list |
| `useSalesUpdate.ts` | TanStack Query mutation hook for profile writes; invalidates `saleKeys` on success |
| `PersonalSection.tsx` | Profile form (name, avatar, time zone) wrapped in RA `<Form>` |
| `NotificationsSection.tsx` | Notification preference toggles |
| `DigestPreferences.tsx` | Digest schedule and recipient preferences |
| `SecuritySection.tsx` | Password reset trigger; calls `dataProvider.updatePassword` |
| `UsersSection.tsx` | Admin-only team management panel |
| `AuditLogSection.tsx` | Admin-only activity log viewer |
| `RolePermissionsMatrix.tsx` | Read-only permissions reference table |
| `TimeZoneSelect.tsx` | Time zone picker for PersonalSection |

## Architecture

- **13 files, 951 LOC** — small, isolated leaf module (zero fan-in dependents)
- **DB table:** `sales` — reads and writes via `useGetOne("sales", ...)` and `dataProvider.salesUpdate`
- **No direct Supabase imports** — all writes go through `composedDataProvider` per `CORE-001`
- **Role guard:** admin-only sections (`users`, `audit`) are conditionally rendered in `SettingsPage` based on `identity.role === "admin"`

## Data Flow

```
SettingsPage
  └── useSalesUpdate (useMutation → dataProvider.salesUpdate)
        └── invalidates saleKeys.all + saleKeys.detail(userId) on success
  └── updatePassword (useMutation → dataProvider.updatePassword)
```

## Dependencies

### Internal Modules
- `src/atomic-crm/queryKeys` — `saleKeys` factory used in `useSalesUpdate` for targeted invalidation
- `src/atomic-crm/hooks/` — shared hooks consumed by section components
- `src/atomic-crm/constants/` — shared app constants

### npm Packages
- `@tanstack/react-query ^5.85.9` — `useMutation`, `useQueryClient`
- `ra-core ^5.10.0` — `useDataProvider`, `useGetIdentity`, `useGetOne`, `useNotify`, `Form`
- `lucide-react ^0.542.0` — section nav icons

## Features in This Module

| Feature | Domain | Confidence |
|---------|--------|-----------|
| Settings | Settings | 0.95 |

## Common Modification Patterns

Adding a new settings section follows the established pattern in `SettingsPage.tsx`: create a `[Name]Section.tsx` component, import it, and append a new entry to the `sections` array with an `id`, `label`, `icon`, and `component`. Profile field changes that write to the `sales` table belong in `useSalesUpdate.ts` — call `dataProvider.salesUpdate` and add any new cache invalidations using `saleKeys` helpers from `queryKeys.ts`. After changes, run `__tests__/Settings.test.tsx` and verify `npx tsc --noEmit` passes.

## Guardrails

- **Phase 1 / Low Risk** — no fan-in dependents; changes are fully isolated to this module
- No RLS policies owned by this module; the `sales` table RLS is governed by `supabase/migrations/`
- `useSalesUpdate.ts` must continue to call `queryClient.invalidateQueries` with scoped `saleKeys` keys — never call `invalidateQueries()` without a key (`STALE-008`)
- Full audit report: `docs/audit/baseline/risk-assessment.json`
