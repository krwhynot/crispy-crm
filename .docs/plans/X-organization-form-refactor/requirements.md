# Organization Form Refactor Requirements

**Feature:** Simplify and modernize the organization form by removing unused fields, normalizing industry data, and improving organization type validation.

**Status:** Ready for Implementation
**Estimated Effort:** 3-5 days
**Breaking Changes:** Yes (database schema, API contracts)

---

## 1. Feature Summary

Refactor the organization form to remove legacy fields (country, tax identifier), normalize industry data into a dedicated table with searchable combobox input, and enforce stricter organization type validation by removing the "vendor" option and making the field required. This refactoring improves data quality, UX, and maintains consistency across the entire application.

---

## 2. User Stories

**As a CRM user,**
I want to select industries from a searchable dropdown with the ability to add new ones,
So that I can quickly categorize organizations without being limited to a predefined list.

**As a CRM user,**
I want the organization type field to be required,
So that all organizations have proper classification and I don't need to handle "unknown type" edge cases.

**As a developer,**
I want industries stored in a normalized database table,
So that we have a single source of truth, prevent duplicates, and enable analytics on industry distribution.

**As a developer,**
I want to remove unused fields (country, tax identifier) and the "vendor" organization type,
So that the codebase is cleaner and users aren't confused by deprecated options.

---

## 3. Technical Approach

### 3.1 Database Changes

**Migration:** `20250107000000_refactor_organization_fields.sql`

#### Industries Table (New)
```sql
CREATE TABLE industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT industries_name_unique UNIQUE (name)
);

CREATE UNIQUE INDEX industries_name_case_insensitive_idx
ON industries (lower(name));

-- RLS Policies
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access"
ON industries FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create"
ON industries FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

#### Organizations Table Changes
```sql
-- 1. Add new industry_id foreign key column
ALTER TABLE organizations
ADD COLUMN industry_id UUID REFERENCES industries(id);

-- 2. Seed "Unknown" industry
INSERT INTO industries (name) VALUES ('Unknown');

-- 3. Extract unique industries from old text column
INSERT INTO industries (name)
SELECT DISTINCT ON (lower(trim(industry))) INITCAP(trim(industry))
FROM organizations
WHERE industry IS NOT NULL AND trim(industry) <> ''
ON CONFLICT (name) DO NOTHING;

-- 4. Backfill industry_id by matching names
UPDATE organizations o
SET industry_id = i.id
FROM industries i
WHERE lower(trim(o.industry)) = lower(i.name);

-- 5. Set blanks to "Unknown"
UPDATE organizations
SET industry_id = (SELECT id FROM industries WHERE name = 'Unknown')
WHERE industry_id IS NULL;

-- 6. Enforce NOT NULL constraint
ALTER TABLE organizations
ALTER COLUMN industry_id SET NOT NULL;

-- 7. Drop old text column
ALTER TABLE organizations
DROP COLUMN industry;

-- 8. Remove country field
ALTER TABLE organizations
DROP COLUMN country;

-- 9. Update organization_type enum (remove "vendor")
-- First migrate existing vendor records
UPDATE organizations
SET organization_type = 'unknown'
WHERE organization_type = 'vendor';

-- Recreate enum without vendor
ALTER TYPE organization_type RENAME TO organization_type_old;

CREATE TYPE organization_type AS ENUM (
  'customer',
  'principal',
  'distributor',
  'prospect',
  'partner',
  'unknown'
);

ALTER TABLE organizations
ALTER COLUMN organization_type TYPE organization_type
USING organization_type::text::organization_type;

DROP TYPE organization_type_old;

-- 10. Change default to 'unknown'
ALTER TABLE organizations
ALTER COLUMN organization_type SET DEFAULT 'unknown';
```

#### Supabase RPC Function
```sql
CREATE OR REPLACE FUNCTION get_or_create_industry(p_name TEXT)
RETURNS SETOF industries AS $$
BEGIN
  -- Try to insert, skip if duplicate
  INSERT INTO industries (name, created_by)
  VALUES (trim(p_name), auth.uid())
  ON CONFLICT (lower(name)) DO NOTHING;

  -- Return the record (new or existing)
  RETURN QUERY
  SELECT * FROM industries
  WHERE lower(name) = lower(trim(p_name));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 Validation Layer

