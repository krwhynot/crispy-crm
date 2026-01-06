# 🏗️ Master Plan: Provider Cleanup & Restructuring

**Status:** Draft
**Goal:** Migrate from Monolithic (`unifiedDataProvider`) to Composed (`handlers/`) architecture safely using the Strangler Fig pattern.

---

## Phase 1: Fix & Stabilize (Immediate)
*Goal: Stop the generic errors and prevent the monolith from getting worse.*

- [ ] **Patch `unifiedDataProvider.ts` Error Handling**
    - [ ] Open `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
    - [ ] Replace the generic `catch` block in `wrapMethod` with the Zod-to-React-Admin mapping code
    - [ ] **Verify:** Submit an empty form (e.g., Opportunities) and confirm you see specific red validation messages
- [ ] **Enforce Monolith Code Freeze**
    - [ ] **Rule:** No new features added to `unifiedDataProvider.ts`
    - [ ] **Rule:** All new resources must start in `src/providers/supabase/handlers/`

---

## Phase 2: Low-Risk Migration (During Beta)
*Goal: Move simple resources to the new architecture to prove it works safely.*

- [ ] **Migrate `Tags` Resource**
    - [ ] Create `src/providers/supabase/handlers/tagsHandler.ts`
    - [ ] Implement `getList`, `create`, `update`, `delete` (copy logic from monolith)
    - [ ] Apply wrappers: `withErrorLogging(withLifecycleCallbacks(withValidation(...)))`
    - [ ] **Fix wrapper order:** Ensure `Validation → Lifecycle → ErrorLogging` (see Appendix Table 1)
    - [ ] Register in `composedDataProvider.ts`
    - [ ] **Verify:** Test Tag management in the UI
    - [ ] **Cleanup:** Delete `Tags` logic from `unifiedDataProvider.ts`
- [ ] **Migrate `Notes` Resources**
    - [ ] Create `src/providers/supabase/handlers/notesHandler.ts` (use factory function)
    - [ ] Register handlers for: `contact_notes`, `opportunity_notes`, `organization_notes`
    - [ ] **Fix wrapper order** for all 3 note types (see Appendix Table 1)
    - [ ] **Verify:** Test adding notes to different entities
    - [ ] **Cleanup:** Delete all Note logic from `unifiedDataProvider.ts`

---

## Phase 3: Service Layer Extraction (Pre-Launch)
*Goal: Extract complex business logic so it can be reused by the new handlers.*

- [ ] **Create `ProductsService.ts`**
    - [ ] Create `src/atomic-crm/services/ProductsService.ts`
    - [ ] Move these raw `supabase.from('products')` calls from monolith:
        - [ ] `getOneWithDistributors(id)` — Replace unified:677-694
        - [ ] `createWithDistributors(data, distributorIds)` — Replace unified:834-860
        - [ ] `updateWithDistributors(id, data, distributorIds)` — Replace unified:932-970
        - [ ] `softDelete(id)` — Replace RPC call at unified:1175-1184
        - [ ] `softDeleteMany(ids)` — Replace RPC at unified:1245-1255
- [ ] **Create `ProductDistributorsService.ts`**
    - [ ] Create `src/atomic-crm/services/ProductDistributorsService.ts`
    - [ ] Encapsulate Composite Key logic (`product_id` + `distributor_id`):
        - [ ] `getOne(productId, distributorId)` — Replace unified:658-672
        - [ ] `update(productId, distributorId, data)` — Replace unified:974-994
        - [ ] `delete(productId, distributorId)` — Replace unified:1103-1114

---

## Phase 4: High-Risk Migration (Refactor Gate)
*Goal: Migrate the complex "Core" resources once Beta features are stable.*

- [ ] **Migrate `Products` Resource**
    - [ ] Create `src/providers/supabase/handlers/productsHandler.ts`
    - [ ] Inject `ProductsService` into the handler
    - [ ] Add `update()` interception (mirror the existing `create()` pattern)
    - [ ] Add `delete()` via `archive_product_soft_delete` RPC
    - [ ] **Verify:** Creating a product correctly saves distributor relationships
    - [ ] **Cleanup:** Delete `Products` logic from `unifiedDataProvider.ts`
- [ ] **Migrate `Opportunities` Resource (The Boss)**
    - [ ] Create `src/providers/supabase/handlers/opportunitiesHandler.ts`
    - [ ] Inject `OpportunitiesService`
    - [ ] **Critical Fix:** Add `create()` interception calling `opportunitiesService.createWithProducts`
    - [ ] **Critical Fix:** Add `update()` interception calling `opportunitiesService.updateWithProducts`
    - [ ] Add `deleteMany()` cascade via RPC loop
    - [ ] Ensure View-only fields are stripped before saving
    - [ ] **Cleanup:** Delete `Opportunities` logic from `unifiedDataProvider.ts`
- [ ] **Migrate `Sales` Resource**
    - [ ] Create `src/providers/supabase/handlers/salesHandler.ts`
    - [ ] **Critical Fix:** Add `update()` delegation to Edge Function (RLS bypass)
    - [ ] **Cleanup:** Delete `Sales` logic from `unifiedDataProvider.ts`

---

## Phase 5: Final Switch (Post-Migration)
*Goal: Remove the legacy system entirely.*

- [ ] **Switch Feature Flag**
    - [ ] Set `VITE_USE_COMPOSED_PROVIDER = true` in all environments
    - [ ] Run full regression test suite
- [ ] **Delete The Monolith**
    - [ ] Delete `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
    - [ ] Remove `unifiedDataProvider` import from `index.ts`

