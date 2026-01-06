# 🏗️ Master Plan: Provider Cleanup & Restructuring

**Status:** ✅ PHASE 6 COMPLETE — Architecture Debt Cleaned
**Goal:** Migrate from Monolithic (`unifiedDataProvider`) to Composed (`handlers/`) architecture safely using the Strangler Fig pattern.

> **🎉 Migration Complete (2026-01-06):** The 1090+ LOC `unifiedDataProvider.ts` monolith has been deleted.
> All data access now flows through the composed handler architecture with lifecycle callbacks.
>
> **🧹 Architecture Debt Cleaned (2026-01-06):** Duplicated `transformQToIlikeSearch` extracted to shared factory.
> Opportunities callbacks now use factory pattern with custom overrides for complex behaviors.

---

## Phase 1: Fix & Stabilize (Immediate) ✅ COMPLETE
*Goal: Stop the generic errors and prevent the monolith from getting worse.*

- [x] **Patch `unifiedDataProvider.ts` Error Handling**
    - [x] Open `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
    - [x] Replace the generic `catch` block in `wrapMethod` with the Zod-to-React-Admin mapping code
        - Fixed: Lines 538-543 now use `HttpError` instead of plain object for validation errors
        - Fixed: Lines 562-566 now use `HttpError` instead of `satisfies ValidationError` for Supabase errors
    - [x] **Verify:** Build passes (`just build` - TypeScript compilation + Vite build successful)
- [x] **Enforce Monolith Code Freeze**
    - [x] **Rule:** No new features added to `unifiedDataProvider.ts`
    - [x] **Rule:** All new resources must start in `src/providers/supabase/handlers/`

---

## Phase 2: Low-Risk Migration & Cleanup (During Beta) ✅ COMPLETE
*Goal: Move simple resources to the new architecture AND fix existing handler bugs.*

- [x] **🔧 Repair Existing Handlers (FIRST)**
    - [x] Open `activitiesHandler.ts`, `tasksHandler.ts`, `salesHandler.ts`
    - [x] Fix wrapper order: Changed from `base → L → V → E` to `base → V → L → E`
        - Fixed: `activitiesHandler.ts` line 35
        - Fixed: `tasksHandler.ts` line 37
        - Fixed: `salesHandler.ts` line 36
    - [x] **Verify:** Build passes (`just build`)
    - [x] **Why now:** These handlers were conceptually broken — now fixed
- [x] **Migrate `Tags` Resource**
    - [x] Handler already exists: `src/atomic-crm/providers/supabase/handlers/tagsHandler.ts`
    - [x] Already registered in `composedDataProvider.ts` (line 110)
    - [x] **Fix wrapper order:** Fixed line 35 to use correct order `base → V → L → E`
    - [x] **Cleanup:** No Tags-specific logic in `unifiedDataProvider.ts` (already clean)
- [x] **Migrate `Notes` Resources**
    - [x] Handler already exists: `src/atomic-crm/providers/supabase/handlers/notesHandler.ts`
    - [x] All 3 types registered in `composedDataProvider.ts` (lines 106-108)
    - [x] **Fix wrapper order:** Fixed all 3 factory functions (lines 35, 53, 71)
    - [x] **Cleanup:** No Notes-specific logic in `unifiedDataProvider.ts` (already clean)

---

## Phase 3: Service Layer Extraction (Pre-Launch) ✅ COMPLETE
*Goal: Extract complex business logic so it can be reused by the new handlers.*

- [x] **Create `ProductsService.ts`**
    - [x] Create `src/atomic-crm/services/products.service.ts`
    - [x] Move these methods (delegating to DataProvider, ready for handler injection):
        - [x] `getOneWithDistributors(id)` — Fetches product with distributor relationships
        - [x] `createWithDistributors(data, distributors)` — Atomic create + junction records
        - [x] `updateWithDistributors(id, data, distributors)` — Update + sync (delete+insert pattern)
        - [x] `softDelete(id)` — RPC call to `soft_delete_product`
        - [x] `softDeleteMany(ids)` — RPC call to `soft_delete_products`
- [x] **Create `ProductDistributorsService.ts`**
    - [x] Create `src/atomic-crm/services/productDistributors.service.ts`
    - [x] Encapsulate Composite Key logic (`product_id` + `distributor_id`):
        - [x] `parseCompositeId(id)` / `createCompositeId(productId, distributorId)` — Helpers
        - [x] `getOne(productId, distributorId)` — Fetch by composite key
        - [x] `update(productId, distributorId, data)` — Update junction record
        - [x] `delete(productId, distributorId)` — Hard delete (not soft delete)
        - [x] `create(productId, distributorId, data)` — Create junction record
        - [x] `getDistributorsForProduct(productId)` — List all distributors for product
- [x] **🧪 Test ProductsService**
    - [x] Create `src/atomic-crm/services/__tests__/ProductsService.test.ts` (28 tests)
    - [x] Test `createWithDistributors` (verify transaction logic — product + junction inserts)
    - [x] Test `updateWithDistributors` (verify delete+insert sync pattern)
    - [x] Test `softDelete` (verify RPC call with correct `product_id` parameter)
    - [x] Test `softDeleteMany` (verify RPC call with `product_ids` array)
    - [x] Test `getOneWithDistributors` (verify distributor_ids returned)
    - [x] Test ID validation (reject invalid, zero, negative IDs)
    - [x] **Verified:** All 28 tests pass (`npm test`)

---

## Phase 4: High-Risk Migration (Refactor Gate) ✅ COMPLETE
*Goal: Migrate the complex "Core" resources once Beta features are stable.*

- [x] **🚨 Create Missing Handlers (BLOCKERS for Phase 5)**
    - [x] Create `segmentsHandler.ts`
        - [x] Port logic from unified (delegating to `segmentsService.getOrCreateSegment()`)
        - [x] Intercepts `create`, `getOne`, `getList`, `getMany` for segments resource
        - [x] **Why blocker:** Without this, Playbooks will break when flag is flipped
    - [x] Create `productDistributorsHandler.ts`
        - [x] Inject `ProductDistributorsService`
        - [x] Handle composite key (`product_id` + `distributor_id`)
        - [x] Intercepts `getOne`, `update`, `delete`, `create`, `getList`
        - [x] **Why blocker:** Composed provider falls back to raw Supabase without this
- [x] **Migrate `Products` Resource**
    - [x] Handler already exists: `src/atomic-crm/providers/supabase/handlers/productsHandler.ts`
    - [x] Inject `ProductsService` into the handler
    - [x] Add `update()` interception (mirrors the existing `create()` pattern)
    - [x] Add `delete()` and `deleteMany()` via `ProductsService.softDelete()` RPC
    - [x] **Verify:** Build passes (`just build`)
    - [ ] **Cleanup:** Delete `Products` logic from `unifiedDataProvider.ts` *(deferred to Phase 5)*
- [x] **Migrate `Opportunities` Resource (The Boss)**
    - [x] Handler already exists: `src/atomic-crm/providers/supabase/handlers/opportunitiesHandler.ts`
    - [x] Inject `OpportunitiesService`
    - [x] **Critical Fix:** Add `create()` interception calling `opportunitiesService.createWithProducts`
    - [x] **Critical Fix:** Add `update()` interception calling `opportunitiesService.updateWithProducts`
    - [x] Ensure View-only fields are stripped before saving (via `opportunitiesCallbacks.beforeSave`)
    - [x] **Type Safety:** Split `COMPUTED_FIELDS` into `TYPED_COMPUTED_FIELDS` (satisfies `keyof Opportunity`) and `VIEW_ONLY_FIELDS`
        - [x] Compiler now errors if field name doesn't match `Opportunity` type
    - [ ] **🧪 Create `opportunitiesHandler.test.ts`** *(deferred to Phase 5 test hardening)*
    - [ ] **Cleanup:** Delete `Opportunities` logic from `unifiedDataProvider.ts` *(deferred to Phase 5)*
- [x] **Refactor `Sales` Resource**
    - [x] Update existing `src/atomic-crm/providers/supabase/handlers/salesHandler.ts`
    - [x] **Critical Fix:** Add `update()` delegation to `SalesService.salesUpdate()` (RLS bypass)
    - [ ] **Cleanup:** Delete `Sales` logic from `unifiedDataProvider.ts` *(deferred to Phase 5)*
    - [x] *(Note: Handler exists — wrapper order fixed in Phase 2)*

**Phase 4 Summary (2026-01-06):**
- ✅ Created `segmentsHandler.ts` - fixed Playbook categories
- ✅ Created `productDistributorsHandler.ts` - composite key support
- ✅ Enhanced `productsHandler.ts` with update/delete via ProductsService
- ✅ Enhanced `opportunitiesHandler.ts` with create/update via OpportunitiesService
- ✅ Enhanced `salesHandler.ts` with update via SalesService (RLS bypass)
- ✅ Made `COMPUTED_FIELDS` type-safe with `satisfies keyof Opportunity`
- ✅ Registered new handlers in `composedDataProvider.ts`
- ✅ Build passes (`just build`)
- ✅ ProductsService tests pass (28/28)
- ⚠️ Legacy cleanup deferred to Phase 5 (Strangler Fig pattern)

---

## Phase 5: Final Switch (Post-Migration) ✅ COMPLETE
*Goal: Remove the legacy system entirely.*

- [x] **🧪 Run Full Regression Test Suite**
    - [x] Set `VITE_USE_COMPOSED_PROVIDER = true` in test environment (already enabled)
    - [x] Run `npm test` — provider tests pass (494/499, 5 pre-existing failures in filterRegistry/authProvider)
    - [x] Verify `composedDataProvider` passes standard React Admin data provider contract:
        - [x] `getList` returns `{ data, total }`
        - [x] `getOne` returns `{ data }`
        - [x] `create` returns `{ data }` with generated `id`
        - [x] `update` returns `{ data }`
        - [x] `delete` returns `{ data }`
    - [ ] **Manual smoke test:** Create → Edit → Delete an Opportunity with products *(deferred to QA)*
- [x] **Switch Feature Flag (Production)**
    - [x] `VITE_USE_COMPOSED_PROVIDER = true` already set in `.env`
    - [x] Feature flag logic removed from `index.ts` — composed provider is now the only path
- [x] **Delete The Monolith**
    - [x] Deleted `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (1090+ LOC)
    - [x] Removed `unifiedDataProvider` import from `index.ts`
    - [x] Deleted obsolete test files:
        - [x] `unifiedDataProvider.test.ts`
        - [x] `unifiedDataProvider.errors.test.ts`
        - [x] `unifiedDataProvider.arrayFilter.test.ts`
        - [x] `services.integration.test.ts`
    - [x] Updated test files with broken imports:
        - [x] `userManagement.test.ts` — rewrote to test implementations directly
        - [x] `deleteOpportunityCascade.test.ts` — rewrote to test callbacks directly
    - [x] Created `opportunitiesHandler.test.ts` with service delegation + view field stripping tests
    - [x] Run `npm test` — 494 provider tests pass (5 pre-existing unrelated failures)

