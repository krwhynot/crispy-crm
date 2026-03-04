# Contexts Module

Shared React context providers for application-wide configuration in Crispy CRM. These contexts replaced a monolithic `ConfigurationContext` (P2-1 fix) to reduce unnecessary re-renders by splitting branding, pipeline, and form concerns into three focused providers. Seven modules consume these contexts, including layout, tasks, opportunities, and organizations.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | React 19 |
| Risk Level | Low |
| Phase | 1 |
| Test Project | None |
| Dependents | 7 (layout, tasks, opportunities, organizations, login, shared/components, ra-wrappers) |

## Key Components

| File | Purpose |
|------|---------|
| `AppBrandingContext.tsx` | Provides title, dark-mode logo, and light-mode logo set at app init |
| `PipelineConfigContext.tsx` | Provides deal stages, opportunity stages, and pipeline categories |
| `FormOptionsContext.tsx` | Provides note status, task type, and contact gender options for form selects |
| `useAppBranding.ts` | Hook for consuming `AppBrandingContext` |
| `usePipelineConfig.ts` | Hook for consuming `PipelineConfigContext` |
| `useFormOptions.ts` | Hook for consuming `FormOptionsContext` |
| `index.ts` | Barrel export for all contexts, providers, hooks, and types |

## Dependencies

### Project References
- `src/atomic-crm/root/defaultConfiguration` — supplies all default values consumed by providers
- `src/atomic-crm/types` — `NoteStatus`, `ContactGender`, `DealStage` types used in context interfaces

### npm Packages
- `react` — `createContext`, `useMemo`, `ReactNode` (peer dependency, version from package.json)

### External Integrations
None.

## Common Modification Patterns

All three contexts follow the same structure: an exported `interface`, a `createContext` call with typed defaults, a `Provider` component that `useMemo`-memoizes its value, and a companion hook in a separate file. To add a new value to an existing context, update the interface, add the prop to the provider's parameter list with a default from `defaultConfiguration`, and include it in the `useMemo` dependency array. To add a new context entirely, follow the same three-file pattern (`FooContext.tsx`, `useFoo.ts`) and export from `index.ts`. Default values always come from `src/atomic-crm/root/defaultConfiguration` — never hardcode them in the context file.

## Guardrails

- **Shared mutable state**: All three contexts are flagged in `dependency-map.json` as shared mutable state instances. Re-render impact is limited by `useMemo` in each provider, but adding new frequently-changing values should be reviewed before merging.
- **Consumers import only what they need**: Components must import the narrowest context hook (`useAppBranding`, `usePipelineConfig`, or `useFormOptions`) to avoid subscribing to unrelated state changes — do not re-consolidate these into a single context.
- **No test coverage**: This module has no test files. Changes to context shape (interface fields, default values) should be verified by running the consumer test suites in `tasks`, `opportunities`, and `organizations`.

## Related

- Full audit report: `docs/audit/baseline/risk-assessment.json` (entry: `contexts`)
- Default values: `src/atomic-crm/root/defaultConfiguration.ts`
- Legacy monolith (replaced): `src/atomic-crm/root/ConfigurationContext.tsx`
