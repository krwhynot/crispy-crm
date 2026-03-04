# Dependency Report — Module Coupling and Dependency Analysis

**Generated:** 2026-03-03T23:30:00Z
**Baseline source:** `docs/audit/baseline/dependency-map.json`
**Audit type:** Incremental (last audit: 2026-03-03T12:00:00Z)

---

## Summary

| Metric | Value |
|---|---|
| Total NPM packages | 115 (67 prod / 48 dev) |
| Total internal modules | 34 |
| Circular references | 0 |
| God classes | 1 |
| Shared mutable state instances | 7 |
| TypeScript project references | 0 |

---

## High-Coupling Modules

Modules with fan-in >= 10 or fan-out >= 8 warrant special attention: changes here cascade broadly.

| Module | Path | Fan-In | Fan-Out | Role | Notes |
|---|---|---|---|---|---|
| `validation` | `src/atomic-crm/validation/` | 91 | 2 | shared_dependency | Most depended-upon module. All Zod schemas live here. Any change cascades to 91 consumers. |
| `utils` | `src/atomic-crm/utils/` | 73 | 1 | shared_dependency | Second-most depended-upon. fan_out reduced from 2 to 1 this cycle (no longer imports from opportunities). |
| `constants` | `src/atomic-crm/constants/` | 72 | 0 | shared_dependency | Pure leaf — no outbound imports. 72 consumers depend on enum and constant definitions. |
| `opportunities` | `src/atomic-crm/opportunities/` | 19 | 10 | high_coupling | Highest bidirectional coupling in codebase. Imported by contacts, dashboard, filters, reports, root, utils. |
| `contacts` | `src/atomic-crm/contacts/` | 0 | 10 | high_fan_out | Leaf module with 10 outbound dependencies. Imports from filters, hooks, opportunities, organizations, etc. |

Source: `dependency-map.json` `summary.most_coupled_modules`

---

## Full Module Dependency Graph

| Module | Files | Fan-In | Fan-Out | References (outbound) | Referenced By (inbound) |
|---|---|---|---|---|---|
| activities | 24 | 1 | 5 | constants, layout, types, utils, validation | timeline |
| admin | 2 | 0 | 1 | constants | — |
| components (atomic-crm) | 7 | 7 | 4 | constants, queryKeys, utils, validation | contacts, opportunities, organizations, tags, tasks |
| config | 1 | 0 | 0 | — | — |
| constants | 5 | 72 | 0 | — | activities, admin, components, contacts, dashboard, hooks, notes, opportunities, organizations, products, reports, sales, settings, tags, tasks |
| contacts | 80 | 0 | 10 | components, constants, filters, hooks, opportunities, organizations, queryKeys, types, utils, validation | — |
| contexts | 7 | 7 | 0 | — | — |
| dashboard | 62 | 0 | 6 | constants, opportunities, queryKeys, tasks, utils, validation | — |
| filters | 36 | 1 | 2 | opportunities, validation | contacts |
| hooks | 14 | 13 | 1 | constants | contacts, opportunities, organizations, settings, tags |
| layout | 5 | 5 | 0 | — | activities |
| login | 4 | 3 | 0 | — | root |
| notes | 7 | 7 | 1 | constants | — |
| notifications | 4 | 3 | 1 | queryKeys | — |
| opportunities | 152 | 19 | 10 | components, constants, hooks, organizations, providers, queryKeys, services, types, utils, validation | contacts, dashboard, filters, reports, root, utils |
| organizations | 97 | 3 | 6 | components, constants, hooks, queryKeys, utils, validation | contacts, opportunities |
| pages | 2 | 2 | 0 | — | — |
| productDistributors | 12 | 11 | 1 | utils | — |
| products | 27 | 0 | 4 | constants, queryKeys, utils, validation | — |
| providers | 116 | 6 | 4 | services, types, utils, validation | opportunities, validation |
| queryKeys | 1 | 34 | 0 | — | components, dashboard, notifications, opportunities, organizations, products, reports, sales, settings, tags, tasks |
| reports | 58 | 5 | 6 | constants, opportunities, queryKeys, types, utils, validation | — |
| root | 6 | 6 | 2 | login, opportunities | — |
| sales | 20 | 0 | 5 | constants, queryKeys, types, utils, validation | — |
| services | 15 | 8 | 0 | — | opportunities, providers |
| settings | 13 | 0 | 3 | constants, hooks, queryKeys | — |
| shared | 1 | 1 | 0 | — | — |
| tags | 18 | 0 | 4 | components, constants, hooks, queryKeys | — |
| tasks | 29 | 3 | 5 | components, constants, queryKeys, utils, validation | dashboard |
| tests | 5 | 5 | 0 | — | — |
| timeline | 5 | 5 | 1 | utils | activities |
| types | 1 | 34 | 0 | — | activities, opportunities, providers, reports, sales |
| utils | 37 | 73 | 1 | constants | activities, components, contacts, dashboard, organizations, productDistributors, products, reports, sales, tasks, timeline |
| validation | 96 | 91 | 2 | opportunities, providers | activities, components, contacts, dashboard, filters, opportunities, organizations, products, providers, reports, sales, tasks |

---

## Circular References

No circular references detected in this audit cycle.