**File:** `src/atomic-crm/validation/organizations.ts`

```typescript
// Update organizationTypeSchema to remove "vendor"
export const organizationTypeSchema = z.enum([
  "customer",
  "prospect",
  "partner",
  "principal",
  "distributor",
  "unknown",
]);

// Update organizationSchema
export const organizationSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Organization name is required"),
  organization_type: organizationTypeSchema, // NOW REQUIRED (no .optional())
  industry_id: z.string().uuid().nullable(), // Changed from industry text field
  // ... other fields ...
  // REMOVED: country
  // REMOVED: tax_identifier
});
```

**New File:** `src/atomic-crm/validation/industries.ts`

```typescript
import { z } from "zod";

export const industrySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, "Industry name is required")
    .max(100, "Industry name too long")
    .trim(),
  created_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
});

export type Industry = z.infer<typeof industrySchema>;
```

### 3.3 Data Provider Updates

**File:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

Add industries resource handling:

```typescript
// Add to resource-specific logic
case 'industries':
  if (type === 'create') {
    // Use the get_or_create_industry RPC to handle duplicates
    const { data, error } = await supabaseClient
      .rpc('get_or_create_industry', { p_name: params.data.name });

    if (error) throw error;
    return { data: data[0] };
  }
  // Standard handling for getList, getOne, etc.
  break;
```

Integrate industry validation for organizations:

```typescript
case 'organizations':
  if (type === 'create' || type === 'update') {
    const validated = organizationSchema.parse(params.data);
    // Proceed with validated data
  }
  break;
```

### 3.4 Frontend Components

#### New Component: Industry Combobox Input

**File:** `src/components/admin/IndustryComboboxInput.tsx`

```typescript
import { useInput, useGetList, useCreate, useNotify } from "react-admin";
import { Combobox } from "@/components/ui/combobox";
import { useState } from "react";

export const IndustryComboboxInput = (props: any) => {
  const { field } = useInput(props);
  const notify = useNotify();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch industries for dropdown
  const { data: industries, isLoading } = useGetList("industries", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  // Create new industry handler
  const [create, { isLoading: isCreating }] = useCreate("industries");

  const handleCreateIndustry = async (name: string) => {
    try {
      const newIndustry = await create(
        "industries",
        { data: { name } },
        { returnPromise: true }
      );

      // Auto-select newly created industry
      field.onChange(newIndustry.id);
      notify("Industry created successfully", { type: "success" });
    } catch (error) {
      notify("Failed to create industry", { type: "error" });
    }
  };

  return (
    <Combobox
      value={field.value}
      onChange={field.onChange}
      options={industries || []}
      onCreateNew={handleCreateIndustry}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isLoading={isLoading || isCreating}
      placeholder="Select or create industry..."
      {...props}
    />
  );
};
```

#### Update Organization Inputs

**File:** `src/atomic-crm/organizations/OrganizationInputs.tsx`

**Changes:**
1. Replace `SelectInput` for industry with `IndustryComboboxInput`
2. Remove country field
3. Remove tax_identifier field
4. Update organization type choices (remove "vendor")
5. Add `required` validation to organization type

```typescript
import { IndustryComboboxInput } from "@/components/admin/IndustryComboboxInput";

// Replace industry SelectInput with:
<IndustryComboboxInput
  source="industry_id"
  label="Industry"
  fullWidth
/>

// Update organization type SelectInput:
<SelectInput
  source="organization_type"
  label="Organization Type"
  choices={[
    { id: "customer", name: "Customer" },
    { id: "prospect", name: "Prospect" },
    { id: "partner", name: "Partner" },
    { id: "principal", name: "Principal" },
    { id: "distributor", name: "Distributor" },
    { id: "unknown", name: "Unknown" },
  ]}
  defaultValue="unknown"
  validate={required()} // NEW: Make required
  fullWidth
/>

// REMOVE: country field
// REMOVE: tax_identifier field
```

