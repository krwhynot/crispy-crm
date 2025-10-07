# Organization Form Refactor - Parallel Execution Plan

## Required Reading
- `@.docs/plans/organization-form-refactor/requirements.md` - Complete feature requirements
- `@.docs/plans/organization-form-refactor/shared.md` - Shared patterns and conventions

## Task Execution Order

### Phase 1: Database & Validation Foundation (Parallel - No Dependencies)

#### Task 1.1: Create Database Migration
**Agent Type:** `parallel-backend-implementor`
**Dependencies:** None
**Estimated Time:** 2 hours

**Objective:** Create the complete database migration script

**Implementation Steps:**
1. Create file: `supabase/migrations/20250107000000_refactor_organization_fields.sql`
2. Implement the following in order within a single transaction:
   - Create `industries` table with schema from requirements.md section 3.1
   - Create case-insensitive unique index on `lower(name)`
   - Enable RLS and create policies (SELECT and INSERT for authenticated users)
   - Create `get_or_create_industry` RPC function
   - Add `industry_id UUID` column to `organizations` table (nullable initially)
   - Insert 'Unknown' industry record
   - Extract and insert unique industries using `DISTINCT ON (lower(trim(industry)))`
   - Backfill `industry_id` by matching names (case-insensitive)
   - Set remaining `industry_id` to 'Unknown' where NULL
   - Set `industry_id NOT NULL` constraint
   - Drop old `industry TEXT` column
   - Drop `country TEXT` column
   - Update existing `organization_type = 'vendor'` to `'unknown'`
   - Remove 'vendor' from enum (rename old, create new, alter column, drop old)
   - Set `organization_type DEFAULT 'unknown'`

**Files to Create:**
- `supabase/migrations/20250107000000_refactor_organization_fields.sql`

**Validation:**
- Migration must be wrapped in BEGIN/COMMIT
- Follow exact SQL from requirements.md section 3.1
- Use `INITCAP(trim(industry))` for title case standardization
- Use `ON CONFLICT (name) DO NOTHING` for safety

**Success Criteria:**
- Migration file created
- No compilation errors
- SQL syntax valid (PostgreSQL 14+)

---

#### Task 1.2: Create Industry Validation Schema
**Agent Type:** `parallel-backend-implementor`
**Dependencies:** None
**Estimated Time:** 30 minutes

**Objective:** Create Zod validation schema for industries resource

**Implementation Steps:**
1. Create file: `src/atomic-crm/validation/industries.ts`
2. Implement schema as specified in requirements.md section 3.2:
   - Import Zod
   - Create `industrySchema` with fields: id (uuid, optional), name (string, min 1, max 100, trimmed), created_at (string, optional), created_by (uuid, optional)
   - Export Industry type

**Files to Create:**
- `src/atomic-crm/validation/industries.ts`

**Success Criteria:**
- File created with correct Zod schema
- TypeScript compiles without errors
- Schema matches database structure

---

#### Task 1.3: Update Organization Validation Schema
**Agent Type:** `parallel-backend-implementor`
**Dependencies:** None
**Estimated Time:** 30 minutes

**Objective:** Update organization schema to remove fields and update types

**Implementation Steps:**
1. Read current schema: `@src/atomic-crm/validation/organizations.ts`
2. Update `organizationTypeSchema` to remove "vendor":
   - Keep only: customer, prospect, partner, principal, distributor, unknown
3. Update `organizationSchema`:
   - Remove `country` field (if present)
   - Remove `tax_identifier` field (if present)
   - Change `industry` field to `industry_id` (uuid, nullable)
   - Remove `.optional()` from `organization_type` (make required)

**Files to Modify:**
- `src/atomic-crm/validation/organizations.ts`

**Success Criteria:**
- Schema updated correctly
- TypeScript compiles without errors
- Validation aligned with database changes

---

### Phase 2: Data Provider Updates (Depends on Phase 1.2)

