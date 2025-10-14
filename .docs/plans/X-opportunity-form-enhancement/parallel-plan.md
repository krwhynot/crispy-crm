# Opportunity Form Enhancement - Parallel Implementation Plan (SIMPLIFIED)

**STATUS: Pre-production with test data - No legacy support needed**

This feature adds multi-product line items with principal-filtered selection, auto-generated opportunity naming, and structured context categorization. The implementation is decomposed into 8 independent parallel tasks across 5 phases, with clear dependencies between phases but maximum parallelism within each phase.

**KEY SIMPLIFICATION:** Since this is pre-production with only test data, we removed all legacy value handling. The `opportunity_context` field uses a clean 7-value classification system with no backward compatibility concerns.

The critical path runs through database migration → test data cleanup → RPC function creation → data provider updates → form component integration, with validation, utilities, and display components executing in parallel wherever possible.

## Critically Relevant Files and Documentation

### Core Files to Review First
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx` - Current form structure, stage-specific pattern
- `/src/atomic-crm/validation/opportunities.ts` - Current validation schema with enum patterns
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Data flow, RPC support
- `/src/atomic-crm/types.ts` - Opportunity interface (needs product array addition)
- `/supabase/migrations/` - Migration patterns and naming conventions

### Documentation (Read Before Starting)
- `.docs/plans/opportunity-form-enhancement/requirements.md` - Complete feature specification
- `.docs/plans/opportunity-form-enhancement/shared.md` - Architecture patterns and integration points
- `.docs/plans/opportunity-form-enhancement/database.docs.md` - Database patterns, RPC examples
- `.docs/plans/opportunity-form-enhancement/validation-docs.md` - Zod schema patterns
- `.docs/plans/opportunity-form-enhancement/form-patterns.docs.md` - useFieldArray, useWatch patterns
- `.docs/plans/opportunity-form-enhancement/data-provider.docs.md` - Provider integration flow

---

## Implementation Plan

### Phase 0: Pre-Flight Checks - COMPLETED ✅

#### Task 0.1: Database Dependency Audit [COMPLETED]
- Checked for views/triggers/functions referencing old column names
- Found: 3 breaking objects (opportunities_summary view, 2 functions)
- Result: All dependencies fixed in migration

#### Task 0.2: Product Filter Verification [COMPLETED]
- Verified `principal_id` column exists with proper indexes
- Result: Product filtering will work efficiently

### Phase 1: Foundation (Database & Schema) - COMPLETED ✅

#### Task 1.1: Database Migration & RPC Function [COMPLETED]

**Files Created:**
- `/supabase/migrations/20250930000000_add_opportunity_context_and_owner.sql`

**Executed Steps:**
1. ✅ Dropped `opportunities_summary` view (recreated later with new column names)
2. ✅ Updated `create_opportunity_with_participants()` function to use `opportunity_owner_id`
3. ✅ Updated `update_search_tsv()` trigger to use `opportunity_context`
4. ✅ **Column renames:** `category` → `opportunity_context`, `sales_id` → `opportunity_owner_id` (data preserved)
5. ✅ Added column comments (NO CHECK constraint - validation at API boundary per Engineering Constitution)
6. ✅ Set default for `estimated_close_date` to `(CURRENT_DATE + INTERVAL '90 days')`
7. ✅ Dropped old index `idx_opportunities_sales_id`, created new `idx_opportunities_owner_id WHERE deleted_at IS NULL`
8. ✅ Recreated `opportunities_summary` view with new column names
9. ✅ Created RPC function `sync_opportunity_with_products` for atomic opportunity + products operations
10. ✅ Verified all changes in database

**Tables:**
- opportunities (columns renamed, indexes updated, default added)
- opportunity_products (no schema changes, used by RPC)

**Key Decisions:**
- **NO CHECK constraint** - Validation enforced at API boundary only (Zod schemas)
- Follows Engineering Constitution principle #5: "VALIDATION: Zod schemas at API boundary only"

#### Task 1.2b: Test Data Cleanup [COMPLETED]

**Executed:**
```sql
UPDATE opportunities
SET opportunity_context = NULL
WHERE opportunity_context IN ('new_business', 'upsell');
```

**Result:** 13 test records cleaned, ready for new classification system

---

### Phase 2: Backend Layer - PARALLEL (3 tasks)

#### Task 2.1: Validation Schema Updates - SIMPLIFIED [Depends on: 1.1, 1.2]

**READ THESE BEFORE TASK**
- `.docs/plans/opportunity-form-enhancement/validation-docs.md` (entire file)
- `.docs/plans/opportunity-form-enhancement/requirements.md` (lines 211-271)
- `/src/atomic-crm/validation/opportunities.ts` (review existing patterns)

**Instructions**

Files to Modify:
- `/src/atomic-crm/validation/opportunities.ts`

Files to Create:
- `/src/atomic-crm/validation/products.ts` (if doesn't exist)

**Changes - SIMPLIFIED (No Legacy Support):**

1. **Add clean `opportunityContextSchema`** - 7 values only, no union types:
   ```typescript
   export const opportunityContextSchema = z.enum([
     "Site Visit",
     "Food Show",
     "New Product Interest",
     "Follow-up",
     "Demo Request",
     "Sampling",
     "Custom"
   ]);
   ```

2. **Update `opportunitySchema`**:
   - Rename: `category` → `opportunity_context` (use new schema)
   - Rename: `sales_id` → `opportunity_owner_id`
   - ⚠️ **IMPORTANT:** Add `products` field (NOT `products_to_sync`)
     - Reason: Validation runs BEFORE transform (see CORRECTIONS.md Issue 0.4)
     - Transform service will rename `products` → `products_to_sync` AFTER validation

3. **Keep existing stage-specific validation** in `superRefine` unchanged

4. **Create `opportunityProductSchema`** in products.ts - ⚠️ **UPDATED (CORRECTIONS.md Issue 0.2)**:
   ```typescript
   export const opportunityProductSchema = z.object({
     id: z.union([z.string(), z.number()]).optional(),
     product_id_reference: z.coerce.number().int().positive("Product is required"), // ✅ Use z.coerce for BIGINT
     product_name: z.string().min(1, "Product name is required"),
     product_category: z.string().optional(),
     quantity: z.coerce.number().int().positive().optional(),
     unit_price: z.coerce.number().nonnegative().optional(),
     discount_percent: z.coerce.number().min(0).max(100).optional(),
     notes: z.string().optional(),
     // extended_price and final_price are GENERATED columns - omit from validation
   });
   ```
   - Export validation function `validateOpportunityProduct`

5. **Ensure error format** remains React Admin compatible: `{ message, errors: { field: "message" } }`

**Tables:** None (validation layer only)

**Gotchas:**
- No legacy value handling needed - clean enum only
- Use `.optional()` for nullable fields, not `.nullable().optional()`
- Export enum schemas separately for reuse in components
- ✅ **CRITICAL:** Validate `products` (form field name), NOT `products_to_sync`
- ✅ **Use `z.coerce.number()`** for all BIGINT foreign keys (handles string and number inputs)

---

#### Task 2.2: Product Diff Algorithm & Unit Tests [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `.docs/plans/opportunity-form-enhancement/requirements.md` (lines 273-331)
- `.docs/plans/opportunity-form-enhancement/shared.md` (Product Diffing Algorithm pattern)

**Instructions**

Files to Create:
- `/src/atomic-crm/opportunities/diffProducts.ts`
- `/src/atomic-crm/opportunities/diffProducts.test.ts`

**Implementation:**
1. Create `Product` interface with fields: id?, product_id_reference, product_name, quantity?, unit_price?, extended_price?, notes?
2. Implement `productsAreDifferent()` - compare ONLY editable fields (product_id_reference, quantity, unit_price, notes) - DO NOT use JSON.stringify
3. Implement `diffProducts(dbItems, formItems)` returning `{ creates, updates, deletes }`
   - Creates: products without IDs
   - Updates: products with IDs that have changed (use Map for O(1) lookup)
   - Deletes: IDs present in DB but not in form
4. Write 6 unit tests: all creates, updates only, deletes only, mixed operations, unchanged products, empty arrays
5. Run tests with `npm run test -- diffProducts.test.ts`

**Tables:** opportunity_products (logic only, no database operations)

**Gotchas:**
- Use Map data structure for efficient lookups, not array.find()
- Deletes should return array of IDs only, not full objects
- Handle edge case: empty product arrays
- Field-by-field comparison critical - JSON.stringify fails on key order/types

---

#### Task 2.3: Type Definitions Update - SIMPLIFIED [Depends on: 1.1, 1.2]

**READ THESE BEFORE TASK**
- `.docs/plans/opportunity-form-enhancement/requirements.md` (lines 929-968)
- `/src/atomic-crm/types.ts` (review existing Opportunity interface)

**Instructions**

Files to Modify:
- `/src/atomic-crm/types.ts`

**Changes - SIMPLIFIED (Clean Types Only):**

1. **Add `OpportunityContext` type** - Clean 7-value type (no union, no legacy):
   ```typescript
   export type OpportunityContext =
     | "Site Visit"
     | "Food Show"
     | "New Product Interest"
     | "Follow-up"
     | "Demo Request"
     | "Sampling"
     | "Custom";
   ```

2. **Add `OpportunityProduct` interface**:
   - Fields: `id?`, `opportunity_id?`, `product_id_reference`, `product_name`, `product_category?`, `quantity?`, `unit_price?`, `extended_price?`, `discount_percent?`, `final_price?`, `notes?`

3. **Update `Opportunity` interface**:
   - Rename: `category` → `opportunity_context?: OpportunityContext`
   - Rename: `sales_id` → `opportunity_owner_id?: Identifier`
   - Add: `products?: OpportunityProduct[]`

4. **Verify existing `OpportunityStageValue`** type matches stageConstants.ts (8 stages)

**Tables:** None (TypeScript types only)

**Gotchas:**
- Use new `OpportunityContext` type (not `string`) for type safety
- Note existing inconsistency between types.ts stages and stageConstants.ts - document but don't fix in this task
- Make products optional since not all opportunities have products yet
- Use `Identifier` type for IDs (supports string | number)

---

### Phase 3: Data Provider Integration - SEQUENTIAL

#### Task 3.1: Data Provider Updates for Products [Depends on: 2.1, 2.2, 2.3]

**READ THESE BEFORE TASK**
- `.docs/plans/opportunity-form-enhancement/data-provider.docs.md` (entire file)
- `.docs/plans/opportunity-form-enhancement/requirements.md` (lines 333-449)
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (review getOne, getList, create, update patterns)

**Instructions**

Files to Modify:
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

Files to Import:
- Import `diffProducts` from `@/atomic-crm/opportunities/diffProducts`

**Changes - ⚠️ UPDATED (CORRECTIONS.md Issues 0.1, 0.4, 0.6):**

0. **processForDatabase** - ⚠️ **CRITICAL FIX (Issue 0.4)**:
   - Swap order: Validate FIRST, Transform SECOND
   - Allows validation of `products`, then transform renames to `products_to_sync`

1. **getOne** - Update opportunities case with ⚠️ **JSON PARSING SAFETY (Issue 0.6)**:
   - Query: `.select('*, opportunity_products(*, products(*))')`
   - Parse products with try/catch:
     ```typescript
     try {
       if (Array.isArray(result.data.products)) return result.data.products;
       return JSON.parse(result.data.products || '[]');
     } catch (e) {
       console.error('Failed to parse products JSON:', result.data.products, e);
       throw new Error("Could not load product data. The record may be corrupted.");
     }
     ```

2. **getList** - Update opportunities case:
   - Query: `.select('*, opportunity_products(product_name, product_id_reference)')`
   - Map each opportunity: `products: opp.opportunity_products || []`

3. **create** - Add opportunities with products case:
   - Check for `params.data.products_to_sync`
   - Extract products, call `supabase.rpc('sync_opportunity_with_products')` with all creates, empty updates/deletes
   - Handle RPC errors with try/catch JSON.parse for structured errors

4. **update** - Add opportunities with products case with ⚠️ **NULL CHECK (Issue 0.1)**:
   - Extract `products_to_sync` from data
   - ✅ **CRITICAL:** Check `params.previousData?.products` exists:
     ```typescript
     if (products_to_sync && !params.previousData?.products) {
       throw new Error(
         "Cannot update products: previousData.products is missing. " +
         "Ensure the form fetches the complete record with meta.select."
       );
     }
     ```
   - Get `originalProducts` from `params.previousData.products`
   - Call `diffProducts(originalProducts, products_to_sync)`
   - Call RPC with diff results

**Tables:** opportunities, opportunity_products (via RPC)

**Gotchas:**
- ✅ **Use `wrapMethod` pattern for all operations (error logging)**
- ✅ **RPC errors may be JSON strings - parse to get structured format**
- ✅ **getList must avoid N+1 queries - include products in JOIN**
- ✅ **CRITICAL: Throw error if previousData.products missing (prevents data loss)**
- ✅ **CRITICAL: Wrap JSON.parse in try/catch, throw on failure (don't silently fallback)**
- ✅ **Import HttpError from react-admin if not already imported**

---

### Phase 4: Frontend Components - PARALLEL (4 tasks)

#### Task 4.1: Product Line Items Input Component - ⚠️ UPDATED (CORRECTIONS.md Issue 0.3) [Depends on: 3.1]

**READ THESE BEFORE TASK**
- `.docs/plans/opportunity-form-enhancement/form-patterns.docs.md` (ArrayInput section)
- `.docs/plans/opportunity-form-enhancement/requirements.md` (lines 453-531)
- `/src/components/admin/array-input.tsx` (React Admin ArrayInput wrapper)
- `/src/atomic-crm/contacts/ContactInputs.tsx` (lines 108-134, array input example)

**Instructions**

Files to Create:
- `/src/atomic-crm/opportunities/OpportunityProductsInput.tsx`

**Implementation - ⚠️ USE ArrayInput Pattern (NOT raw useFieldArray):**

1. **Import Components:**
   ```typescript
   import { ArrayInput } from "@/components/admin/array-input";
   import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
   import { ReferenceInput } from "@/components/admin/reference-input";
   import { NumberInput } from "@/components/admin/number-input";
   import { TextInput } from "@/components/admin/text-input";
   import { SelectInput } from "@/components/admin/select-input";
   import { useWatch } from "react-hook-form";
   ```

2. **Watch principal for filtering:**
   ```typescript
   const principalId = useWatch({ name: "principal_organization_id" });
   ```

3. **Use ArrayInput + SimpleFormIterator (CORRECT PATTERN):**
   ```tsx
   <ArrayInput source="products" label={false}>
     <SimpleFormIterator inline disableReordering>
       {/* inline prop creates table-like horizontal layout */}
       <ReferenceInput
         source="product_id_reference"
         reference="products"
         filter={{ principal_id: principalId }}
         disabled={!principalId}
       >
         <SelectInput optionText="name" />
       </ReferenceInput>

       <NumberInput source="quantity" defaultValue={1} />
       <NumberInput source="unit_price" />
       <SelectInput source="unit_of_measure" choices={UNIT_CHOICES} />
       <NumberInput source="discount_percent" min={0} max={100} />
       <NumberInput source="extended_price" disabled /> {/* Calculated field */}
       <TextInput source="notes" multiline />
     </SimpleFormIterator>
   </ArrayInput>
   ```

4. **Helper message if no principal:**
   ```tsx
   {!principalId && (
     <p className="text-sm text-muted-foreground">
       Select a principal organization to add products
     </p>
   )}
   ```

**Tables:** products (via ReferenceInput filter)

**Gotchas - ⚠️ UPDATED:**
- ✅ **Use ArrayInput + SimpleFormIterator (NOT raw useFieldArray)**
- ✅ **`inline` prop creates table-like layout (validated by Gemini Pro)**
- ✅ **Product filter uses `principal_id` (NOT `principal_organization_id`)**
- ✅ **extended_price is GENERATED column - display only, disabled**
- ✅ **SimpleFormIterator handles add/remove automatically**
- ✅ **No manual field.id management needed**

---

#### Task 4.2: Auto-Generate Name Hook & Context Input - SIMPLIFIED [Depends on: 3.1]

**READ THESE BEFORE TASK**
- `.docs/plans/opportunity-form-enhancement/form-patterns.docs.md` (useWatch, useFormContext patterns)
- `.docs/plans/opportunity-form-enhancement/requirements.md` (lines 533-629)

**Instructions**

Files to Create:
- `/src/atomic-crm/opportunities/useAutoGenerateName.ts`
- `/src/atomic-crm/opportunities/OpportunityContextInput.tsx`

**useAutoGenerateName Implementation - ⚠️ UPDATED (CORRECTIONS.md Issue 0.7):**

1. Accept `mode: 'create' | 'edit'` parameter

2. **Watch IDs (primitives), NOT objects:**
   ```typescript
   const customerId = useWatch({ name: 'customer_organization_id' });
   const principalId = useWatch({ name: 'principal_organization_id' });
   const context = useWatch({ name: 'opportunity_context' });
   ```

3. Use useGetOne to fetch org names:
   ```typescript
   const { data: customer, isLoading: customerLoading } = useGetOne(
     'organizations',
     { id: customerId },
     { enabled: !!customerId }
   );
   const { data: principal, isLoading: principalLoading } = useGetOne(
     'organizations',
     { id: principalId },
     { enabled: !!principalId }
   );
   ```

4. **useEffect with correct dependencies:**
   ```typescript
   useEffect(() => {
     if (mode === 'create' && customer && principal && !customerLoading && !principalLoading) {
       const currentName = getValues('name');
       if (!currentName || currentName.trim() === '') {
         const parts = [
           customer.name,
           principal.name,
           context,
           new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
         ].filter(Boolean);

         setValue('name', parts.join(' - '), {
           shouldValidate: true,  // ✅ Allow validation (not false!)
           shouldDirty: true
         });
       }
     }
   }, [mode, customer, principal, context, customerLoading, principalLoading, setValue, getValues]);
   ```

5. Return `{ regenerate, isLoading }` for manual trigger in edit mode

**Key Fixes:**
- ✅ Watch IDs (primitives), not objects (prevents infinite loops)
- ✅ Use `shouldValidate: true` (not false)
- ✅ Check loading states before generating
- ✅ Include all dependencies in array

**OpportunityContextInput Implementation - SIMPLIFIED (7 Values Only):**
1. **Simple SelectInput** with 7 choices (no legacy values, no migration logic):
   ```typescript
   const OPPORTUNITY_CONTEXT_CHOICES = [
     { id: 'Site Visit', name: 'Site Visit' },
     { id: 'Food Show', name: 'Food Show' },
     { id: 'New Product Interest', name: 'New Product Interest' },
     { id: 'Follow-up', name: 'Follow-up' },
     { id: 'Demo Request', name: 'Demo Request' },
     { id: 'Sampling', name: 'Sampling' },
     { id: 'Custom', name: 'Custom' }
   ];
   ```
2. source="opportunity_context", label="Opportunity Context"
3. Export OPPORTUNITY_CONTEXT_CHOICES constant for reuse

**Tables:** organizations (via useGetOne)

**Gotchas:**
- No legacy value handling - clean 7-value dropdown only
- Auto-generation should NOT overwrite existing names in edit mode
- Name parts should be filtered with `.filter(Boolean)` to skip empty values
- Loading states should prevent premature name generation
- Date formatting: use toLocaleDateString with options for consistency

---

#### Task 4.3: Form Component Updates (Create, Edit, Inputs) [Depends on: 4.1, 4.2]

**READ THESE BEFORE TASK**
- `.docs/plans/opportunity-form-enhancement/opportunities-architecture.docs.md` (OpportunityCreate, OpportunityEdit sections)
- `.docs/plans/opportunity-form-enhancement/requirements.md` (lines 631-825)
- `/src/atomic-crm/opportunities/OpportunityCreate.tsx` (current implementation)
- `/src/atomic-crm/opportunities/OpportunityEdit.tsx` (current implementation)
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx` (current structure)

