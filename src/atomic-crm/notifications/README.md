# Notifications Module

In-app notification system for Crispy CRM. Surfaces overdue task and activity alerts to sales reps via a header bell icon and a dedicated list view. Notifications are written by two backend edge functions — `daily-digest` and `check-overdue-tasks` — and are read-only from the frontend except for marking individual records as read.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Low |
| Phase | 1 |
| Test Project | `__tests__/NotificationsList.test.tsx` |
| Dependents | 3 (header bell, dropdown, list view) |

## Key Components

| Component | Purpose |
|-----------|---------|
| `NotificationsList.tsx` | Full-page list with read/unread filter sidebar and mark-as-read action |
| `NotificationRow` | Memoized row with unread indicator, type badge, relative timestamp, and entity deep link |
| `NotificationsListFilter` | Status filter sidebar (Unread only / Read only) using `ToggleFilterButton` |
| `NotificationsEmpty` | Empty state shown when no notifications exist |
| `resource.tsx` | React Admin resource config — lazy-loaded list view wrapped in `ResourceErrorBoundary` |
| `index.tsx` | Barrel re-export of resource default and `NotificationsListView` |
| `src/components/NotificationBell.tsx` | App header bell with unread count badge; polls on `NOTIFICATION_POLL_INTERVAL_MS` |
| `src/components/NotificationDropdown.tsx` | Dropdown preview of recent notifications opened from the bell |

## Dependencies

### Internal Modules
- `src/atomic-crm/queryKeys.ts` — `notificationKeys.all` used for targeted query invalidation after mark-as-read
- `src/atomic-crm/filters/FilterCategory` — filter sidebar wrapper

### Provider Handler
- `src/atomic-crm/providers/supabase/handlers/notificationsHandler.ts` — composed DataProvider (withErrorLogging > withLifecycleCallbacks > withSkipDelete > withValidation)

### npm Packages
- `date-fns` ^4.1.0 — `formatDistanceToNow` for relative timestamps
- `lucide-react` ^0.542.0 — Bell, Eye, ExternalLink icons
- `ra-core` ^5.10.0 — `useListContext`, `useUpdate`, `useNotify`
- `@tanstack/react-query` ^5.85.9 — `useQueryClient` for cache invalidation

### External Integrations
- **Edge Function: `check-overdue-tasks`** (pg_cron 09:00 UTC) — writes `task_overdue` notifications
- **Edge Function: `daily-digest`** (pg_cron 07:00 UTC) — writes digest-related notifications

## Features in This Project

| Feature | Domain | Confidence |
|---------|--------|-----------|
| Notifications | Notifications | 0.90 |

## Notification Types

The `type` field on the `notifications` DB table maps to these display labels:

| DB type | Badge label |
|---------|-------------|
| `task_overdue` | Overdue Task |
| `task_assigned` | Task Assigned |
| `mention` | Mention |
| `opportunity_won` | Opportunity Won |
| `opportunity_lost` | Opportunity Lost |
| `system` | System |

Entity deep links are resolved in `getEntityLink()` for `task`, `opportunity`, `contact`, `organization`, and `product` entity types.

## Common Modification Patterns

To add a new notification type, add the `type` string to the `labels` map in `getNotificationTypeLabel()` and, if it links to a CRM entity, add the route pattern to `getEntityLink()` in `NotificationsList.tsx`. The `Notification` interface at the top of that file reflects the DB columns — do not add fields there without a corresponding migration and handler update.

When changing poll frequency, update `NOTIFICATION_POLL_INTERVAL_MS` in `src/atomic-crm/constants/` rather than hardcoding a value; `NotificationBell` derives `staleTime` from the same constant to avoid double-fetching on tab focus.

After any change, run the existing Vitest suite (`__tests__/NotificationsList.test.tsx`) and confirm the mark-as-read button renders for unread rows and is absent for read rows.

## Guardrails

- Do not import Supabase directly — all reads and writes go through `composedDataProvider` via the notifications handler (CORE-001).
- The provider handler uses `withSkipDelete` — the `notifications` table uses soft-delete (`deleted_at`); never issue a hard DELETE from the UI layer.
- `supabase/functions/check-overdue-tasks/index.ts` and `supabase/functions/daily-digest/index.ts` are the write sources for this table and are Caution Zone files requiring human review before modification.

## Related

- Full audit report: `docs/audit/reports/`
- Provider pattern: `src/atomic-crm/providers/supabase/README.md`
- Edge functions: `supabase/functions/check-overdue-tasks/`, `supabase/functions/daily-digest/`