Previous cycle resolved: `utils -> opportunities -> utils` (now resolved: utils no longer imports opportunities).

Source: `dependency-map.json` `circular_references: []`

---

## God Classes

| Class | File | Lines | Handler References | Reason |
|---|---|---|---|---|
| `composedDataProvider` | `src/atomic-crm/providers/supabase/composedDataProvider.ts` | 260 | 48 | Central handler routing hub. Every feature module write passes through this single file. Designated Caution Zone in CLAUDE.md. Auto-modify: disabled. |

This file has 48 handler references and routes all resource CRUD operations. It must not be modified without lead engineer review.

---

## Shared Mutable State

Seven instances of shared mutable state identified. Module-level `let` variables and React contexts are the primary forms.

| Type | Name | File | Description |
|---|---|---|---|
| module_variable | `cachedSnapshot` | `src/atomic-crm/hooks/useRecentSearches.ts` | Module-level mutable let variable holding snapshot of recent search items. |
| module_variable | `cachedSale` | `src/atomic-crm/providers/supabase/authProvider.ts` | Module-level mutable let variable caching the authenticated sale record. |
| module_variable | `cacheTimestamp` | `src/atomic-crm/providers/supabase/authProvider.ts` | Module-level mutable let variable storing auth cache timestamp. Companion to cachedSale. |
| context_provider | `AppBrandingContext` | `src/atomic-crm/contexts/AppBrandingContext.tsx` | React context providing app branding config across the entire component tree. |
| context_provider | `FormOptionsContext` | `src/atomic-crm/contexts/FormOptionsContext.tsx` | React context providing form configuration options shared across feature forms. |
| context_provider | `PipelineConfigContext` | `src/atomic-crm/contexts/PipelineConfigContext.tsx` | React context providing pipeline/stage configuration consumed by opportunities and dashboard. |
| context_provider | `ConfigurationContext` | `src/atomic-crm/contexts/ConfigurationContext.tsx` (root) | Root-level React context distributing global app configuration to all children. |

The three module-level `let` variables in `authProvider.ts` (`cachedSale`, `cacheTimestamp`) are the highest-concern instances: they are mutated by auth state transitions and could produce stale data under concurrent tab scenarios.

---

## Loosely Coupled Components

These modules have zero or near-zero inbound consumers and are safe to modify in isolation.

| Module | Path | Fan-In | Fan-Out | Notes |
|---|---|---|---|---|
| config | `src/atomic-crm/config/` | 0 | 0 | Single file `featureFlags.ts`. No atomic-crm module imports from config. |
| admin | `src/atomic-crm/admin/` | 0 | 1 | Zero modules import from admin; only imports from constants. |
| dashboard | `src/atomic-crm/dashboard/` | 0 | 6 | Zero internal consumers; consumer-only leaf module. |
| notifications | `src/atomic-crm/notifications/` | 0 | 1 | Zero internal consumers; leaf module. |
| pages | `src/atomic-crm/pages/` | 0 | 0 | Zero imports and zero internal consumers; effectively isolated. |
| products | `src/atomic-crm/products/` | 0 | 4 | Zero internal consumers; leaf module. |
| sales | `src/atomic-crm/sales/` | 0 | 5 | Zero internal consumers; leaf module. |
| settings | `src/atomic-crm/settings/` | 0 | 3 | Zero internal consumers; leaf module. |
| shared | `src/atomic-crm/shared/` | 1 | 0 | Single file, no outbound imports, one consumer. |
| tags | `src/atomic-crm/tags/` | 0 | 4 | Zero internal consumers; leaf module. |

---

## Changes Since Last Audit

| Type | Module | Description |
|---|---|---|
| bug_fix | providers | `authProvider.ts`: hardened recovery link redirect. Hash check now also passes when URL contains `type=recovery` and `access_token` tokens. No new module imports added; module dependency graph unchanged. |

No structural dependency changes occurred this cycle. The module graph is stable.

---

## NPM Production Dependencies (67 packages)

Key runtime dependencies by category:

| Category | Packages |
|---|---|
| UI Framework | react 19, react-dom 19, react-admin 5.10, ra-core 5.10 |
| Backend | @supabase/supabase-js 2.75, ra-supabase-core 3.5 |
| State / Query | @tanstack/react-query 5.85 |
| Forms | react-hook-form 7.66, zod 4.1 |
| UI Components | @radix-ui/* (22 packages), lucide-react 0.542, sonner 2.0, vaul 1.1 |
| Styling | tailwindcss 4.1, tailwind-merge 3.3, class-variance-authority 0.7 |
| Charts / DnD | chart.js 4.5, react-chartjs-2 5.3, @dnd-kit/* (3 packages) |
| Utilities | date-fns 4.1, es-toolkit 1.42, dompurify 3.2, papaparse 5.5 |
| Monitoring | @sentry/react 10.27, @sentry/vite-plugin 4.6 |
| Build | vite 7.0, @vitejs/plugin-react 4.6 |

Full package list with versions: `docs/audit/baseline/dependency-map.json` `npm_packages`

---

## Confidence Statement

Dependency data sourced entirely from `dependency-map.json`. Fan-in/fan-out counts reflect static import analysis. Circular reference detection confirmed zero cycles. Shared mutable state identified via manual audit of module-level variables and React context providers.

[Confidence: 93%]
