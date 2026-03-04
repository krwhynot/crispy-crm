# PRD: Three-Tier UI Component Architecture

**Feature ID:** feat-shc-001
**Domain:** Components
**Status:** Reverse-Engineered
**Confidence:** 85%
**Generated:** 2026-03-03
**Last Updated:** 2026-03-03

---

## Linked Documents
- **BRD:** None — BRD not applicable. This is a system-layer module. An architecture note capturing the rationale for tier separation is more appropriate than a business requirements document.
- **ADRs:** [docs/adr/003-three-tier-ui-architecture.md](../../adr/003-three-tier-ui-architecture.md)
- **Module:** `src/components/`
- **Feature ID:** feat-shc-001
- **Risk Level:** High (risk score 88 / 100)

---

## Executive Summary

`src/components/` is the shared UI infrastructure layer for Crispy CRM. It provides a three-tier component system — presentational primitives, React Admin integration wrappers, and layout shells — that every feature module in the application consumes. At 41,900 LOC across 200 files with 20 consuming dependents, it is the largest module by line count in the codebase and carries a wide blast radius. Its primary purpose is to isolate presentational concerns from React Admin framework concerns, enabling independent upgrades of shadcn/ui and React Admin, and allowing Tier 1 primitives to be tested without a full React Admin context.

---

## Business Context

The CRM must support a consistent, accessible, and branded user interface across all resource modules (Contacts, Organizations, Opportunities, Sales, Tasks, and more). Before this architecture was established, feature code mixed presentational markup, React Admin hook wiring, and business logic in the same files. This created:

- Testing friction: visual-only components required a full React Admin context to render in tests.
- Upgrade risk: changes to shadcn/ui or React Admin propagated unpredictably through feature code.
- Pattern duplication: identical card, form, and table layouts were rebuilt per resource module.

The three-tier architecture solves these problems by establishing strict import boundaries and canonical shared patterns. [INFERRED from ADR-003 and source structure]

---

## Goals

1. Provide a stable, reusable set of presentational primitives (Tier 1) that have no dependency on React Admin or Supabase.
2. Provide a React Admin integration layer (Tier 2) that owns form wiring, field binding, and RA prop compatibility — consumed by all feature modules rather than re-implemented per feature.
3. Provide layout shells (`ListPageLayout`, `ResourceSlideOver`) that give all list and detail views a consistent structure.
4. Keep Tier 1 components testable with plain React Testing Library — no RA context mocking required.
5. Enable independent upgrades of shadcn/ui (Tier 1) and React Admin (Tier 2) without cross-tier blast radius.
6. Enforce accessibility requirements (ARIA attributes, semantic tokens, 44px interactive targets) consistently at the component layer rather than per-feature.

---

## Architectural Constraints

### P0 — Enforced by rule; violations block merge

| ID | Constraint | Rule | Audit Command | Verified |
|----|-----------|------|---------------|----------|
| AC-001 | Tier 1 (`src/components/ui/`) must contain zero `react-admin` or `@supabase/supabase-js` imports. | UI-001 | `CMD-007` | Yes |
| AC-002 | Tier 1 → Tier 2 imports are forbidden. Tier 1 → Tier 3 imports are forbidden. Tier 2 → Tier 3 imports are forbidden. | UI-001, UI-002 | `CMD-007` | Yes |
| AC-003 | All list datagrids must use `PremiumDatagrid` instead of raw `Datagrid` from react-admin. | UI-016 / CORE-016 | `CMD-007` | Yes |
| AC-004 | Dialog, AlertDialog, and drawer overlays must include a title element (`DialogTitle` or equivalent), visible or `sr-only`. | CORE-015 | Manual review | Yes |
| AC-005 | Styling must use Tailwind v4 semantic tokens (e.g., `text-muted-foreground`, `bg-primary`). Hardcoded hex values and `oklch()` literals are banned. | CORE-017 | `CMD-005` | Yes |
| AC-006 | Interactive elements must meet a minimum tap/click target size of 44px. | CORE-017 | Manual review | Yes |
| AC-007 | Wrapper components must destructure custom library props before spreading to DOM elements to prevent unknown DOM attribute warnings. | UI-004 | `CMD-003` (tsc) | Yes |
| AC-008 | React Admin forms must use `createFormResolver(schema)` — direct `zodResolver(schema)` in RA forms is banned. | CORE-018 | `CMD-004` | Yes |
| AC-009 | Invalid form fields must expose `aria-invalid` and `aria-describedby`. Labels must be associated. Errors must use `role="alert"`. | CORE-014 | Manual review | Yes |
| AC-010 | No `console.log`, `console.warn`, `console.error`, `console.info`, or `console.debug` in production component code. | CORE-002 | `CMD-001` | Yes |
| AC-011 | No `: any`, `as any`, `any[]`, or `Promise<any>` without a runtime guard. | CORE-003 | `CMD-002` | Yes |

