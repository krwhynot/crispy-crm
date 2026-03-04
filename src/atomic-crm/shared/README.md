# Shared Module

Cross-module UI primitives for Crispy CRM. Currently holds a single presentational component, `Status`, that renders a color-coded dot with tooltip for contact/organization status values. It exists here rather than inside a feature module because it is designed to be consumed by any feature that needs status display without pulling in feature-specific logic.

## Quick Reference

| Property | Value |
|----------|-------|
| Language | TypeScript + React 19 |
| Framework | React 19 + Tailwind CSS v4 |
| Risk Level | Low |
| Phase | 1 |
| Test Project | None |
| Dependents | 1 (organizations) |

## Key Components

| Component | Purpose |
|-----------|---------|
| `components/Status.tsx` | Color-coded status dot with hover tooltip. Reads status labels from `FormOptionsContext` and maps status values to semantic CSS variables. |

## Dependencies

### Internal References

| Module | Role |
|--------|------|
| `src/atomic-crm/root/ConfigurationContext` | Provides `useFormOptions()` for runtime status label lookup |
| `src/lib/utils.ts` | `cn()` class-name utility |

### npm Packages

None. All styling is via Tailwind CSS v4 semantic tokens already loaded in the app.

## Features in This Project

This module does not map to a domain feature in `feature-inventory.json`. It is a shared utility layer.

## Common Modification Patterns

New shared components belong here only when they have no feature-specific business logic and are expected to be imported by two or more feature modules. To add a component, create it under `src/atomic-crm/shared/components/` following the existing naming convention (PascalCase, `.tsx`). Avoid adding hooks or service calls inside this directory; side-effect logic belongs in `src/atomic-crm/hooks/` or `src/atomic-crm/services/`.

The `Status` component is intentionally read-only: it consumes `noteStatuses` from `FormOptionsContext` but performs no writes. Follow the same pattern for any new component added here — props in, rendered output out, no mutation.

## Guardrails

- `src/atomic-crm/root/ConfigurationContext` is read-only here. Do not pass setters or mutate context state from shared components.
- Shared components must use Tailwind v4 semantic tokens (`bg-warning`, `bg-destructive`, `bg-success`, CSS variables via `var(--...)`) — never hardcoded hex colors (CORE-017).
- Do not import from `react-admin` directly inside this directory. If an RA dependency is needed, it belongs in `src/components/ra-wrappers/` (Tier 2) instead (CORE-001, UI-002).

## Further Reading

- Full audit baseline: `docs/audit/baseline/`
- Three-tier UI architecture: `docs/adr/003-three-tier-ui-architecture.md`
- Design token usage: `CLAUDE.md` — Design System section
