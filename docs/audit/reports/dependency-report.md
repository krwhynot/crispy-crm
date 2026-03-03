# Dependency Report — Module Coupling and Dependency Analysis

**Generated:** 2026-03-03
**Baseline run:** incremental (prior run: 2026-03-03T00:00:00Z)
**Source:** `docs/audit/baseline/dependency-map.json`, `docs/audit/baseline/audit-meta.json`
**Confidence:** 94%

---

## 1. Summary

| Metric | Value |
|--------|-------|
| Total npm packages | 115 (67 prod, 48 dev) |
| Total internal modules | 34 |
| Circular references | 2 |
| God classes | 1 (`composedDataProvider`) |
| Shared mutable state instances | 7 |
| Most-depended-upon module (fan-in) | `validation` (91) |
| Most-consuming module (fan-out) | `opportunities` (10), `contacts` (10) |
| Circular refs resolved since last audit | 1 |

---

## 2. High-Coupling Modules

Modules sorted by fan-in (number of modules that import them) descending.

| Module | Fan-in | Fan-out | Role | Risk |
|--------|--------|---------|------|------|
| `validation` | 91 | 2 | Shared dependency | HIGH — schema changes cascade to all 91 consumers |
| `utils` | 73 | 2 | Shared dependency | HIGH — utility changes affect 73 consuming files |
| `constants` | 72 | 0 | Shared dependency | HIGH — constant changes affect 72 consumers |
| `queryKeys` | 34 | 0 | Shared dependency | MEDIUM — query key changes affect all React Query usage |
| `types` | 34 | 0 | Shared dependency | MEDIUM — type changes cascade broadly |
| `opportunities` | 19 | 10 | High coupling | HIGH — both high fan-in and high fan-out |
| `hooks` | 13 | 1 | Shared dependency | MEDIUM — broadly consumed by feature modules |
| `productDistributors` | 11 | 1 | Feature | MEDIUM — disproportionate fan-in for 508 LOC |
| `organizations` | 3 | 6 | Feature | MEDIUM — imported by contacts and opportunities |
| `components` (atomic-crm) | 7 | 4 | Shared feature components | LOW — manageable size |
| `services` | 8 | 0 | Service layer | MEDIUM — 8 dependents, zero test coverage |

### Cross-Reference: High Coupling + High Risk

Per `audit-meta.json` cross_references:
- `providers` (fan-in 91 via the validation layer, risk: high) — all writes from all modules flow through this layer.
- `opportunities` (fan-in 19, risk: high) — most-imported feature module; changes have the broadest feature-level blast radius.

---

## 3. Circular References

Two circular dependencies remain after one was resolved in this audit run.

### Circular Reference 1 — SEVERITY: HIGH

**Cycle:** `opportunities` -> `providers` -> `opportunities`

**Files involved:**
- `src/atomic-crm/opportunities/ArchiveActions.tsx` imports from `src/atomic-crm/providers/supabase/extensions/types`
- `src/atomic-crm/opportunities/slideOverTabs/OpportunityContactsTab.tsx` imports from `src/atomic-crm/providers/supabase/extensions/types`
- `src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts` imports from `src/atomic-crm/opportunities/constants/stage-enums`

**Rule violation:** PRV-006 — handlers do transport/plumbing only. Stage-enum constants in the providers layer indicates business logic crossing the layer boundary.

**Description:** The provider callback (`opportunitiesCallbacks.ts`) imports stage-enum constants from the feature module it is supposed to serve. This creates a bi-directional coupling across the provider boundary, which is the architectural separation CLAUDE.md and the provider rules exist to enforce.

**Recommended fix:**
1. Move `stage-enums` (and any other shared opportunity constants used by providers) to `src/atomic-crm/constants/` — the zero-fan-out shared constants module.
2. Update `opportunitiesCallbacks.ts` to import from `constants/` instead of from the `opportunities` feature module.
3. Update opportunity feature files to import stage-enums from `constants/` as well.
4. Verify with `npx tsc --noEmit` after the move.

---

### Circular Reference 2 — SEVERITY: MEDIUM

**Cycle:** `utils` -> `opportunities` -> `utils`

**Files involved:**
- `src/atomic-crm/utils/stalenessCalculation.ts` imports `STAGE`, `ACTIVE_STAGES`, `CLOSED_STAGES` from `src/atomic-crm/opportunities/constants`
- Multiple `src/atomic-crm/opportunities/*.tsx` files import utilities from `src/atomic-crm/utils`

**Rule violation:** Stage constants should live in `src/atomic-crm/constants/` so that the `utils` module does not import from a feature module. Utilities should have zero feature module dependencies.

**Recommended fix:**
1. Move `STAGE`, `ACTIVE_STAGES`, and `CLOSED_STAGES` from `src/atomic-crm/opportunities/constants/` to `src/atomic-crm/constants/`.
2. Update `utils/stalenessCalculation.ts` to import from the shared `constants/` module.
3. Update all `opportunities/` files that import stage constants to use the new `constants/` path.
4. This fix overlaps with the fix for Circular Reference 1 — both can be resolved in one pass.

---

### Resolved Since Last Audit

| Previous Cycle | Resolution |
|----------------|-----------|
| `validation` -> `providers` -> `validation` | Resolved in production code. `schemaDrift.test.ts` still references providers but is exempt under CORE-022 (test files). |

---

## 4. God Classes

### `composedDataProvider`
- **File:** `src/atomic-crm/providers/supabase/composedDataProvider.ts`
- **Lines:** ~260
- **Handler references:** 48
- **Dependency count:** 48