**Phase 5 Summary (2026-01-06):**
- ✅ Deleted 1090+ LOC monolith (`unifiedDataProvider.ts`)
- ✅ Removed feature flag logic — composed provider is permanent
- ✅ Cleaned up 4 obsolete test files
- ✅ Created opportunitiesHandler.test.ts (16 tests)
- ✅ Updated userManagement.test.ts (7 tests)
- ✅ Updated deleteOpportunityCascade.test.ts (9 tests)
- ✅ Provider test suite: 494 passing, 5 pre-existing failures (filterRegistry/authProvider)

---

## Phase 6: Architecture Debt (P1 — Post-Switch Cleanup) ✅ COMPLETE
*Goal: Clean up duplicated code after the migration is complete.*

- [x] **Extract Shared Utilities**
    - [x] Move `transformQToIlikeSearch` to `commonTransforms.ts` (duplicated in 4 callbacks)
        - Created `createQToIlikeTransformer` factory function with two modes:
        - Standard mode: Uses React Admin `@or` filter syntax (contacts, opportunities, sales)
        - Raw PostgREST mode: Uses `or@` with escaping for multi-word searches (organizations)
    - [x] Move `escapeForIlike` usage pattern to shared utility
        - Already existed in `dataProviderUtils.ts`, now imported by `commonTransforms.ts`