#### Task 2.1: Add Industries Resource to Data Provider
**Agent Type:** `parallel-backend-implementor`
**Dependencies:** Task 1.2
**Estimated Time:** 1 hour

**Objective:** Extend unifiedDataProvider to handle industries resource with RPC support

**Implementation Steps:**
1. Read: `@src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
2. Add case for 'industries' resource:
   - For `create` type: Call `supabaseClient.rpc('get_or_create_industry', { p_name: params.data.name })`
   - Handle error cases
   - Return first item from array result
   - For other types (getList, getOne): Use standard Supabase queries
3. Import `industrySchema` from validation file
4. Add validation for industries create/update operations

**Files to Modify:**
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Success Criteria:**
- Industries resource fully integrated
- RPC call implemented for create operations
- TypeScript compiles without errors
- Standard CRUD operations supported

---

### Phase 3: Frontend Components (Parallel - Depends on Phase 1.2, 1.3)

#### Task 3.1: Create Industry Combobox Input Component
**Agent Type:** `parallel-frontend-implementor`
**Dependencies:** Task 1.2
**Estimated Time:** 2 hours

**Objective:** Create searchable combobox component for industry selection with create capability

**Implementation Steps:**
1. Create file: `src/components/admin/IndustryComboboxInput.tsx`
2. Import dependencies:
   - React Admin: `useInput`, `useGetList`, `useCreate`, `useNotify`
   - shadcn/ui: `Combobox` from `@/components/ui/combobox`
   - React: `useState`
3. Implement component:
   - Use `useInput(props)` to get field
   - Use `useGetList("industries", {pagination, sort})` to fetch industries
   - Use `useCreate()` for creating new industries
   - Use `useState` for search query
   - Implement `handleCreateIndustry` function:
     - Call create with industry name
     - Auto-select via `field.onChange(newIndustry.id)`
     - Show success notification
   - Return Combobox with all props wired up
4. Handle loading states (isLoading || isCreating)

**Files to Create:**
- `src/components/admin/IndustryComboboxInput.tsx`

**Reference:**
- See requirements.md section 3.4 for complete component code

**Success Criteria:**
- Component created and exports correctly
- TypeScript compiles without errors
- Uses React Admin hooks correctly
- Handles create-on-the-fly functionality

---

#### Task 3.2: Update Organization Form Inputs
**Agent Type:** `parallel-frontend-implementor`
**Dependencies:** Task 1.3, Task 3.1
**Estimated Time:** 1 hour

**Objective:** Update OrganizationInputs to use new combobox and remove deprecated fields

**Implementation Steps:**
1. Read: `@src/atomic-crm/organizations/OrganizationInputs.tsx`
2. Import `IndustryComboboxInput` from `@/components/admin/IndustryComboboxInput`
3. Import `required` validator from react-admin
4. Replace industry SelectInput with:
   ```tsx
   <IndustryComboboxInput
     source="industry_id"
     label="Industry"
     fullWidth
   />
   ```
5. Update organization type SelectInput:
   - Remove "vendor" choice from array
   - Keep: customer, prospect, partner, principal, distributor, unknown
   - Add `validate={required()}` prop
   - Change `defaultValue="unknown"`
6. Remove country field (SelectInput or TextInput with source="country")
7. Remove tax_identifier field (TextInput with source="tax_identifier")

**Files to Modify:**
- `src/atomic-crm/organizations/OrganizationInputs.tsx`

**Success Criteria:**
- Industry uses IndustryComboboxInput with source="industry_id"
- Organization type is required with 6 choices (no vendor)
- Country field completely removed
- Tax identifier field completely removed
- TypeScript compiles without errors

---

#### Task 3.3: Update Organization List Filter
**Agent Type:** `parallel-frontend-implementor`
**Dependencies:** Task 1.3
**Estimated Time:** 45 minutes

**Objective:** Update filters to work with industries table and remove deprecated filters

**Implementation Steps:**
1. Read: `@src/atomic-crm/organizations/OrganizationListFilter.tsx`
2. Update industry filter:
   - Change from using `organizationSectors` from ConfigurationContext
   - Use ReferenceArrayInput with reference="industries"
   - Or use FilterCategory with choices loaded via useGetList('industries')
   - Source should be "industry_id"
3. Update organization_type filter:
   - Remove "vendor" from choices
   - Keep only: customer, prospect, partner, principal, distributor, unknown
4. Remove country filter (if exists)

**Files to Modify:**
- `src/atomic-crm/organizations/OrganizationListFilter.tsx`

**Success Criteria:**
- Industry filter works with industries table
- Organization type filter excludes vendor
- Country filter removed
- TypeScript compiles without errors

---

#### Task 3.4: Update Organization Display Components
**Agent Type:** `parallel-frontend-implementor`
**Dependencies:** Task 1.3
**Estimated Time:** 1.5 hours

**Objective:** Update all display components to show industry via reference and remove vendor type

**Implementation Steps:**
1. Update `OrganizationAside.tsx`:
   - Read: `@src/atomic-crm/organizations/OrganizationAside.tsx`
   - Replace industry TextField with ReferenceField:
     ```tsx
     <ReferenceField source="industry_id" reference="industries" link={false}>
       <TextField source="name" />
     </ReferenceField>
     ```
   - Update organization_type SelectField choices (remove vendor)

2. Update `OrganizationCard.tsx`:
   - Read: `@src/atomic-crm/organizations/OrganizationCard.tsx`
   - Replace industry display with ReferenceField lookup
   - Update to use `industry_id` source

3. Update `OrganizationList.tsx`:
   - Read: `@src/atomic-crm/organizations/OrganizationList.tsx`
   - Update industry column to use ReferenceField with source="industry_id"

4. Update `OrganizationShow.tsx`:
   - Read: `@src/atomic-crm/organizations/OrganizationShow.tsx`
   - Replace industry TextField with ReferenceField
   - Remove country field display (if exists)

5. Update `OrganizationType.tsx`:
   - Read: `@src/atomic-crm/organizations/OrganizationType.tsx`
   - Remove "vendor" badge variant handling
   - Ensure only 6 types are handled

**Files to Modify:**
- `src/atomic-crm/organizations/OrganizationAside.tsx`
- `src/atomic-crm/organizations/OrganizationCard.tsx`
- `src/atomic-crm/organizations/OrganizationList.tsx`
- `src/atomic-crm/organizations/OrganizationShow.tsx`
- `src/atomic-crm/organizations/OrganizationType.tsx`

**Success Criteria:**
- All components use ReferenceField for industry_id
- All components exclude vendor type
- Country field removed from all displays
- TypeScript compiles without errors

---

### Phase 4: Integration & Resource Registration (Depends on Phase 2, 3)

#### Task 4.1: Register Industries Resource
**Agent Type:** `parallel-integration-implementor`
**Dependencies:** Task 2.1, Task 3.1
**Estimated Time:** 30 minutes

**Objective:** Register industries resource in CRM.tsx

**Implementation Steps:**
1. Read: `@src/atomic-crm/root/CRM.tsx`
2. Add Resource import from react-admin
3. Add industries resource registration:
   ```tsx
   <Resource name="industries" />
   ```
4. Place it logically with other resources (alphabetically or by domain)

**Files to Modify:**
- `src/atomic-crm/root/CRM.tsx`

**Success Criteria:**
- Industries resource registered
- TypeScript compiles without errors
- Resource accessible via data provider

---

#### Task 4.2: Update Configuration Context
**Agent Type:** `parallel-integration-implementor`
**Dependencies:** None
**Estimated Time:** 30 minutes

**Objective:** Remove organizationSectors from configuration (no longer needed)

**Implementation Steps:**
1. Update `defaultConfiguration.ts`:
   - Read: `@src/atomic-crm/root/defaultConfiguration.ts`
   - Remove `defaultOrganizationSectors` array export
2. Update `ConfigurationContext.tsx`:
   - Read: `@src/atomic-crm/root/ConfigurationContext.tsx`
   - Remove `organizationSectors` from context interface
   - Remove from provider value
   - Remove from default configuration

**Files to Modify:**
- `src/atomic-crm/root/defaultConfiguration.ts`
- `src/atomic-crm/root/ConfigurationContext.tsx`

**Success Criteria:**
- organizationSectors removed from config
- TypeScript compiles without errors
- No broken imports

---

### Phase 5: Cleanup & Validation (Depends on All Previous Phases)

#### Task 5.1: Search and Remove Legacy Field References
**Agent Type:** `general-purpose`
**Dependencies:** All previous tasks
**Estimated Time:** 1 hour

**Objective:** Find and remove all remaining references to deprecated fields

**Implementation Steps:**
1. Search entire codebase for:
   - "country" (in organization context)
   - "tax_identifier" or "taxIdentifier"
   - "vendor" (as organization type)
   - Old "industry" field (not industry_id)
2. For each match:
   - Verify it's related to organizations
   - Remove or update the reference
   - Ensure no broken imports remain
3. Update TypeScript types:
   - Read: `@src/atomic-crm/types.ts`
   - Update Organization interface if needed

**Files to Check:**
- All files in `src/atomic-crm/organizations/`
- `src/atomic-crm/types.ts`
- Any test files
- Configuration files

**Success Criteria:**
- Zero references to country in organization context
- Zero references to tax_identifier
- Zero references to vendor organization type
- TypeScript compiles without errors

---

#### Task 5.2: Final TypeScript Compilation Check
**Agent Type:** `general-purpose`
**Dependencies:** Task 5.1
**Estimated Time:** 15 minutes

**Objective:** Verify entire project compiles successfully

**Implementation Steps:**
1. Run TypeScript compilation: `npm run build` or `tsc --noEmit`
2. If errors found:
   - Document each error with file and line number
   - Report back for fixes
3. If successful:
   - Confirm all changes compile cleanly

**Success Criteria:**
- `npm run build` completes successfully
- Zero TypeScript errors
- Zero ESLint critical errors

---

## Task Dependency Graph

```
Phase 1 (Parallel):
├─ Task 1.1: Database Migration (independent)
├─ Task 1.2: Industry Schema (independent)
└─ Task 1.3: Organization Schema (independent)