---

## Phase 6: Architecture Debt (P1)
*Goal: Clean up duplicated code and missing handlers.*

- [ ] **Extract Shared Utilities**
    - [ ] Move `transformQToIlikeSearch` to `commonTransforms.ts` (duplicated in 4 callbacks)
    - [ ] Move `escapeForIlike` usage pattern to shared utility
- [ ] **Create Missing Handlers**
    - [ ] Create `segmentsHandler.ts` — Currently only in unified (uses `segmentsService.getOrCreateSegment()`)
    - [ ] Create `productDistributorsHandler.ts` — Composite key resource needs dedicated handler
- [ ] **Refactor Opportunities Callbacks**
    - [ ] Convert inline callbacks to use factory pattern (like other resources)
    - [ ] Document why opportunities is more complex (products sync, cascade delete)

---

## Phase 7: Type Safety (P2)
*Goal: Eliminate type-unsafe patterns that could cause runtime errors.*

- [ ] **Type-Link Field Strip Lists**
    - [ ] Bind `OPPORTUNITY_FIELDS_TO_STRIP` to `keyof Opportunity | keyof OpportunitySummaryView`
    - [ ] Add compile-time validation for field names
- [ ] **Type-Link Filter Registry**
    - [ ] Bind `filterableFields` to DB column types from `database.generated.ts`
    - [ ] **Security Fix:** Throw on unknown resources instead of allowing all filters
- [ ] **Eliminate Widening Casts**
    - [ ] Replace `as Record<string, unknown>` with Zod `.parse()` at these locations:
        - [ ] unified:620 — Array bounds check missing
        - [ ] unified:789, 828, 934 — processedData loses type info
        - [ ] unified:1024, 1035, 1079 — params.data generic widening
        - [ ] productsHandler:80-81 — Double cast pattern
- [ ] **Add Drift Prevention Tests**
    - [ ] Test: Compare `OPPORTUNITY_FIELDS_TO_STRIP` vs `opportunities_summary` view columns
    - [ ] Test: Compare `filterableFields` vs actual DB columns per resource

---

# 📚 Appendix: Audit Reference Tables

## Table 1: Handler Wrapper Order Issues

*Fix these wrapper order inconsistencies when migrating or patching.*

| Handler | Current Order ⚠️ | Correct Order ✅ | Issue |
|:--------|:-----------------|:-----------------|:------|
| **activitiesHandler** | `base → L → V → E` | `base → V → L → E` | Validates *before* stripping fields |
| **tasksHandler** | `base → L → V → E` | `base → V → L → E` | Validates *before* stripping fields |
| **notesHandler** (3 types) | `base → L → V → E` | `base → V → L → E` | Validates *before* stripping fields |
| **tagsHandler** | `base → L → V → E` | `base → V → L → E` | Validates *before* stripping fields |
| **salesHandler** | `base → L → V → E` | `base → V → L → E` | Validates *before* stripping fields |

**Legend:** V=withValidation, L=withLifecycleCallbacks, E=withErrorLogging

**Why This Matters:**
- Pattern A (correct): `beforeSave` strips computed fields → Zod validates clean data ✅
- Pattern B (current): Zod validates dirty data with extra fields → `beforeSave` strips after ⚠️

---

## Table 2: Unified vs. Composed Logic Gaps

*Ensure these missing features are implemented in new Handlers before switching the feature flag.*

| Resource | Logic Missing in Composed Handlers | Unified Location | Fix Strategy |
|:---------|:-----------------------------------|:-----------------|:-------------|
| **opportunities** | `createWithProducts` (Syncs products on create) | :817-823 | Call `OpportunitiesService` in handler |
| **opportunities** | `updateWithProducts` (Syncs products on update) | :907-916 | Call `OpportunitiesService` in handler |
| **opportunities** | Bulk Delete Cascade (RPC loop) | :1211-1226 | Add `deleteMany` hook or call RPC |
| **products** | Distributor Sync on Update | :932-970 | Call `ProductsService` in handler |
| **products** | Soft Delete via RPC | :1169-1202 | Call `archive_product_soft_delete` RPC |
| **products** | Bulk Soft Delete via RPC | :1236-1254 | Call `soft_delete_products` RPC |
| **sales** | RLS Bypass for Updates | :923-928 | Call Edge Function via `salesService.salesUpdate()` |
| **contacts** | Strip `quickCreate` flag | :788-794 | Add to `contactsCallbacks.beforeSave` |

