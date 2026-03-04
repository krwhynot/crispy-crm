# Hooks Module

Shared React hooks used across Crispy CRM feature modules. This module provides cross-cutting utilities for filter state management, recent history tracking, notifications, and UI layout — removing duplicated logic from contacts, organizations, opportunities, settings, and tags.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Medium |
| Phase | 1 |
| Test Project | `__tests__/` (partial coverage) |
| Dependents | 5 — contacts, opportunities, organizations, settings, tags |

## Key Hooks

| Hook | Purpose |
|------|---------|
| `useFilterCleanup` | Cleans stale filter and sort keys from localStorage before React Admin reads them; prevents PostgREST 400 errors on first render |
| `useSmartDefaults` | Provides `sales_id` (current user) and `activity_date` (today) as pre-filled form defaults |
| `useRelatedRecordCounts` | Fetches cascade counts (contacts, activities, notes, tasks) for delete-confirmation dialogs |
| `useRecentSearches` | Tracks up to 10 recently viewed records across `organizations`, `contacts`, `opportunities`; synced cross-tab via `useSyncExternalStore` |
| `useRecentItems` | Tracks recently viewed records using React Admin `useStore` (persists to localStorage, clears on logout) |
| `useRecentSelections` | Tracks per-resource recently selected items for inline selectors |
| `useSafeNotify` | Wraps `useNotify` with automatic error sanitization — prevents raw DB errors reaching users |
| `useAppBarHeight` | Returns the correct app bar height constant for desktop (48px) or mobile (64px) |

## Dependencies

### Internal Module References

| Module | Used For |
|--------|----------|
| `constants` | Toast duration constants (`TOAST_SUCCESS_DURATION_MS`, etc.) |

### npm Packages

All hooks rely on the project's existing prod dependencies — no additional packages are introduced.

| Package | Version |
|---------|---------|
| `react-admin` / `ra-core` | `^5.10.0` |
| `react` | `^19.1.0` |
| `zod` | `^4.1.12` (schema validation in `useRecentSearches`) |
| `date-fns` | `^4.1.0` (date formatting in `useSmartDefaults`) |

## Features in This Module

No standalone feature domain lives here. This module is a shared-dependency leaf that serves other features.

| Hook | Consumer Domains | Confidence |
|------|-----------------|-----------|
| `useFilterCleanup` | contacts, organizations, products, tasks | 0.95 |
| `useSmartDefaults` | activities, tasks | 0.95 |
| `useRelatedRecordCounts` | contacts, organizations | 0.95 |
| `useRecentSearches` | contacts, organizations, opportunities | 0.92 |
| `useSafeNotify` | contacts, organizations, opportunities, tags, settings | 0.92 |
| `useAppBarHeight` | layout-aware components | 0.90 |

## Common Modification Patterns

New hooks belong in a single file at `src/atomic-crm/hooks/<hookName>.ts` and must be re-exported from `index.ts`. All hooks consume React Admin provider hooks (e.g., `useDataProvider`, `useNotify`, `useGetIdentity`) rather than importing Supabase directly — this is enforced by CORE-001.

When adding a hook that reads localStorage (as `useFilterCleanup` and `useRecentSearches` do), validate the stored shape with a Zod schema using `z.strictObject()` before use — stale or corrupted entries must be removed rather than silently ignored. After any change to `useFilterCleanup`, verify the targeted resources still appear in `TEXT_FILTER_FIELDS` and `DEFAULT_SORT_FIELDS` maps inside that file.

## Guardrails

- `useFilterCleanup` runs a synchronous localStorage write during render (Phase 1) then a store sync in `useEffect` (Phase 2). This ordering is load-bearing — do not move Phase 1 into an effect or PostgREST will receive stale column names on the first request.
- `useRecentSearches` holds a module-level `cachedSnapshot` variable (shared mutable state — noted in `dependency-map.json`). `getSnapshot` must always return the same reference until data changes; creating a new array in `getSnapshot` causes infinite re-renders with `useSyncExternalStore`.
- `useSafeNotify` is the single source of truth for user-facing error messages. Do not call `useNotify` directly in feature components — use `useSafeNotify` to ensure raw DB errors are never displayed.

## Related

- Full audit report: `docs/audit/baseline/risk-assessment.json` (hooks entry)
- Filter system: `src/atomic-crm/filters/README.md`
- Constants (toast durations, resource names): `src/atomic-crm/constants/`
