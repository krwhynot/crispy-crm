# Layout Module

App shell components for Crispy CRM. Provides the root layout frame, top navigation header, list toolbar, and form toolbar used by every feature module. All feature pages render inside `Layout` and use `TopToolbar` or `FormToolbar` for their action areas.

## Key Components

| File | Purpose |
|------|---------|
| `Layout.tsx` | Root shell: `h-dvh` flex chain, `Header`, `ErrorBoundary`, `Suspense`, fixed footer, skip-to-content link |
| `Header.tsx` | Top nav bar: logo (theme-aware), `NavigationTab` links, `ThemeModeToggle`, `RefreshButton`, `NotificationBell`, `UserMenu` |
| `TopToolbar.tsx` | Flex row for list-level actions (sort, filter, export, create buttons) |
| `FormToolbar.tsx` | Standard edit-form toolbar: `DeleteButton` left, `CancelButton` + `SaveButton` right |
| `index.ts` | Barrel export for all four components |

## Architecture

- **5 files, 318 LOC** — smallest layout surface in the codebase
- **No internal dependencies**: zero imports from other `src/atomic-crm/*` modules (fan-out = 0)
- **5 dependents**: consumed by `activities` and indirectly by all feature pages through the app shell
- **Viewport chain**: `Layout` establishes `h-dvh → flex-1 main → flex-1 ListView` so child list views never need `calc(100vh - ...)` hacks
- **Accessibility**: skip-to-content link (`#main-content`), `tabIndex={-1}` on `<main>`, `aria-label` on logo mask, `focus-visible` rings on `NavigationTab`
- **Branding**: `Header` reads `darkModeLogo`, `lightModeLogo`, and `title` from `ConfigurationContext` (`useAppBranding`), not from hardcoded values

## Common Modification Patterns

Navigation tabs are defined directly in `Header.tsx` as `<NavigationTab>` elements — to add a new top-level route, add a `matchPath` branch in the `currentPath` block and a corresponding `<NavigationTab>` in the nav render. New user-menu items follow the `ConfigurationMenu` / `UsersMenu` pattern: a `DropdownMenuItem` wrapping a `Link` with `onClose` called on click. Semantic tokens (`bg-secondary`, `text-secondary-foreground`, `bg-primary`) must be used for any styling changes — no hardcoded hex colors per `CORE-017`.

## Guardrails

- **Low risk, Phase 1** — safe to modify under standard exit criteria (zero TS errors, lint clean, code review)
- No DB access, no provider calls, no Zod schemas — purely presentational shell
- `Header.tsx` references `useAppBranding` from `ConfigurationContext`; branding token changes affect every page
- No test files; changes should be verified visually on desktop (1440px+) and iPad breakpoints

## Related

- Full audit report: `docs/audit/baseline/risk-assessment.json` (layout entry)
- Shared layout primitives (slide-over, list page shell): `src/components/layouts/`
- Notification bell implementation: `src/components/NotificationBell.tsx`
- Theme provider: `src/components/ra-wrappers/theme-provider`