---

## Table 3: Direct Supabase Call Inventory

*These must be moved from `unifiedDataProvider` to Services.*

| Location | Current Code | Target Service | Method |
|:---------|:-------------|:---------------|:-------|
| unified:658-672 | `supabase.from("product_distributors").select()` | ProductDistributorsService | `getOne(productId, distributorId)` |
| unified:677-694 | `supabase.from("products").select("*, product_distributors()")` | ProductsService | `getOneWithDistributors(id)` |
| unified:834-860 | Product + Distributors INSERT (transaction) | ProductsService | `createWithDistributors(data, ids)` |
| unified:974-994 | `supabase.from("product_distributors").update()` | ProductDistributorsService | `update(productId, distributorId, data)` |
| unified:1103-1114 | `supabase.from("product_distributors").delete()` | ProductDistributorsService | `delete(productId, distributorId)` |
| unified:1175-1184 | `supabase.rpc("soft_delete_product")` | ProductsService | `softDelete(id)` |
| unified:1245-1255 | `supabase.rpc("soft_delete_products")` | ProductsService | `softDeleteMany(ids)` |
| unified:1150-1163 | `supabase.rpc("archive_opportunity_with_relations")` | *(Already exists)* | Use `opportunitiesService.archiveOpportunity()` |

---

## Table 4: Callback Coverage Matrix

*Quick reference for what each resource implements.*

| Resource | beforeDelete | afterRead | beforeGetList | beforeSave | Factory | Custom Logic |
|:---------|:-------------|:----------|:--------------|:-----------|:--------|:-------------|
| contacts | ✅ soft | ✅ JSONB norm | ✅ soft+search | ✅ strip+name | ✅ | q→ILIKE |
| organizations | ✅ soft | ❌ | ✅ soft+search | ✅ strip | ✅ | q→ILIKE+escape |
| opportunities | ✅ RPC cascade | ✅ passthrough | ✅ soft+search | ✅ strip+virtual | ❌ inline | Most complex |
| activities | ✅ soft | ❌ | ✅ soft | ✅ strip | ✅ | None |
| products | ✅ soft | ❌ | ✅ soft | ✅ strip | ✅ | RPC create |
| tasks | ✅ soft | ❌ | ✅ soft | ✅ strip+transforms | ✅ | completion/snooze |
| contact_notes | ✅ soft | ❌ | ✅ soft | ❌ | ✅ | Simplest |
| opportunity_notes | ✅ soft | ❌ | ✅ soft | ❌ | ✅ | None |
| organization_notes | ✅ soft | ❌ | ✅ soft | ❌ | ✅ | None |
| tags | ❌ hard delete | ❌ | ❌ | ❌ | ✅ | No soft delete |
| sales | ✅ soft | ❌ | ✅ soft+search | ✅ strip | ✅ | q→ILIKE |

---

## Quick Reference: Wrapper Composition

**Correct Pattern (for all handlers):**

```
┌─────────────────────────────────────────────────┐
│  withErrorLogging (catches all errors)          │
│    ┌─────────────────────────────────────────┐  │
│    │ withLifecycleCallbacks (strips fields)  │  │
│    │   ┌─────────────────────────────────┐   │  │
│    │   │ withValidation (Zod schemas)    │   │  │
│    │   │   ┌─────────────────────────┐   │   │  │
│    │   │   │ baseProvider (Supabase) │   │   │  │
│    │   │   └─────────────────────────┘   │   │  │
│    │   └─────────────────────────────────┘   │  │
│    └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

Flow: Request → Error handler → Callbacks strip fields → Validation → DB
```

---

## Summary: Migration Completion Criteria

Before setting `VITE_USE_COMPOSED_PROVIDER=true`:

| Blocker | Status | Notes |
|:--------|:-------|:------|
| All 5 handlers have correct wrapper order | ⬜ | Table 1 |
| All 8 logic gaps are implemented | ⬜ | Table 2 |
| All 8 Supabase calls are in services | ⬜ | Table 3 |
| Products: create/update/delete all work | ⬜ | Critical path |
| Opportunities: products sync on create/update | ⬜ | Critical path |
| Sales: updates work (RLS bypass) | ⬜ | Edge Function |

---

*Last Updated: 2025-01-05*
*Source: Handler, Service Layer, and Type Safety Audits*
