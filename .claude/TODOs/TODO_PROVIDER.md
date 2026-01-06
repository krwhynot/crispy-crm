Here is the comprehensive, end-to-end to-do list for fixing the immediate issues in `unifiedDataProvider` and fully cleaning up the provider architecture.

You can save this as `TODO_PROVIDER_FULL.md`.

# 🏗️ Master Plan: Provider Cleanup & Restructuring

### Phase 1: Fix & Stabilize (Immediate)

*Goal: Stop the generic errors and prevent the monolith from getting worse.*

* [ ] **Patch `unifiedDataProvider.ts` Error Handling**
* [ ] Open `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`.
* [ ] Replace the generic `catch` block in `wrapMethod` with the Zod-to-React-Admin mapping code.
* [ ] **Verify:** Submit an empty form (e.g., Opportunities) and confirm you see specific red validation messages.


* [ ] **Enforce Monolith Code Freeze**
* [ ] **Rule:** No new features added to `unifiedDataProvider.ts`.
* [ ] **Rule:** All new resources must start in `src/providers/supabase/handlers/`.



### Phase 2: Low-Risk Migration (During Beta)

*Goal: Move simple resources to the new architecture to prove it works safely.*

* [ ] **Migrate `Tags` Resource**
* [ ] Create `src/providers/supabase/handlers/tagsHandler.ts`.
* [ ] Implement `getList`, `create`, `update`, `delete` (copy logic from monolith).
* [ ] Apply wrappers: `withErrorLogging(withLifecycleCallbacks(withValidation(...)))`.
* [ ] Register in `composedDataProvider.ts`.
* [ ] **Verify:** Test Tag management in the UI.
* [ ] **Cleanup:** Delete `Tags` logic from `unifiedDataProvider.ts`.


* [ ] **Migrate `Notes` Resources**
* [ ] Create `src/providers/supabase/handlers/notesHandler.ts` (use a factory function for reusability).
* [ ] Register handlers for: `contact_notes`, `opportunity_notes`, `organization_notes`.
* [ ] **Verify:** Test adding notes to different entities.
* [ ] **Cleanup:** Delete all Note logic from `unifiedDataProvider.ts`.



### Phase 3: Service Layer Extraction (Pre-Launch)

*Goal: Extract complex business logic so it can be reused by the new handlers.*

* [ ] **Create `ProductsService.ts**`
* [ ] Create `src/atomic-crm/services/ProductsService.ts`.
* [ ] Move the ~6 raw `supabase.from('products')` calls from the monolith into this service.
* [ ] Implement methods: `createWithDistributors`, `getOneWithDistributors`, `softDelete`.


* [ ] **Create `ProductDistributorsService.ts**`
* [ ] Encapsulate the Composite Key logic (handling `product_id` + `distributor_id`).



### Phase 4: High-Risk Migration (Refactor Gate)

*Goal: Migrate the complex "Core" resources once Beta features are stable.*

* [ ] **Migrate `Products` Resource**
* [ ] Create `src/providers/supabase/handlers/productsHandler.ts`.
* [ ] Inject `ProductsService` into the handler.
* [ ] **Verify:** Creating a product correctly saves distributor relationships (using the service).
* [ ] **Cleanup:** Delete `Products` logic from `unifiedDataProvider.ts`.


* [ ] **Migrate `Opportunities` Resource (The Boss)**
* [ ] Create `src/providers/supabase/handlers/opportunitiesHandler.ts`.
* [ ] Inject `OpportunitiesService`.
* [ ] **Critical Fix:** Ensure `create` calls `opportunitiesService.createWithProducts` (fixing the gap in the current unified provider).
* [ ] **Verification:** Ensure View-only fields are stripped before saving.
* [ ] **Cleanup:** Delete `Opportunities` logic from `unifiedDataProvider.ts`.



### Phase 5: Final Switch (Post-Migration)

*Goal: Remove the legacy system entirely.*

* [ ] **Switch Feature Flag**
* [ ] Set `VITE_USE_COMPOSED_PROVIDER = true` in all environments (`.env`, `.env.production`).
* [ ] Run full regression test suite.


* [ ] **Delete The Monolith**
* [ ] Delete `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`.
* [ ] Remove `unifiedDataProvider` import from `index.ts`.