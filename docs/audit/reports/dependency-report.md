# Dependency Report — Module Coupling and Dependency Analysis

**Generated:** 2026-03-03
**Run type:** Incremental (builds on 2026-03-03T12:00:00Z baseline)
**Sources:** `docs/audit/baseline/dependency-map.json`, `docs/audit/baseline/audit-meta.json`
[Confidence: 93%]

---

## Summary

| Metric | Value | Delta vs Previous |
|--------|-------|-------------------|
| Total npm packages | 115 (67 prod / 48 dev) | no change |
| Total internal modules | 34 | no change |
| Circular references | 0 | -2 (both resolved this run) |
| God classes | 1 (composedDataProvider) | no change |
| Shared mutable state instances | 7 | no change |
| Most coupled module (fan-in) | validation (91) | no change |
| Most coupled module (both) | opportunities (19 in / 10 out) | no change |

---

## Circular References

**All circular references have been resolved as of this audit run.**

### Resolved This Run

| Previous Circular Reference | Resolution | Commit |
|-----------------------------|------------|--------|
| `opportunities -> providers -> opportunities` | `opportunitiesCallbacks.ts` now imports stage enums from `constants` instead of `opportunities/constants/stage-enums`. Providers module no longer imports from opportunities. | c74a58343 |
| `utils -> opportunities -> utils` | `stalenessCalculation.ts` now imports `STAGE`, `ACTIVE_STAGES`, `CLOSED_STAGES` from `constants`, not `opportunities/constants`. | c74a58343 |

**Before refactor:**
```
opportunities -> providers -> opportunities  (high severity)
utils -> opportunities -> utils              (medium severity)
```

**After refactor:**
```
opportunities -> providers  (one-way, type import only)
utils -> constants          (no dependency on opportunities)
```

Both circular chains were broken by moving stage enum constants to `src/atomic-crm/constants/stage-enums.ts`. The `opportunities/constants/stage-enums.ts` file is retained as a re-export shim to preserve backward compatibility.

---

## High-Coupling Modules

### By Fan-In (most depended upon)

| Module | Path | Fan-In | Fan-Out | Role |
|--------|------|--------|---------|------|
| validation | `src/atomic-crm/validation/` | 91 | 2 | Shared dependency — canonical Zod schemas |
| utils | `src/atomic-crm/utils/` | 73 | 1 | Shared dependency — formatting and calculation utilities |
| constants | `src/atomic-crm/constants/` | 72 | 0 | Shared dependency — pipeline stage enums and app constants |
| queryKeys | `src/atomic-crm/queryKeys.ts` | 34 | 0 | Shared dependency — TanStack Query key factory |
| types | `src/atomic-crm/types.ts` | 34 | 0 | Shared dependency — global TypeScript types |
| hooks | `src/atomic-crm/hooks/` | 13 | 1 | Shared hooks consumed by multiple features |
| productDistributors | `src/atomic-crm/productDistributors/` | 11 | 1 | Junction entity — high fan-in relative to 508 LOC |

### By Coupling (both fan-in and fan-out)

| Module | Path | Fan-In | Fan-Out | Risk |
|--------|------|--------|---------|------|
| opportunities | `src/atomic-crm/opportunities/` | 19 | 10 | Highest coupling in codebase |
| contacts | `src/atomic-crm/contacts/` | 0 | 10 | High fan-out; 10 dependencies |
| validation | `src/atomic-crm/validation/` | 91 | 2 | Extreme fan-in; schema changes cascade everywhere |
| reports | `src/atomic-crm/reports/` | 5 | 6 | Aggregates across multiple entities |
| dashboard | `src/atomic-crm/dashboard/` | 0 | 6 | Consumer-only; 6 dependencies |

---

## Dependency Graph Summary

### Module Reference Map