- [x] **Refactor Opportunities Callbacks**
    - [x] Convert inline callbacks to use factory pattern (like other resources)
        - Now uses `createResourceCallbacks` with custom overrides for complex behaviors
    - [x] Document why opportunities is more complex (products sync, cascade delete)
        - Added comprehensive module header explaining:
        - CASCADE DELETE: Uses `archive_opportunity_with_relations` RPC for atomic archiving
        - PRODUCTS SYNC: Virtual `products_to_sync` field handled by OpportunitiesService
        - STAGE-ONLY UPDATES: Kanban drag-drop needs special handling for empty contact_ids

**Phase 6 Summary (2026-01-06):**
- ✅ Created `createQToIlikeTransformer` factory in `commonTransforms.ts`
- ✅ Refactored all 4 callback files to use the shared factory
- ✅ `opportunitiesCallbacks` now uses factory + custom overrides pattern
- ✅ All 104 callback tests pass
- ✅ TypeScript build passes

> **Note:** "Create Missing Handlers" moved to Phase 4 — they're blockers, not cleanup.

---

## Phase 7: Type Safety (P2 — Hardening)
*Goal: Eliminate remaining type-unsafe patterns.*

> **Note:** `OPPORTUNITY_FIELDS_TO_STRIP` type safety moved to Phase 4 (Opportunities migration).

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

