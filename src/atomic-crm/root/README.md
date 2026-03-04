# Root Module

Application entry point for Crispy CRM. Mounts the React Admin `<Admin>` shell, registers all resources, declares custom routes and legacy redirects, and distributes global configuration via context. Every feature module is imported here and nowhere else — this is the single place to add or remove a top-level resource.

## Key Components

| File | Purpose |
|------|---------|
| `CRM.tsx` | Top-level component: wires providers, resources, and custom routes |
| `ConfigurationContext.tsx` | Combined `ConfigurationProvider` + focused context re-exports |
| `defaultConfiguration.ts` | MFB-specific defaults: title, logos, opportunity stages, task types |
| `i18nProvider.tsx` | React Admin i18n provider (English, ra-i18n-polyglot) |
| `index.ts` | Barrel: exports `CRM`, `ConfigurationContext`, focused hooks, and default config |

## Architecture

- **6 files**, fan-out: 2 (`login`, `opportunities`), fan-in: 0 (nothing imports from `root`)
- **Resource registration**: All 14 RA `<Resource>` declarations live in `CRM.tsx`. Import from each feature's `resource.tsx` directly (not barrel `index.tsx`) to avoid pulling in the full module at startup.
- **Lazy loading**: `ReportsPage`, `HealthDashboard`, `SettingsPage`, `SetPasswordPage`, and `ForgotPasswordPage` are `React.lazy` to keep the initial bundle small.
- **QueryClient**: Configured here with `staleTime: 30s` and `refetchOnWindowFocus: false` (see `STALE_STATE_STRATEGY.md`).
- **LocalStorage store**: Version key `"3"` — increment when RA-persisted state must be invalidated across deploys.
- **ConfigurationProvider**: Wraps three focused sub-contexts (`AppBrandingContext`, `PipelineConfigContext`, `FormOptionsContext`). `useConfigurationContext()` is kept for backward compatibility but triggers re-renders on any config change. New code should use the focused hooks.

## Configuration Context

| Hook | Provides |
|------|---------|
| `useAppBranding()` | `title`, `darkModeLogo`, `lightModeLogo` |
| `usePipelineConfig()` | `opportunityStages`, `opportunityCategories`, `dealStages` |
| `useFormOptions()` | `noteStatuses`, `taskTypes`, `contactGender` |

## Dependencies

### Internal Modules
- `login` — `StartPage` login component
- `opportunities` — stage constants used in `defaultConfiguration.ts`
- All feature `resource.tsx` files are imported directly (not from barrel)

### Key npm Packages
- `react-admin` ^5.10.0 — `Admin`, `Resource`, `CustomRoutes`, `localStorageStore`
- `ra-core` ^5.10.0 — `AuthProvider`, `DataProvider` types
- `@tanstack/react-query` ^5.85.9 — `QueryClient` configuration
- `react-router-dom` ^6.30.3 — `Route`, `Navigate`, `useParams`

## Custom Routes

| Path | Destination / Purpose |
|------|-----------------------|
| `/set-password` | Password recovery flow (no layout) |
| `/forgot-password` | Forgot password flow (no layout) |
| `/settings` | `SettingsPage` |
| `/reports` | `ReportsPage` (lazy) |
| `/admin/health` | `HealthDashboard` (admin only, lazy) |
| `/admin/users` | Redirects to `/sales` |
| `/opportunities/kanban` | Redirects to `/opportunities?view=kanban` |
| `/contacts/:id/show` | Legacy redirect to `/contacts?view=:id` |
| `/tasks/:id` / `/tasks/:id/show` | Legacy redirects via `taskRoutes` helpers |

## Common Modification Patterns

Adding a new resource: create `resource.tsx` in the feature module, import it in `CRM.tsx`, and add a `<Resource>` declaration in the resource list. Do not import from the feature's barrel `index.tsx`. Adding a new page route: add a `React.lazy` import at the top of `CRM.tsx` and a `<Route>` inside `<CustomRoutes>`. To change a default configuration value (stages, task types, logos), edit `defaultConfiguration.ts` — the `CRM` component accepts all of these as overridable props so callers are not broken.

## Guardrails

- `CRM.tsx` is the resource registry for the entire application. A misregistered or missing `<Resource>` name breaks all provider reads and writes for that entity.
- `ConfigurationContext` is deprecated as a direct consumer hook. New components must use `useAppBranding`, `usePipelineConfig`, or `useFormOptions` to avoid unnecessary re-renders.
- The `localStorageStore` version string (`"3"`) must be incremented when React Admin's persisted sort/filter state needs to be cleared on deploy.
- Full audit report: `docs/audit/`
