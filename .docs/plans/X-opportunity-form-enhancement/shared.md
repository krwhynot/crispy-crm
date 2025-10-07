# Opportunity Form Enhancement - Shared Architecture

The opportunity form enhancement adds multi-product line items with principal-filtered selection, auto-generated naming, and structured context categorization. The implementation requires coordination between database schema (column renames, RPC function for atomic transactions), validation layer (Zod schemas with strict enums), data provider (product diffing algorithm, RPC integration), and frontend (useFieldArray for dynamic products, useWatch for reactive name generation). This feature leverages existing patterns: junction tables for relationships, summary views for efficient reads, and single-point validation at the API boundary.

## Relevant Files

### Database & Migrations
- `/supabase/migrations/`: Migration timestamp format `YYYYMMDDHHMMSS_description.sql`
- Existing junction table: `opportunity_products` - Already supports product relationships with pricing fields
- Existing catalog: `products` table with `principal_id` FK for filtering

### Validation Layer (API Boundary Only)
- `/src/atomic-crm/validation/opportunities.ts`: Current Zod schema with stage-specific validation via superRefine, enum patterns
- `/src/atomic-crm/validation/ValidationService.ts`: Registry pattern, registers create/update validators for each resource
- Pattern: Export enum schemas separately, use `.optional()` for nullable fields, format errors as `{ message, errors: { field: message } }`

### Data Provider
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Transform → Validate → Database flow, RPC support (lines 532-553)
- `/src/atomic-crm/providers/supabase/services/TransformService.ts`: File upload transformers, no current opportunity transformer
- `/src/atomic-crm/providers/supabase/dataProviderUtils.ts`: Search params transformation, JSONB array handling, PostgREST operators
- Pattern: Use summary views for reads (`opportunities_summary`), base tables for writes (`opportunities`)

### Form Components
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Shared form inputs, uses useWatch for stage-specific fields, responsive layout with Separator
- `/src/atomic-crm/opportunities/OpportunityCreate.tsx`: Form with defaultValues, index management for kanban positioning
- `/src/atomic-crm/opportunities/OpportunityEdit.tsx`: Edit form with organization avatar header, pessimistic mutation mode
- `/src/components/admin/array-input.tsx`: ArrayInput wrapper using useFieldArray from react-hook-form, provides context via ArrayInputContext
- `/src/components/admin/reference-input.tsx`: ReferenceInput with server-side filtering support via filter prop

### Display Components
- `/src/atomic-crm/opportunities/OpportunityCard.tsx`: Kanban card showing name, amount, priority, probability, principal badge
- `/src/atomic-crm/opportunities/OpportunityShow.tsx`: Detail view with ReferenceManyField for notes

### Custom Hooks & Utilities
- `/src/hooks/useSupportCreateSuggestion.tsx`: Adds "Create new X" to autocomplete dropdowns, used by AutocompleteInput
- `/src/hooks/array-input-context.tsx`: Exports useArrayInput() hook providing { append, fields, move, remove, replace }

### Types
- `/src/atomic-crm/types.ts`: Opportunity interface (note: stage enum in types.ts differs from stageConstants.ts - needs alignment)

## Relevant Tables

### opportunities
- **Current fields**: id, name, description, stage, status, priority, amount, probability, customer_organization_id, principal_organization_id, distributor_organization_id, contact_ids (JSONB array), sales_id, estimated_close_date, deleted_at
- **Fields to rename**: `sales_id` → `opportunity_owner_id`, `category` → `opportunity_context`
- **Indexes**: idx_opportunities_stage, idx_opportunities_deleted_at (WHERE deleted_at IS NULL)
- **View**: `opportunities_summary` - includes denormalized org names via LEFT JOINs

### opportunity_products (junction table)
- **Schema**: id, opportunity_id (FK, NOT NULL), product_id_reference (FK to products.id), product_name (denormalized), product_category, quantity (default 1), unit_price, extended_price (GENERATED), notes, created_at, updated_at
- **Pattern**: Supports both catalog products (via product_id_reference) and custom/ad-hoc products (name-only)
- **No soft delete**: Relies on parent opportunity soft delete cascade
- **Indexes**: idx_opportunity_products_opp_id, idx_opportunity_products_product_ref

### products (catalog)
- **Schema**: id, principal_id (NOT NULL, FK to organizations), name, sku, category, list_price, cost_per_unit, status (active/discontinued/seasonal), deleted_at
- **Key for filtering**: principal_id enables "show only this principal's products" filter
- **Indexes**: idx_products_principal_id WHERE deleted_at IS NULL, unique_sku_per_principal

### organizations
- **Referenced by**: opportunities (customer, principal, distributor FKs)
- **View**: organizations_summary for efficient name lookups

## Relevant Patterns

**Validation at API Boundary Only**: Zod schemas in `/src/atomic-crm/validation/`, registered in ValidationService, no client-side validation. Use `.superRefine()` for conditional/stage-based validation. Export enum schemas separately for reuse (e.g., `opportunityStageSchema`). See `opportunities.ts` lines 176-233 for stage-specific validation example.