**Instructions**

Files to Modify:
- `/src/atomic-crm/opportunities/OpportunityCreate.tsx`
- `/src/atomic-crm/opportunities/OpportunityEdit.tsx`
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx`

**OpportunityCreate Changes:**
1. Add `transform` prop to extract products: `{ products, ...opportunityData } => { ...opportunityData, products_to_sync: products || [] }`
2. Update defaultValues: add `products: []`, change `sales_id` → `opportunity_owner_id`, add 90-day estimated_close_date
3. Add `mutationMode: 'pessimistic'` to Create component (no optimistic updates)
4. Pass `mode="create"` to OpportunityInputs

**OpportunityEdit Changes:**
1. Add same transform prop as create
2. Create OpportunityEditForm wrapper component
3. Get record via useRecordContext, add products to defaultValues: `products: record.products || []`
4. Add `mutationMode: 'pessimistic'` and onSuccess with queryClient.invalidateQueries(['opportunities'])
5. Pass `mode="edit"` to OpportunityInputs

**OpportunityInputs Changes:**
1. Accept `mode` prop: `{ mode }: { mode: 'create' | 'edit' }`
2. Import and use OpportunityProductsInput, OpportunityContextInput, useAutoGenerateName
3. Replace category SelectInput with OpportunityContextInput
4. Add regenerate button to name field (edit mode only) - use InputProps.endAdornment with AutorenewIcon
5. Update label: "Opportunity Owner" (was "Deal Owner" or "Sales Rep")
6. Add OpportunityProductsInput after existing sections
7. Rename source `sales_id` → `opportunity_owner_id` in ReferenceInput

**Tables:** None (form components only)

**Gotchas:**
- Transform runs before validation - products must be extracted to separate field
- Pessimistic mode prevents UI updates until server confirms
- Cache invalidation critical in edit onSuccess - prevents stale data
- Regenerate button should only show in edit mode, not create
- Import AutorenewIcon from @mui/icons-material

---

#### Task 4.4: Display Component Updates (Card, Show) [Depends on: 3.1]

**READ THESE BEFORE TASK**
- `.docs/plans/opportunity-form-enhancement/requirements.md` (lines 827-906)
- `/src/atomic-crm/opportunities/OpportunityCard.tsx` (current implementation)
- `/src/atomic-crm/opportunities/OpportunityShow.tsx` (current implementation)

**Instructions**

Files to Modify:
- `/src/atomic-crm/opportunities/OpportunityCard.tsx`
- `/src/atomic-crm/opportunities/OpportunityShow.tsx`

**OpportunityCard Changes:**
1. Add product display logic: get productCount and firstProduct from opportunity.products array
2. Format display: single product shows name, multiple shows "ProductName +N more"
3. Add products display below principal badge: `<p className="text-xs text-muted-foreground">Products: {productDisplay}</p>`
4. Conditional rendering: only show if products exist

**OpportunityShow Changes:**
1. Update field labels: "Opportunity Name", "Opportunity Context", "Opportunity Owner"
2. Rename source `sales_id` → `opportunity_owner_id` in ReferenceField
3. Add ArrayField for products with Datagrid:
   - Columns: product_name (Product), quantity, unit_price (Unit Price), extended_price (Extended Price), notes
   - bulkActionButtons={false}
   - Label: "Product Line Items"

**Tables:** None (display only)

**Gotchas:**
- Product display should gracefully handle undefined/null products array
- Use optional chaining: `opportunity.products?.length`
- Show view products should use NumberField for numeric columns
- Keep existing layout structure, just add products section

---

### Phase 5: Global Updates & Testing - PARALLEL (2 tasks)

#### Task 5.1: Global Field Rename Migration [Depends on: 4.3, 4.4]

**READ THESE BEFORE TASK**
- `.docs/plans/opportunity-form-enhancement/requirements.md` (lines 970-1001)

**Instructions**

Files to Search and Modify:
- Use grep/search to find all references:
  - `sales_id` in opportunity context → `opportunity_owner_id`
  - `category` in opportunity context → `opportunity_context`
  - "Deal Owner" label → "Opportunity Owner"

**Systematic Updates:**
1. Run: `grep -r "sales_id" src/atomic-crm/opportunities/ --include="*.ts" --include="*.tsx"`
2. Update each file:
   - Filter components (OnlyMineInput.tsx, etc.)
   - Test files (*\\.spec.tsx, *\\.spec.ts)
   - Any reports or dashboard components
3. Run: `grep -r "category" src/atomic-crm/opportunities/ --include="*.ts" --include="*.tsx"`
4. Update category references to opportunity_context
5. Search for "Deal Owner" or "Sales Rep" labels, replace with "Opportunity Owner"
6. Update ConfigurationContext if it references opportunityCategories → opportunityContexts
7. Run `npm run build` to verify TypeScript compilation

**Estimated Files:** 10-15 files (filters, tests, list components)

**Tables:** None (frontend references only)

**Gotchas:**
- Some files may use both old and new names during transition
- Test files may need fixture data updated
- Don't change database column names - already done in Task 1.1
- Verify imports after renaming - TypeScript will catch missing updates

---

#### Task 5.2: Unit Tests & E2E Test [Depends on: 4.1, 4.2, 4.3]

**READ THESE BEFORE TASK**
- `.docs/plans/opportunity-form-enhancement/requirements.md` (lines 1003-1145)
- Task 2.2 output (diffProducts tests already written)

**Instructions**

Files to Create:
- `/e2e/opportunity-products.spec.ts` (if e2e directory exists)

Files to Verify:
- `/src/atomic-crm/opportunities/diffProducts.test.ts` (created in Task 2.2)

**E2E Test Implementation:**
1. Test complete workflow: login → navigate to opportunity edit → add product → update existing → remove product → save → verify
2. Use Playwright or Cypress based on project setup
3. Test stages:
   - Product dropdown filters by principal
   - Product name auto-populates
   - Quantity/price inputs work
   - Remove button deletes line
   - Save shows success notification
   - Show view displays products table with correct data
4. Test edge case: principal change clears products

**Unit Tests to Run:**
1. diffProducts tests (6 test cases from Task 2.2)
2. Run: `npm run test -- diffProducts.test.ts`
3. Verify all tests pass before marking complete

**Manual Testing Checklist:**
- Create opportunity with 0 products
- Create opportunity with 1 product
- Create opportunity with 3+ products
- Edit: add product
- Edit: update quantity/price
- Edit: remove product
- Principal change clears products
- Auto-name generation on create
- Regenerate name button on edit
- Kanban card shows products
- Show view displays products table

**Tables:** opportunities, opportunity_products (via test data)

**Gotchas:**
- E2E tests require test database with seed data
- May need to create test products linked to test principal
- Test atomicity: partial failures should rollback
- Test validation: missing required fields should show errors

---

## Advice

**Critical Path Sequencing:**
- Database migration (1.1) MUST complete before any backend work starts
- Data provider (3.1) MUST complete before frontend components can be tested
- Tasks 2.1, 2.2, 2.3 can run in parallel once 1.1 completes
- Tasks 4.1, 4.2, 4.4 can run in parallel once 3.1 completes
- Task 4.3 depends on both 4.1 and 4.2 completing
- Tasks 5.1 and 5.2 can run in parallel as final verification

**Database Migration Safety:**
- ALWAYS run pre-migration dependency check first - views/triggers/functions may reference old column names
- Test RPC function directly with SQL before integrating with data provider
- Verify atomicity: insert opportunity + 3 products, then cause error - should rollback all
- Backup production database before running migration

**Product Diffing Algorithm:**
- DO NOT use JSON.stringify for comparison - fails on key order and data types
- Use Map data structure for O(1) lookups, not array.find()
- Only compare editable fields (product_id_reference, quantity, unit_price, notes)
- Test all edge cases: empty arrays, unchanged products, mixed operations

**Form Integration:**
- useFieldArray MUST use field.id for keys, never array index - prevents React bugs
- transform prop runs before validation - structure data correctly
- pessimistic mutation mode required for atomic saves - no optimistic updates
- Cache invalidation (queryClient.invalidateQueries) critical after edit saves

**ReferenceInput Filtering:**
- Server-side filtering via filter prop: `{ principal_id: principalId }`
- Disable product dropdown until principal selected (disabled={!principalId})
- Clear products when principal changes (useEffect dependency)
- Handle null principal gracefully

**Data Provider Patterns:**
- getOne and getList MUST include products via JOIN to avoid N+1 queries
- RPC errors may be JSON strings - wrap in try/catch JSON.parse
- Use wrapMethod pattern for all operations (error logging built-in)
- previousData from React Admin contains original products for diffing

**Validation Layer:**
- Strict enum for opportunity_context - must match database CHECK constraint exactly
- Export enum schemas separately for component reuse
- Error format MUST be React Admin compatible: `{ message, errors: { field: "message" } }`
- Keep stage-specific validation in superRefine unchanged

**Type Safety:**
- TypeScript compilation (`npm run build`) is your final verification
- Products array optional in Opportunity interface (backward compatibility)
- Use Identifier type for IDs (supports string | number)
- Note: stage enum inconsistency between types.ts and stageConstants.ts exists - document but don't fix

**Testing Strategy:**
- Unit tests for diffProducts MUST pass before data provider integration
- E2E test validates entire flow including RPC atomicity
- Manual testing critical for UX: auto-name, principal filtering, product display
- Test error cases: validation failures, RPC errors, network failures

**Field Rename Impact:**
- Update ALL references: code, tests, filters, labels
- Use grep to find all occurrences systematically
- TypeScript will catch most missed updates at build time
- Configuration context may need opportunityCategories → opportunityContexts

**Component Reuse:**
- OpportunityProductsInput follows ArrayInput + useFieldArray pattern (see ContactInputs.tsx lines 108-134)
- useAutoGenerateName hook follows useWatch + useGetOne pattern
- Transform prop pattern used in ContactCreate.tsx lines 11-16
- RPC integration pattern in JunctionsService.ts lines 148-177