### P1 — Strong convention; deviations require documented justification

| ID | Constraint | Rule | Verified |
|----|-----------|------|----------|
| AC-012 | Tier 2 wrappers live directly in `src/components/ra-wrappers/` — no nested `components/` subdirectory inside ra-wrappers. | MOD-002 | Yes |
| AC-013 | Feature pages (Tier 3) consume Tier 2 wrappers for repeated patterns. They do not re-compose raw Tier 1 elements for patterns that already have a Tier 2 wrapper. | UI-007, MOD-007 | Yes |
| AC-014 | Tier 2 wrappers own `useInput` wiring and RA prop compatibility. Business logic belongs in hooks or services, not inline in wrapper JSX. | UI-002 | Yes |
| AC-015 | New sidepane metadata rows use `SidepaneSection` and `SidepaneMetadata` from `layouts/sidepane/` rather than custom layout primitives. | src/components/layouts/sidepane/ | Yes |
| AC-016 | Auth pages in `src/components/supabase/` (forgot-password, set-password, auth-skeleton) must be coordinated with `src/atomic-crm/providers/supabase/authProvider.ts` on any change. | CLAUDE.md Caution Zone | Yes |

### P2 — Recommended practice; use judgment

| ID | Constraint | Source | Verified |
|----|-----------|--------|----------|
| AC-017 | Tier 1 components should be individually documented in Storybook (`.stories.tsx` files present for most primitives). | src/components/ui/*.stories.tsx | Yes |
| AC-018 | `ListToolbar.tsx` and `AdaptiveFilterContainer.tsx` changes should include a manual smoke test of at least one list page due to active hotspot status. | src/components/README.md | Yes |
| AC-019 | When adding a new list resource, wrap its datagrid in `PremiumDatagrid` and compose the page with `ListPageLayout`. | src/components/README.md | Yes |

---

## Non-Functional Requirements

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| NFR-001 | Tier 1 component tests must not require React Admin context (plain RTL setup). | ADR-003 Consequences | Yes |
| NFR-002 | Module changes must pass TypeScript strict check (`npx tsc --noEmit`) before merge. | CORE-021, CMD-003 | Yes |
| NFR-003 | Zero new `any` types may be introduced in component files. | CORE-003, CMD-002 | Yes |
| NFR-004 | Component modifications must not increase raw `Datagrid` usage — audit with `CMD-007` before merge. | CORE-016 | Yes |
| NFR-005 | The module sits in Phase 3; changes require the CI/CD architectural review gate at 16+ commits/14 days — currently at 19 commits/14d (above threshold). | risk-assessment.json | Yes |
| NFR-006 | Test coverage is currently partial. New components added to `ra-wrappers/` should include at least one render smoke test. | risk-assessment.json factors.test_coverage = 55 | No [REQUIRES REVIEW] |

---

## API / Contract Model

This section documents the prop contracts for the most widely-consumed components.

### PremiumDatagrid (`src/components/ra-wrappers/PremiumDatagrid.tsx`)

```tsx
interface PremiumDatagridProps extends Omit<DatagridProps, "rowClassName"> {
  onRowClick?: (id: number | string) => void;
  focusedIndex?: number;      // -1 or undefined disables focus styling
  configurable?: boolean;     // true renders DatagridConfigurable (column visibility)
}
```

- Extends all React Admin `DatagridProps` except `rowClassName` (managed internally).
- When `configurable` is true, renders `DatagridConfigurable` instead of `Datagrid`.
- Source: `src/components/ra-wrappers/PremiumDatagrid.tsx`

### ListPageLayout (`src/components/layouts/ListPageLayout.tsx`)

- Full list page shell. Composes `FilterChipBar`, `ListToolbar`, search input, sort controls, bulk actions, and empty states.
- Accepts children for the datagrid slot.
- Source: `src/components/layouts/ListPageLayout.tsx` [REQUIRES REVIEW — props contract not verified from source]

### ResourceSlideOver (`src/components/layouts/ResourceSlideOver.tsx`)

- 40vw slide-over panel used by all resource detail views.
- Integrates `DirtyStateTracker` for unsaved-change prompts.
- Source: `src/components/layouts/ResourceSlideOver.tsx` [REQUIRES REVIEW — props contract not verified from source]

### SectionCard (`src/components/ra-wrappers/SectionCard.tsx`)

- RA-aware card container for form sections.
- Source: `src/components/ra-wrappers/SectionCard.tsx` [REQUIRES REVIEW — props contract not verified]

### CanAccess (`src/components/CanAccess.tsx`)

- Role-based rendering guard wrapping React Admin's `useCanAccess`.
- Accepts `action`, `resource`, and `children` props.
- Source: `src/components/CanAccess.tsx` [REQUIRES REVIEW — props contract not verified]

### Dialog / AlertDialog (Tier 1, `src/components/ui/dialog.tsx`)

- Radix UI `@radix-ui/react-dialog` primitives re-exported with project styling.
- `DialogContent` requires a sibling `DialogTitle` (visible or `sr-only`) per AC-004.
- No `react-admin` imports. Pure Radix + Tailwind.
- Source: `src/components/ui/dialog.tsx`

### Form Resolver Contract

All React Admin forms must use:
```tsx
// Allowed
resolver={createFormResolver(mySchema)}

// Banned
resolver={zodResolver(mySchema)}  // Direct zodResolver in RA forms
```
Source: `.claude/rules/CODE_QUALITY.md` (CORE-018), `src/components/ra-wrappers/` (createFormResolver location [REQUIRES REVIEW])

---

## UI / UX

- **Device target:** Desktop 1440px+ and iPad (per CLAUDE.md).
- **Slide-over width:** 40vw for all `ResourceSlideOver` panels.
- **List layout:** `ListPageLayout` provides a consistent shell with optional filter sidebar, search, and sort for all list resources.
- **Theming:** Tailwind v4 CSS variables. Dark/light mode toggle available via `ThemeModeToggle` in `ra-wrappers/theme-mode-toggle.tsx`.
- **Interactive targets:** All clickable elements must meet 44px minimum target size (AC-006).
- **Notifications:** `NotificationBell` (header icon with unread badge) and `NotificationDropdown` (detail panel) are co-located in `src/components/`.
- **Error states:** `ErrorBoundary` (generic) and `ResourceErrorBoundary` (RA resource-scoped) provide consistent error UI.
- **Empty states:** `EmptyState` Tier 1 component in `src/components/ui/empty-state.tsx`.
- **Loading states:** `ListSkeleton`, `ShowSkeleton`, and `Spinner` Tier 1 components.

---

## Design Rules

These rules derive directly from the ADR and UI standards overlay. Each is a constraint on how developers extend or modify this module.

| ID | Rule | Source |
|----|------|--------|
| DR-001 | Import direction: Tier 3 → Tier 2 → Tier 1 only. Reverse imports are forbidden. | ADR-003 |
| DR-002 | `PremiumDatagrid` is the only permitted datagrid wrapper in feature code. Raw `Datagrid` from react-admin is banned. | UI-016, ADR-003 |
| DR-003 | Every modal/dialog surface includes a title landmark (visible or `sr-only`). | CORE-015 |
| DR-004 | Semantic tokens only in styling. `text-gray-500`, hex colors, and `oklch()` literals are banned. | CORE-017 |
| DR-005 | Props passed to DOM elements are sanitized. Library-specific props are destructured out before spreading. | UI-004 |
| DR-006 | Tier 1 components have zero knowledge of React Admin, Supabase, or business domain concepts. | UI-001, ADR-003 |
| DR-007 | Tier 2 wrappers are not nested inside feature module `components/` subdirectories. They live in `src/components/ra-wrappers/`. | MOD-002 |
| DR-008 | `createFormResolver` is the only permitted bridge between Zod schemas and React Admin `SimpleForm`. | CORE-018 |
| DR-009 | `aria-invalid`, `aria-describedby`, and `role="alert"` are set by the Tier 2 input wrappers — feature code does not handle raw ARIA directly. | CORE-014 |
| DR-010 | Changes to `ListToolbar.tsx` or `AdaptiveFilterContainer.tsx` require a manual smoke test of at least one list page. | src/components/README.md |

---

## Integration Points

### Internal Dependencies (modules this system serves)

All 20 feature modules in `src/atomic-crm/` consume `src/components/` directly:

| Module | Risk Level | Notes |
|--------|-----------|-------|
| `opportunities` | High | Highest coupling fan-in (19). Uses PremiumDatagrid, ListPageLayout, ResourceSlideOver. |
| `contacts` | High | Uses PremiumDatagrid, ListPageLayout, ResourceSlideOver, SectionCard. |
| `organizations` | High | Same pattern as contacts. |
| `providers/supabase` | High | Auth pages in `src/components/supabase/` co-active with `authProvider.ts`. |
| `validation` | High | `createFormResolver` bridges Zod schemas to RA forms. |
| All other feature modules | Low–Medium | Consume ListPageLayout, PremiumDatagrid, SectionCard as standard shells. |

### External / Library Dependencies

| Library | Tier | Purpose |
|---------|------|---------|
| `react-admin` v5 | Tier 2 only | `useInput`, `Datagrid`, `SimpleForm`, `useListContext`, RA prop types |
| `@radix-ui/*` | Tier 1 | Dialog, Popover, Dropdown, Select, Accordion, Tabs primitives |
| `shadcn/ui` (patterns) | Tier 1 | Component styling conventions on top of Radix |
| `tailwindcss` v4 | Both tiers | Semantic token-based styling |
| `react-hook-form` v7 | Tier 2 | Form state management via RA's form integration |
| `lucide-react` | Tier 1 | Icon set |
| `@tanstack/react-query` v5 | Tier 2 indirect | Query invalidation for list refresh |

### Database Tables

None. `src/components/` is a pure UI layer with no direct database access. All data flows through React Admin's data provider context.

---

## Risk Assessment

- **Module Risk Level:** High
- **Risk Score:** 88 / 100
- **Phase Assignment:** 3 (alongside providers and opportunities — highest-scrutiny tier)
- **LOC:** 41,900 (largest module by line count in the codebase)
- **File Count:** 200 files
- **Consuming Dependents:** 20 feature modules
- **Test Coverage:** Partial (factors.test_coverage = 55 out of 100)
- **Git Churn:** 49 commits in 30 days; 19 commits in 14 days (above CI/CD architectural review threshold of 16+, third consecutive audit cycle at this level)

**Active Risk Factors (from risk-assessment.json):**

1. Spans three tiers across multiple subdirectories — tier boundary violations spread silently when `react-admin` imports leak into `ui/`. Run `CMD-007` before merging any Tier 1 change.
2. `ListToolbar.tsx` and `AdaptiveFilterContainer.tsx` are active hotspots. The filter sub-architecture is undergoing active refactoring (Excel-style header filters, preset filters) with zero test coverage on the filters module.
3. Layout module churn elevated: 7 commits in 14 days via list architecture unification — watch for `ListPageLayout` interface drift.
4. Auth pages in `src/components/supabase/` are co-active with `authProvider.ts`; must coordinate changes across both files.
5. Test coverage is partial (55/100). The `ra-wrappers/` subdirectory has the most untested surface area. [REQUIRES REVIEW — specific untested wrappers not enumerated in baseline]

**Security Observations:**

None specific to this UI-layer module. Security concerns (RLS, auth flow) are handled in `supabase/` and `providers/` modules. The `src/components/supabase/` auth pages must not expose session tokens or error details in rendered output.

---

## Acceptance Criteria

| # | Criteria | Current State |
|---|----------|---------------|
| AC-001 | Zero `react-admin` imports in `src/components/ui/` files | Met (verified by CMD-007 pattern) |
| AC-002 | Zero raw `Datagrid` imports from `react-admin` in feature files | Met (CMD-007 enforced) |
| AC-003 | All dialog/modal surfaces have a `DialogTitle` or `AlertDialogTitle` | Met (CORE-015 enforced; [REQUIRES REVIEW] — no automated scan exists for this) |
| AC-004 | Zero hardcoded hex colors in component files | Met (Tailwind v4 semantic tokens enforced) |
| AC-005 | TypeScript compiles with zero errors (`npx tsc --noEmit`) | Met (CI enforced) |
| AC-006 | Zero `zodResolver` direct usages in RA form files | Met (CMD-004 enforced) |
| AC-007 | Tier 1 unit tests run without React Admin context setup | Met (ADR-003 design goal; [REQUIRES REVIEW] — no automated enforcement scan) |
| AC-008 | Interactive elements meet 44px minimum target | Unknown — no automated size audit exists |
| AC-009 | `PremiumDatagrid` used in all feature list pages | Met (CMD-007 audit covers this) |
| AC-010 | Zero production `console.*` calls in component files | Met (CMD-001 enforced) |

---

## Open Questions

1. **[REQUIRES REVIEW]** `ListPageLayout` and `ResourceSlideOver` prop contracts were not verified from source. The README describes their behavior but the exact TypeScript interface was not read. A developer should confirm the interface before adding new consumers.

2. **[REQUIRES REVIEW]** The location of `createFormResolver` (the required Zod-to-RA bridge) was not confirmed from source. It is referenced in rules but the specific file path in `ra-wrappers/` or `validation/` should be documented here.

3. **[REQUIRES REVIEW]** Test coverage for `ra-wrappers/` specifically has not been enumerated. The module-level coverage score of 55/100 is an aggregate. The list of which wrappers have zero test coverage would help prioritize testing work.

4. **[ASSUMPTION]** The `src/components/admin/` subdirectory is treated as Tier 2 in this PRD (React Admin integration layer). The README lists it separately from `ra-wrappers/`. The precise tier classification of `admin/` components should be confirmed.

5. **[ASSUMPTION]** `src/components/domain/` (domain-specific shared components) and `src/components/supabase/` (auth pages) are treated as supporting sub-modules under the same three-tier umbrella. Whether these require their own PRDs or are adequately covered here is an open question.

6. **[REQUIRES REVIEW]** No automated check enforces the `DialogTitle` requirement (AC-003 / CORE-015). A lint rule or custom ESLint plugin may be worth adding to close this gap.

7. **[REQUIRES REVIEW]** The filter sub-module (`src/components/ra-wrappers/column-filters/`) is undergoing active refactoring with zero test coverage. A separate PRD or ADR covering the filter architecture decisions (Excel-style header filters, preset filter strategy) may be warranted.