Phase 2:
└─ Task 2.1: Data Provider (depends: 1.2)

Phase 3 (Parallel after 1.2, 1.3):
├─ Task 3.1: Combobox Component (depends: 1.2)
├─ Task 3.2: Form Inputs (depends: 1.3, 3.1)
├─ Task 3.3: List Filter (depends: 1.3)
└─ Task 3.4: Display Components (depends: 1.3)

Phase 4 (Parallel after 2.1, 3.1):
├─ Task 4.1: Register Resource (depends: 2.1, 3.1)
└─ Task 4.2: Config Cleanup (independent, can run anytime)

Phase 5 (Sequential, after all):
├─ Task 5.1: Cleanup (depends: all previous)
└─ Task 5.2: Final Check (depends: 5.1)
```

## Execution Batches

**Batch 1:** Tasks 1.1, 1.2, 1.3 (3 agents in parallel)
**Batch 2:** Task 2.1 (1 agent, waits for 1.2)
**Batch 3:** Tasks 3.1, 3.3, 3.4 (3 agents in parallel, wait for 1.2, 1.3)
**Batch 4:** Task 3.2 (1 agent, waits for 3.1)
**Batch 5:** Tasks 4.1, 4.2 (2 agents in parallel, 4.1 waits for 2.1, 3.1)
**Batch 6:** Task 5.1 (1 agent, waits for all)
**Batch 7:** Task 5.2 (1 agent, waits for 5.1)

**Total Tasks:** 11
**Estimated Total Time:** 8-10 hours with parallel execution