## Table 1: Handler Wrapper Order Issues ✅ ALL FIXED

*All handler wrapper order inconsistencies have been fixed (2026-01-05).*

| Handler | Status | Order | Notes |
|:--------|:-------|:------|:------|
| **activitiesHandler** | ✅ Fixed | `base → V → L → E` | Line 35 |
| **tasksHandler** | ✅ Fixed | `base → V → L → E` | Line 37 |
| **notesHandler** (3 types) | ✅ Fixed | `base → V → L → E` | Lines 35, 53, 71 |
| **tagsHandler** | ✅ Fixed | `base → V → L → E` | Line 35 |
| **salesHandler** | ✅ Fixed | `base → V → L → E` | Line 36 |

**Legend:** V=withValidation, L=withLifecycleCallbacks, E=withErrorLogging

**Correct Pattern (now implemented):**
- `beforeSave` strips computed fields → Zod validates clean data ✅

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
| All 8 handlers have correct wrapper order | ✅ | Phase 2 — Fixed activities, tasks, sales, tags, notes (3 types) |
| `segmentsHandler` created | ✅ | Phase 4 — Delegates to SegmentsService |
| `productDistributorsHandler` created | ✅ | Phase 4 — Composite key handling |
| All 8 logic gaps are implemented | ✅ | Phase 4 — All handlers now intercept create/update/delete |
| All 8 Supabase calls are in services | ✅ | Phase 3+4 — ProductsService, ProductDistributorsService, OpportunitiesService, SalesService |
| Products: create/update/delete all work | ✅ | Phase 4 — Handler intercepts via ProductsService |
| **🧪 ProductsService tests pass** | ✅ | Phase 3 — 28 tests pass |
| Opportunities: products sync on create/update | ✅ | Phase 4 — Handler intercepts via OpportunitiesService |
| Opportunities: `FIELDS_TO_STRIP` type-safe | ✅ | Phase 4 — `TYPED_COMPUTED_FIELDS satisfies keyof Opportunity` |
| **🧪 opportunitiesHandler tests pass** | ✅ | Phase 5 — 16 tests (service delegation + view stripping) |
| Sales: updates work (RLS bypass) | ✅ | Phase 4 — Handler intercepts via SalesService |
| **🧪 `npm test` passes with flag enabled** | ✅ | Phase 5 — 494/499 (5 pre-existing unrelated failures) |
| **🗑️ Monolith deleted** | ✅ | Phase 5 — `unifiedDataProvider.ts` removed |
| **🧹 Obsolete tests cleaned up** | ✅ | Phase 5 — 4 test files deleted, 2 rewritten |

---

*Last Updated: 2026-01-06*
*Phase 5 Completed: 2026-01-06 — Monolith deleted, composed provider is permanent*
*Source: Handler, Service Layer, and Type Safety Audits*
*Sequencing Fix: Phase 4 blockers identified via code review*
