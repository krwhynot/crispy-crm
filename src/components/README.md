# Components

Shared UI infrastructure for Crispy CRM. This directory provides the three-tier component system consumed by all feature modules: Tier 1 presentational primitives, Tier 2 React Admin wrappers, and shared layout shells. Every feature list, form, and slide-over panel in the app is built from these building blocks.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript 5 |
| Framework | React 19 + React Admin 5 + Tailwind CSS v4 |
| Risk Level | High |
| Phase | 3 |
| LOC | ~41,900 across 200 files |
| Consumed by | All feature modules (20 dependents) |

## Directory Structure

| Directory | Tier | Purpose |
|-----------|------|---------|
| `ui/` | Tier 1 | shadcn/ui primitives — no react-admin or Supabase imports. See [`ui/README.md`](./ui/README.md). |
| `ra-wrappers/` | Tier 2 | React Admin integration wrappers. Column filters documented in [`ra-wrappers/column-filters/README.md`](./ra-wrappers/column-filters/README.md). |
| `layouts/` | — | `ListPageLayout`, `ResourceSlideOver`, `ListToolbar`, sidepane components. |
| `admin/` | — | `AdminButton`, `AccessibleField`, `DeletedRecordsToggle`, admin form inputs. |
| `domain/` | — | Domain-specific shared components (inputs, forms). |
| `supabase/` | — | Auth pages: `forgot-password-page.tsx`, `set-password-page.tsx`, `auth-skeleton.tsx`. |

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `PremiumDatagrid` | `ra-wrappers/PremiumDatagrid.tsx` | Required wrapper for all list datagrids. Adds hover effects, keyboard navigation, sticky headers, and configurable column visibility. Use instead of raw `Datagrid` (rule UI-016 / CMD-007). |
| `ListPageLayout` | `layouts/ListPageLayout.tsx` | Full list page shell with optional filter sidebar, `FilterChipBar`, `ListToolbar`, search, sort, bulk actions, and empty states. |
| `ResourceSlideOver` | `layouts/ResourceSlideOver.tsx` | 40vw slide-over panel used by all resource detail views. |
| `FilterSidebarContext` | `layouts/FilterSidebarContext.tsx` | Context providing collapse state for the filter sidebar. |
| `AdaptiveFilterContainer` | `layouts/AdaptiveFilterContainer.tsx` | Renders the filter sidebar column and handles collapse transitions. |
| `NotificationBell` | `NotificationBell.tsx` | App header notification bell icon with unread count badge. |
| `NotificationDropdown` | `NotificationDropdown.tsx` | Dropdown panel listing in-app notifications. |
| `CanAccess` | `CanAccess.tsx` | Role-based rendering guard wrapping React Admin's `useCanAccess`. |
| `ErrorBoundary` | `ErrorBoundary.tsx` | Generic React error boundary for non-resource trees. |
| `ResourceErrorBoundary` | `ResourceErrorBoundary.tsx` | Error boundary scoped to a React Admin resource. |
| `sidepane/SidepaneSection` | `layouts/sidepane/SidepaneSection.tsx` | Section container for slide-over metadata panels. |
| `sidepane/DirtyStateTracker` | `layouts/sidepane/DirtyStateTracker.tsx` | Prompts on unsaved changes when navigating away from a slide-over. |

## Architecture: Three-Tier Rule

This directory enforces a strict tier boundary (rules UI-001, UI-002):

- **Tier 1 (`ui/`)** — pure presentational. Zero `react-admin` or `@supabase/supabase-js` imports allowed. Components are shadcn/ui primitives on Radix UI.
- **Tier 2 (`ra-wrappers/`)** — React Admin integration. Owns `useInput` wiring, RA prop compatibility, and resolver adapters. Feature pages consume these wrappers rather than composing raw Tier 1 elements.
- **Tier 3** — feature pages in `src/atomic-crm/*/`. They call Tier 2 wrappers; they do not import from `react-admin` directly for UI patterns.

Violations can be audited with `CMD-007`:
```
grep -r "import.*Datagrid.*from.*react-admin" src/ --include="*.tsx" | grep -v PremiumDatagrid.tsx
```

## Common Modification Patterns

When adding a new list resource, wrap its datagrid in `PremiumDatagrid` and compose the page with `ListPageLayout` — both accept children and pass RA context through unchanged. When adding a new Tier 2 wrapper, place it directly in `ra-wrappers/` (not in a nested `components/` subdirectory per MOD-002), wire React Admin's `useInput`, and keep business logic in a hook or service. When adding sidepane metadata rows, use `SidepaneSection` and `SidepaneMetadata` from `layouts/sidepane/` rather than building new layout primitives.

## Guardrails

`src/components/` is a **Phase 3** module with 19 commits in 14 days across three consecutive audit cycles — above the CI/CD architectural review threshold of 16+. Changes here have a wide blast radius across all 20 consuming feature modules.

- `ListToolbar.tsx` and `AdaptiveFilterContainer.tsx` are active hotspots; changes should include a manual smoke test of at least one list page.
- Tier boundary violations (adding `react-admin` imports to `ui/`) silently increase coupling. Run `CMD-007` before merging any Tier 1 change.
- `supabase/` auth pages are co-active with `src/atomic-crm/providers/supabase/authProvider.ts`; coordinate changes with the auth provider when modifying login or set-password flows.
- Styling must use Tailwind v4 semantic tokens (`text-muted-foreground`, `bg-primary`) — no hardcoded hex values or `oklch()` literals (rule CORE-017).

## Related

- Full audit report: `docs/audit/baseline/risk-assessment.json`
- ADR-003: Three-Tier UI Architecture
- Feature module READMEs: `src/atomic-crm/contacts/README.md` (example consumer)
- Column filter detail: `src/components/ra-wrappers/column-filters/README.md`
- Primitive component detail: `src/components/ui/README.md`