### 3.5 Files Requiring Updates

**Component Files:**
- `src/atomic-crm/organizations/OrganizationInputs.tsx` - Remove fields, add combobox
- `src/atomic-crm/organizations/OrganizationListFilter.tsx` - Update industry filter, remove country filter, update type choices
- `src/atomic-crm/organizations/OrganizationAside.tsx` - Update type choices, change industry to ReferenceField
- `src/atomic-crm/organizations/OrganizationCard.tsx` - Change industry to reference lookup
- `src/atomic-crm/organizations/OrganizationType.tsx` - Remove "vendor" badge variant
- `src/atomic-crm/organizations/OrganizationList.tsx` - Update industry column display
- `src/atomic-crm/organizations/OrganizationShow.tsx` - Change industry to ReferenceField

**Type Files:**
- `src/atomic-crm/types.ts` - Update Organization interface
- `src/types/database.generated.ts` - Regenerate after migration

**Validation Files:**
- `src/atomic-crm/validation/organizations.ts` - Update schema
- `src/atomic-crm/validation/industries.ts` - Create new

**Provider Files:**
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Add industries resource

**Resource Registration:**
- `src/atomic-crm/root/CRM.tsx` - Register industries resource

**Configuration:**
- `src/atomic-crm/root/defaultConfiguration.ts` - Remove organizationSectors (no longer needed)
- `src/atomic-crm/root/ConfigurationContext.tsx` - Remove organizationSectors from context

---

## 4. UI/UX Flow

### Creating/Editing an Organization

**Before:**
1. User opens organization form
2. User sees country dropdown (unused)
3. User sees tax identifier field (unused)
4. User sees industry dropdown (hardcoded list from config)
5. User sees organization type dropdown (includes "vendor")
6. Organization type is optional (can be blank)

**After:**
1. User opens organization form
2. User sees industry combobox:
   - Type to search existing industries
   - See filtered results in real-time
   - Click to select existing industry
   - OR type new industry name and press "Create 'New Industry'"
   - See loading state while creating
   - Auto-selected after creation
3. User sees organization type dropdown (6 options, no "vendor")
4. Organization type defaults to "unknown" and is required
5. Country and tax identifier fields are gone

### Industry Combobox Behavior

1. **Initial State:** Dropdown shows all industries alphabetically
2. **User Types:** List filters to matching industries (case-insensitive, partial match)
3. **Exact Match:** If typed text matches existing industry, highlight it
4. **New Industry:** If no match, show "Create '[typed text]'" option at bottom
5. **Click Create:**
   - Show loading spinner
   - Call `get_or_create_industry` RPC
   - If duplicate (race condition), return existing record
   - Auto-select the industry
   - Show success notification
6. **Validation:** Empty industry is allowed (nullable field)

---

## 5. Success Metrics

### Data Quality
- ✅ Zero organizations with `organization_type = null`
- ✅ Zero duplicate industries (case-insensitive)
- ✅ All organizations have valid `industry_id` (or NULL)
- ✅ Zero organizations with `organization_type = 'vendor'`

### UX Improvements
- ✅ Users can add new industries without admin intervention
- ✅ Industry search responds instantly (< 100ms filter)
- ✅ No more "Country" or "Tax Identifier" fields cluttering the form
- ✅ Organization type is always selected (no blanks)

### Code Quality
- ✅ Industry values come from single source (database)
- ✅ No hardcoded industry arrays in configuration
- ✅ Organization type choices consistent across all components
- ✅ TypeScript types regenerated and compile successfully
- ✅ All validation at API boundary (Zod schemas)