| Module | References (fan-out) | Referenced By (fan-in) |
|--------|---------------------|----------------------|
| activities | constants, layout, types, utils, validation | timeline |
| admin | constants | (none) |
| components (atomic) | constants, queryKeys, utils, validation | contacts, opportunities, organizations, tags, tasks |
| config | (none) | (none) |
| constants | (none) | activities, admin, components, contacts, dashboard, hooks, notes, opportunities, organizations, products, reports, sales, settings, tags, tasks |
| contacts | components, constants, filters, hooks, opportunities, organizations, queryKeys, types, utils, validation | (none) |
| contexts | (none) | (none listed) |
| dashboard | constants, opportunities, queryKeys, tasks, utils, validation | (none) |
| filters | opportunities, validation | contacts |
| hooks | constants | contacts, opportunities, organizations, settings, tags |
| layout | (none) | activities |
| login | (none) | root |
| notes | constants | (none) |
| notifications | queryKeys | (none) |
| opportunities | components, constants, hooks, organizations, providers, queryKeys, services, types, utils, validation | contacts, dashboard, filters, reports, root, utils |
| organizations | components, constants, hooks, queryKeys, utils, validation | contacts, opportunities |
| pages | (none) | (none) |
| productDistributors | utils | (none) |
| products | constants, queryKeys, utils, validation | (none) |
| providers | services, types, utils, validation | opportunities, validation |
| queryKeys | (none) | components, dashboard, notifications, opportunities, organizations, products, reports, sales, settings, tags, tasks |
| reports | constants, opportunities, queryKeys, types, utils, validation | (none) |
| root | login, opportunities | (none) |
| sales | constants, queryKeys, types, utils, validation | (none) |
| services | (none) | opportunities, providers |
| settings | constants, hooks, queryKeys | (none) |
| shared | (none) | (none) |
| tags | components, constants, hooks, queryKeys | (none) |
| tasks | components, constants, queryKeys, utils, validation | dashboard |
| tests | (none) | (none) |
| timeline | utils | activities |
| types | (none) | activities, opportunities, providers, reports, sales |
| utils | constants | activities, components, contacts, dashboard, organizations, productDistributors, products, reports, sales, tasks, timeline |
| validation | opportunities, providers | activities, components, contacts, dashboard, filters, opportunities, organizations, products, providers, reports, sales, tasks |

---

## God Classes

| Class | File | Lines | Handler References | Risk |
|-------|------|-------|-------------------|------|
| composedDataProvider | `src/atomic-crm/providers/supabase/composedDataProvider.ts` | 260 | 48 | All feature module writes pass through this single file. Any change affects all resources simultaneously. Designated Caution Zone in CLAUDE.md. |

**Recommendation:** Do not split `composedDataProvider.ts` without careful migration. Instead, ensure per-handler unit tests exist (one test file per handler) so that regressions are caught at the handler level rather than discovered at the god-class level.

---

## Shared Mutable State

7 instances of shared mutable state identified. These represent state that exists outside the React render cycle or is shared globally.

| Instance | File | Type | Description | Risk |
|----------|------|------|-------------|------|
| `cachedSnapshot` | `src/atomic-crm/hooks/useRecentSearches.ts` | module_variable | Module-level mutable `let` holding snapshot of recent search items. | Medium — stale search results if not invalidated |
| `cachedSale` | `src/atomic-crm/providers/supabase/authProvider.ts` | module_variable | Module-level mutable `let` caching the authenticated sale (user) record. | High — stale auth identity if not refreshed |
| `cacheTimestamp` | `src/atomic-crm/providers/supabase/authProvider.ts` | module_variable | Companion timestamp for `cachedSale` expiry. | High — determines auth cache staleness |
| `AppBrandingContext` | `src/atomic-crm/contexts/AppBrandingContext.tsx` | context_provider | React context providing app branding config across the entire component tree. | Low — read-only config, low mutation risk |
| `FormOptionsContext` | `src/atomic-crm/contexts/FormOptionsContext.tsx` | context_provider | React context providing form configuration shared across feature forms. | Medium — form misconfiguration propagates broadly |
| `PipelineConfigContext` | `src/atomic-crm/contexts/PipelineConfigContext.tsx` | context_provider | React context providing pipeline/stage configuration consumed by opportunities and dashboard. | Medium — pipeline config change affects kanban and dashboard simultaneously |
| `ConfigurationContext` | `src/atomic-crm/root/ConfigurationContext.tsx` | context_provider | Root-level React context distributing global app configuration to all children. | Low — read-only global config |