This is the central handler routing hub for all resource CRUD operations. Every feature module write passes through this single file. It is explicitly designated a **Caution Zone** in `CLAUDE.md`.

**Risk:** Any change to `composedDataProvider.ts` simultaneously affects all 48 registered resources. A broken import or incorrect routing silently fails or breaks all data operations.

**Mitigation strategy:**
- Do not split this file — it is intentionally a registration hub.
- Ensure each handler has its own unit tests so that `composedDataProvider.ts` acts as a thin router.
- Require tech lead review for all changes (per AI guardrails in `integration-map.json`).
- Never auto-modify via AI agents without explicit human instruction.

---

## 5. Shared Mutable State

Seven instances of shared mutable state were identified. React contexts are expected and intentional; module-level variables are higher risk.

| Type | Name | File | Risk |
|------|------|------|------|
| Module variable | `cachedSnapshot` | `src/atomic-crm/hooks/useRecentSearches.ts` | MEDIUM — shared across all hook invocations in module scope |
| Module variable | `cachedSale` | `src/atomic-crm/providers/supabase/authProvider.ts` | HIGH — caches authenticated user record; stale cache causes auth bugs |
| Module variable | `cacheTimestamp` | `src/atomic-crm/providers/supabase/authProvider.ts` | HIGH — companion to cachedSale; timestamp-based invalidation |
| Context provider | `AppBrandingContext` | `src/atomic-crm/contexts/AppBrandingContext.tsx` | LOW — read-only branding config |
| Context provider | `FormOptionsContext` | `src/atomic-crm/contexts/FormOptionsContext.tsx` | LOW — form configuration options |
| Context provider | `PipelineConfigContext` | `src/atomic-crm/contexts/PipelineConfigContext.tsx` | MEDIUM — pipeline/stage config consumed by opportunities and dashboard |
| Context provider | `ConfigurationContext` | `src/atomic-crm/root/ConfigurationContext.tsx` | MEDIUM — root-level global config distribution |

**High-risk items:**
- `cachedSale` and `cacheTimestamp` in `authProvider.ts` are module-level mutable `let` variables. If the auth state changes (e.g., session expiry, role change) and the cache is not properly invalidated, the application can serve stale permission data to the UI. Since `authProvider.ts` is a Caution Zone, any changes to this caching mechanism require security team review.

---

## 6. Loosely Coupled Components

The following modules have zero or minimal internal consumers and are safe to refactor, replace, or delete independently.

| Module | Fan-in | Fan-out | Notes |
|--------|--------|---------|-------|
| `config` | 0 | 0 | Single file (`featureFlags.ts`). No atomic-crm module imports from config. |
| `admin` | 0 | 1 | Zero modules import from admin; only imports from constants. Health dashboard. |
| `dashboard` | 0 | 6 | Consumer-only leaf module; nothing imports it. |
| `notifications` | 0 | 1 | Leaf module; zero internal consumers. |
| `pages` | 0 | 0 | Zero imports and zero consumers — effectively isolated. |
| `products` | 0 | 4 | Leaf module; zero internal consumers. |
| `sales` | 0 | 5 | Leaf module; zero internal consumers. |
| `settings` | 0 | 3 | Leaf module; zero internal consumers. |
| `shared` | 1 | 0 | Single file, no outbound imports, one consumer. |
| `tags` | 0 | 4 | Leaf module; zero internal consumers. |

These modules have low blast radius — changes affect only their own UI and the provider layer. They are good candidates for first-pass refactoring work (Phase 1 in the risk assessment).

---

## 7. Changes Since Last Audit

| Change | Description | Impact |
|--------|-------------|--------|
| Circular reference resolved | `validation` -> `providers` (production code) | Positive — production code is clean; test exemption is correct under CORE-022 |
| config module reduced | `config` reduced from 2 files to 1 (`featureFlags.ts`). No atomic-crm imports from config. | Positive — simpler module boundary |
| New top-level files | `src/atomic-crm/consts.ts` (5 lines, no consumers) and `src/atomic-crm/searchability.ts` (35 lines, imported by `ListPageLayout.tsx`) | Watch — `consts.ts` is unused dead code |

### Dead Code Identified

`src/atomic-crm/consts.ts` has 5 lines and zero consumers. This file should be either:
- Deleted if the constants were consolidated elsewhere, or
- Connected to the modules that should consume it.

---

## 8. Dependency Graph Visualization

Below is a simplified fan-in/fan-out map of the key relationships. Arrows point from consumer to dependency.

```
[contacts]  ----+
[dashboard] ----|----> [opportunities] ----> [organizations]
[filters]   ----|                      ----> [providers]
[reports]   ----|                      ----> [validation]
[root]      ----|
                |
[activities]    |
[components]----|----> [validation] (fan-in: 91)
[contacts]  ----|----> [utils]      (fan-in: 73)
[dashboard] ----|----> [constants]  (fan-in: 72)
[products]  ----|----> [queryKeys]  (fan-in: 34)
[sales]     ----|----> [types]      (fan-in: 34)
[tasks]     -+
              |
              +----> [providers] ----> [composedDataProvider (GOD CLASS)]
                                            |
                              +---------+---+---+---------+
                              v         v       v         v
                         [handlers] [services] [auth]  [extensions]
```

The `validation`, `utils`, and `constants` modules are the "utility spine" of the application. Any breaking change in these three modules propagates to the majority of the codebase.

---

*Source: `docs/audit/baseline/dependency-map.json`. Confidence: 94%.*