### Migration Success
- ✅ Migration runs successfully in single transaction
- ✅ All existing industries migrated to new table
- ✅ All organizations linked to industries (or "Unknown")
- ✅ Old columns dropped with no errors
- ✅ RLS policies prevent unauthorized access

---

## 6. Out of Scope

**Explicitly NOT included in this feature:**

### Data Migration Features
- ❌ Rollback plan (big bang deployment, not live yet)
- ❌ Backward compatibility with old schema
- ❌ Data export/import tools for old format
- ❌ Migration of historical analytics using old fields

### Industry Management
- ❌ Admin UI to edit/delete industries
- ❌ Merging duplicate industries
- ❌ Industry categories/hierarchies
- ❌ Industry usage statistics dashboard
- ❌ Bulk industry operations

### Organization Type Enhancements
- ❌ Custom organization types (stays as enum)
- ❌ Organization type hierarchies
- ❌ Type-specific form fields
- ❌ Migration wizard for "vendor" organizations (auto-converted to "unknown")

### Advanced Features
- ❌ Industry recommendations based on organization name
- ❌ Auto-tagging organizations by industry
- ❌ Industry-based analytics/reports
- ❌ Multi-select industries per organization
- ❌ Country field restoration (permanently removed)
- ❌ Tax identifier field (not needed, not implemented)

### Testing
- ❌ Automated UI tests for industry combobox
- ❌ Load testing for industry creation
- ❌ Migration performance benchmarks

---

## 7. Implementation Checklist

### Phase 1: Database (Day 1)
- [ ] Create `20250107000000_refactor_organization_fields.sql` migration
- [ ] Create `industries` table with RLS policies
- [ ] Create `get_or_create_industry` RPC function
- [ ] Migrate existing industries from text to table
- [ ] Add `industry_id` foreign key to organizations
- [ ] Drop `country` column
- [ ] Remove "vendor" from `organization_type` enum
- [ ] Set organization_type default to "unknown"
- [ ] Run migration on dev database
- [ ] Regenerate TypeScript types: `npx supabase gen types typescript`

### Phase 2: Validation (Day 1-2)
- [ ] Create `src/atomic-crm/validation/industries.ts`
- [ ] Update `src/atomic-crm/validation/organizations.ts`
- [ ] Remove country and tax_identifier from schema
- [ ] Make organization_type required (remove `.optional()`)
- [ ] Change industry field to industry_id

### Phase 3: Data Provider (Day 2)
- [ ] Update `unifiedDataProvider.ts` to handle industries resource
- [ ] Implement `get_or_create_industry` RPC call
- [ ] Test create/read/update/delete for industries
- [ ] Test organization creation with new industry_id field

### Phase 4: UI Components (Day 2-3)
- [ ] Create `src/components/admin/IndustryComboboxInput.tsx`
- [ ] Update `OrganizationInputs.tsx`:
  - [ ] Replace industry SelectInput with IndustryComboboxInput
  - [ ] Remove country field
  - [ ] Remove tax_identifier field
  - [ ] Update organization type choices (remove vendor)
  - [ ] Add required validation to organization type
- [ ] Update `OrganizationListFilter.tsx`:
  - [ ] Change industry filter to use industries table
  - [ ] Remove country filter
  - [ ] Update organization type choices
- [ ] Update `OrganizationAside.tsx`:
  - [ ] Change industry TextField to ReferenceField
  - [ ] Update organization type choices
- [ ] Update `OrganizationCard.tsx`:
  - [ ] Change industry display to reference lookup
- [ ] Update `OrganizationType.tsx`:
  - [ ] Remove vendor badge variant
- [ ] Update `OrganizationList.tsx`:
  - [ ] Change industry column to ReferenceField
- [ ] Update `OrganizationShow.tsx`:
  - [ ] Change industry to ReferenceField

### Phase 5: Resource Registration (Day 3)
- [ ] Register industries resource in `CRM.tsx`
- [ ] Remove organizationSectors from `defaultConfiguration.ts`
- [ ] Remove organizationSectors from `ConfigurationContext.tsx`