**Note on `cachedSale` and `cacheTimestamp`:** These two module-level variables in `authProvider.ts` are the highest-risk shared mutable state instances. A stale `cachedSale` could serve incorrect user identity or role data to RLS-dependent queries. Verify that the cache TTL and invalidation logic are correct on auth state changes (sign-in, sign-out, token refresh).

---

## Loosely Coupled Components

The following modules have zero or near-zero internal consumers, making them safe to modify without risk of breaking other modules.

| Module | Path | Fan-In | Fan-Out | Note |
|--------|------|--------|---------|------|
| config | `src/atomic-crm/config/` | 0 | 0 | Single file (featureFlags.ts). Completely isolated. |
| admin | `src/atomic-crm/admin/` | 0 | 1 | Zero modules import from admin. Only imports from constants. |
| dashboard | `src/atomic-crm/dashboard/` | 0 | 6 | Consumer-only leaf module. Nothing imports from dashboard. |
| notifications | `src/atomic-crm/notifications/` | 0 | 1 | Zero internal consumers. Leaf module. |
| pages | `src/atomic-crm/pages/` | 0 | 0 | Zero imports and zero internal consumers. Effectively isolated. |
| products | `src/atomic-crm/products/` | 0 | 4 | Zero internal consumers. Leaf module. |
| sales | `src/atomic-crm/sales/` | 0 | 5 | Zero internal consumers. Leaf module. |
| settings | `src/atomic-crm/settings/` | 0 | 3 | Zero internal consumers. Leaf module. |
| shared | `src/atomic-crm/shared/` | 1 | 0 | Single file, one consumer. |
| tags | `src/atomic-crm/tags/` | 0 | 4 | Zero internal consumers. Leaf module. |

---

## npm Package Highlights

**Production dependencies (67 total):** Notable packages with security or version implications:

| Package | Version | Note |
|---------|---------|------|
| `@supabase/supabase-js` | ^2.75.1 | Core backend SDK. Keep updated for security patches. |
| `zod` | ^4.1.12 | Schema validation. Zod 4 is a major version — verify all schemas migrated from v3. |
| `react` | ^19.1.0 | React 19 — confirm all third-party packages support React 19. |
| `react-admin` | ^5.10.0 | React Admin 5. |
| `dompurify` | ^3.2.7 | HTML sanitization. Keep updated for XSS patch coverage. |
| `@sentry/react` | ^10.27.0 | Error monitoring. |
| `vite` | ^7.0.4 | Build tool. Major version 7. |

**Version overrides (2):**

| Package | Pinned To | Reason |
|---------|-----------|--------|
| `react-router` | 6.30.3 | Pinned — likely to prevent breaking change from v7 |
| `jose` | 6.1.3 | Pinned — JWT library, security-sensitive |

---

## Changes Since Previous Audit

| Change | Type | Detail |
|--------|------|--------|
| Circular reference resolved: opportunities/providers | Improvement | Stage enums moved to constants; providers no longer imports from opportunities |
| Circular reference resolved: utils/opportunities | Improvement | stalenessCalculation.ts now imports from constants |
| constants module added to tracking | New | 5 files, 72 fan-in, 325 LOC. stage-enums.ts canonical home. |
| utils fan_out reduced 2 to 1 | Improvement | No longer imports from opportunities |
| providers references updated | Updated | opportunities removed from providers reference list |

---

*Source: `docs/audit/baseline/dependency-map.json`. [Confidence: 93%]*
