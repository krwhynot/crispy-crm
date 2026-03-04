# atomic-crm/components

Shared domain-specific UI components for Crispy CRM. These components encode CRM business logic (sample workflow, task creation, favorites, record tracking) and are reused across the contacts, opportunities, organizations, tags, and tasks modules. This directory is distinct from `src/components/`, which houses the three-tier general-purpose component system (Tier 1 ui, Tier 2 ra-wrappers).

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 |
| Risk Level | Low |
| Phase | 1 |
| Test Coverage | None (see Guardrails) |
| Dependents | contacts, opportunities, organizations, tags, tasks (7 fan-in) |

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `SampleStatusBadge` | `SampleStatusBadge.tsx` | Color-coded badge for sample activity workflow (Sent → Received → Feedback Pending → Feedback Received). Read-only or interactive with popover and PATCH via RA data provider. |
| `SampleStatusStepper` | `SampleStatusBadge.tsx` | Compact inline dot-and-line stepper showing workflow progress. For list views and tight spaces. |
| `CreateFormFooter` | `CreateFormFooter.tsx` | Sticky form footer with "Save & Close" and "Save & Add Another" actions, dirty-state cancel guard, and unsaved-changes dialog. |
| `QuickAddTaskButton` | `QuickAddTaskButton.tsx` | Navigates to `/tasks/create` pre-seeded with `contact_id`, `opportunity_id`, or `organization_id` query params. Renders as a chip or button. |
| `FavoriteToggleButton` | `FavoriteToggleButton.tsx` | Star toggle for bookmarking entities (contacts, opportunities, organizations). Enforces a 10-item limit via `useFavorites` hook. |
| `TrackRecordView` | `TrackRecordView.tsx` | Invisible component; drop into any Show/Edit to record views in the recent-items list. Deduplicates against React 18 strict mode double-fire. |

## Storybook

`SampleStatusBadge` has a full Storybook story set at `SampleStatusBadge.stories.tsx` (title: `Atomic CRM/Components/SampleStatusBadge`). Stories cover all four status variants, compact mode, interactive popover at each workflow position, `SampleStatusStepper`, in-list usage, and a callback handler demo.

Run Storybook: `npm run storybook`

## Dependencies

### Internal Modules
- `src/atomic-crm/queryKeys` — `activityKeys` for targeted TanStack Query invalidation after PATCH
- `src/atomic-crm/validation/activities` — `SampleStatus` type
- `src/atomic-crm/validation/favorites` — `FavoriteEntityType` type
- `src/atomic-crm/constants/notificationMessages` — standardized toast messages
- `src/atomic-crm/utils` — `ucFirst` formatter
- `src/atomic-crm/hooks/useRecentItems` — recent record tracking
- `src/components/admin/AdminButton` — Tier 2 button wrapper
- `src/components/ui/*` — Badge, Popover, Tooltip (Tier 1 presentational)
- `src/components/ra-wrappers/form` — `SaveButton`

### External npm Packages
- `react-admin` — `useUpdate`, `useNotify`, `useRecordContext`, `useRedirect`
- `@tanstack/react-query` — `useQueryClient` for cache invalidation
- `react-hook-form` — `useFormContext`, `useFormState`
- `lucide-react` — icons

## Sample Workflow Constants

`SampleStatusBadge.tsx` exports the workflow definition and helpers directly for use without rendering the component:

```ts
import {
  SAMPLE_STATUS_WORKFLOW,  // readonly tuple of all statuses in order
  SAMPLE_STATUS_CONFIG,    // display config per status (label, icon, variant, className)
  getNextStatus,           // returns next status or undefined if at end
  getPreviousStatus,       // returns previous status or undefined if at start
  isValidTransition,       // true only for forward progressions
  type SampleStatus,
} from "@/atomic-crm/components";
```

## Common Modification Patterns

New components belong here when they embed CRM domain knowledge (entities, workflow states, resource IDs) and are used by two or more feature modules. If a component is single-feature, keep it inside that feature's directory. If it has no CRM domain logic, it belongs in `src/components/ui` (Tier 1) or `src/components/ra-wrappers` (Tier 2) instead — see ADR `docs/adr/003-three-tier-ui-architecture.md`.

When adding a component: export it from `index.ts`, use semantic Tailwind tokens (`bg-primary`, `text-muted-foreground`), and ensure interactive targets meet the 44px minimum (`h-11`). Status updates must go through the React Admin data provider via `useUpdate` — no direct Supabase imports.

After modifying `SampleStatusBadge`, verify the Storybook stories still render correctly and that the PATCH path through `activitiesHandler` remains intact.

## Guardrails

- No test files exist for this module. When making changes, manually verify in Storybook and run the relevant consumer module tests (contacts, opportunities, tasks).
- `SampleStatusBadge` invalidates `activityKeys.detail(activityId)` — a targeted key. Do not broaden the invalidation scope without reviewing STALE-002 and STALE-008.
- Do not add direct Supabase imports (CORE-001). All data access must use React Admin hooks.
- Full audit report: `docs/audit/reports/`