### Phase 6: Type Updates (Day 3-4)
- [ ] Update `src/atomic-crm/types.ts` Organization interface
- [ ] Verify generated types in `src/types/database.generated.ts`
- [ ] Fix TypeScript compilation errors across project

### Phase 7: Testing & Validation (Day 4-5)
- [ ] Test organization creation with new industry
- [ ] Test organization creation with existing industry
- [ ] Test industry search/filter functionality
- [ ] Test duplicate industry handling (race condition)
- [ ] Test organization type validation (required field)
- [ ] Test organization list filters
- [ ] Test organization detail views
- [ ] Verify country field removed everywhere
- [ ] Verify vendor type removed everywhere
- [ ] Test form submission with validation errors
- [ ] Test RLS policies (authenticated users only)

### Phase 8: Cleanup (Day 5)
- [ ] Search codebase for remaining "country" references
- [ ] Search codebase for remaining "tax_identifier" references
- [ ] Search codebase for remaining "vendor" references
- [ ] Remove unused imports
- [ ] Update any related documentation
- [ ] Final TypeScript compilation check
- [ ] Final build check: `npm run build`

---

## 8. Risk Assessment

### Low Risk
- Industry table creation (new table, no dependencies)
- Removing unused country field (verified no data)
- Adding RLS policies (standard pattern)

### Medium Risk
- Removing "vendor" from enum (requires data migration)
  - **Mitigation:** Update all vendor records to "unknown" before enum change
- Making organization_type required (could break forms)
  - **Mitigation:** Set default to "unknown", update all NULL records in migration
- Replacing industry text with foreign key (schema change)
  - **Mitigation:** Atomic migration, backfill all records before constraint

### High Risk
- Race conditions on industry creation (two users adding same industry)
  - **Mitigation:** Use `get_or_create_industry` RPC with `ON CONFLICT DO NOTHING`
  - **Mitigation:** Case-insensitive unique index prevents duplicates at DB level

### Critical Risk
- Migration failure mid-transaction (partial schema changes)
  - **Mitigation:** Entire migration in single BEGIN/COMMIT transaction
  - **Mitigation:** Test migration on copy of database first
  - **Mitigation:** Not live yet, can re-run migration if needed

---

## 9. Parallel Decomposition

This feature can be implemented with parallel agents:

### Agent 1: Database & Backend
- Create migration script
- Create RPC function
- Update validation schemas
- Update data provider
- Test database changes

### Agent 2: Frontend Components
- Create IndustryComboboxInput component
- Update OrganizationInputs
- Update display components (List, Show, Card, Aside)
- Update filters
- Test UI interactions

### Agent 3: Integration & Cleanup
- Register industries resource in CRM.tsx
- Update configuration context
- Search/remove legacy field references
- Update TypeScript types
- Run final validation tests

**Coordination Point:** After Agent 1 completes migration and Agent 2 completes components, Agent 3 integrates and validates the complete feature.

---

## 10. Notes & Considerations

### Industry Naming Standards
- Use title case (INITCAP) for consistency
- Trim whitespace automatically
- Case-insensitive uniqueness (e.g., "finance" = "Finance")
- Max length: 100 characters

### Organization Type Default Behavior
- Default changed from "customer" to "unknown"
- Encourages explicit classification
- "Unknown" is valid state for new/unqualified organizations

### Configuration Context Cleanup
- `organizationSectors` removed from configuration
- Industries now sourced from database (single source of truth)
- Follows Engineering Constitution Rule #2

### TypeScript Type Generation
- Run `npx supabase gen types typescript` after migration
- Will update `database.generated.ts` automatically
- Compile errors will surface any missed references

### RLS Policy Considerations
- All authenticated users can read industries (needed for dropdown)
- All authenticated users can create industries (self-service model)
- No update/delete policies (protect data integrity)
- Consider adding admin-only policies in future if moderation needed