**Transform → Validate → Database Flow**: unifiedDataProvider processes data via `processForDatabase()` which calls TransformService (file uploads) then ValidationService (Zod). See `unifiedDataProvider.ts` lines 114-175. No current opportunity transformer exists (add to TransformService.transformerRegistry if needed).

**Summary Views for Reads, Base Tables for Writes**: `getDatabaseResource()` returns `{resource}_summary` for getList/getOne, base table for create/update/delete. Views include denormalized data via JOINs. See `dataProviderUtils.ts` lines 189-205.

**useFieldArray for Dynamic Arrays**: React Hook Form's useFieldArray via ArrayInput wrapper. Access control via `useFormContext()`, not prop drilling. Use `field.id` for React keys (NOT array index). See `array-input.tsx` lines 53-64 and example in `ContactInputs.tsx` lines 108-134.

**ReferenceInput with Server-Side Filtering**: Pass `filter` prop for permanent filters (e.g., `{ principal_id: principalId }`). Child AutocompleteInput uses `filterToQuery` for search text transformation. See `reference-input.tsx` and example in requirements.md lines 500-507.

**RPC Functions for Atomic Transactions**: Use `dataProvider.rpc(functionName, params)` for multi-step operations that must succeed/fail together. Check RPC support with `if (!dataProvider.rpc)`. Pattern in `JunctionsService.ts` lines 148-177. Current RPC implementation at `unifiedDataProvider.ts` lines 532-553 (validation TODO at line 537).

**useWatch for Reactive Forms**: Monitor field values for conditional rendering. Used in OpportunityInputs (line 22) to show/hide stage-specific fields. Pattern: `const fieldValue = useWatch({ name: "fieldName" })`.

**useFormContext for Auto-Population**: Get/set values programmatically without prop drilling. Used in ContactInputs (lines 78-103) for email-based name extraction. Pattern: `const { getValues, setValue } = useFormContext()`.

**Product Diffing Algorithm**: Compare database products vs. form products to determine creates/updates/deletes. DO NOT use JSON.stringify - fails on key order and data types. Use field-by-field comparison of editable fields only (product_id_reference, quantity, unit_price, notes). See requirements.md lines 274-328 for implementation pattern.

**Junction Table 3-Step Pattern**: (1) Fetch junction records with getList, (2) Batch fetch related entities with getMany (avoid N+1), (3) Build Map for O(1) lookup and combine in memory. See `JunctionsService.ts` lines 179-303 and `data-provider.docs.md` lines 392-469.

**JSONB Array Handling**: Opportunities use `contact_ids` as JSONB array. Filters transform to PostgREST `@cs` operator: `{ tags: [1,2,3] }` → `{ "tags@cs": "{1,2,3}" }`. Responses normalized via `normalizeResponseData()` to ensure arrays. See `dataProviderUtils.ts` lines 81-137, 294-339.

**Form Structure Best Practices**: Separate input components by logical section, use h3 headings, responsive layout with `useIsMobile()`, consistent gap spacing (gap-4 for inputs, gap-6/gap-8 for sections). See OpportunityInputs.tsx and pattern in `form-patterns.docs.md` lines 467-497.

**Default Values Priority**: (1) Existing record data in Edit, (2) Input-level defaultValue prop, (3) Form-level defaultValues object, (4) Backend defaults via validation. Set at Form level for clarity unless input-specific. See `form-patterns.docs.md` lines 260-295, 517-524.

**Error Handling Pattern**: Format all validation errors as `{ message: "Validation failed", errors: { field: "message" } }` for React Admin compatibility. Wrap operations with `wrapMethod()` for logging. See `validation-docs.md` lines 321-343 and `data-provider.docs.md` lines 773-809.

## Relevant Docs

**`.docs/plans/opportunity-form-enhancement/requirements.md`**: You _must_ read this when working on feature scope, user stories, technical approach, migration steps, RPC function design, component specifications, UI/UX flow, success metrics, rollout plan.

**`.docs/plans/opportunity-form-enhancement/database.docs.md`**: You _must_ read this when working on schema changes, migration patterns, column renames, constraint additions, index updates, trigger patterns, RPC function patterns, opportunity_products table structure.

**`.docs/plans/opportunity-form-enhancement/validation-docs.md`**: You _must_ read this when working on Zod schemas, ValidationService integration, enum field patterns, array field validation, conditional validation with superRefine, error formatting for React Admin, testing validation.

**`.docs/plans/opportunity-form-enhancement/form-patterns.docs.md`**: You _must_ read this when working on useFieldArray implementation, ReferenceInput with filtering, AutocompleteInput server-side filtering, useWatch for conditional fields, useFormContext for auto-population, ArrayInput + SimpleFormIterator patterns, default values in create/edit forms.

**`.docs/plans/opportunity-form-enhancement/opportunities-architecture.docs.md`**: You _must_ read this when working on existing opportunity forms, stage-specific field visibility, OpportunityInputs structure, OpportunityCreate/Edit patterns, kanban card display, transform patterns, validation integration, type definitions.

**`.docs/plans/opportunity-form-enhancement/data-provider.docs.md`**: You _must_ read this when working on data provider integration, getOne/getList/create/update patterns, RPC function usage, junction table operations, JSONB array handling, summary views vs base tables, error handling, validation flow, transform flow.
