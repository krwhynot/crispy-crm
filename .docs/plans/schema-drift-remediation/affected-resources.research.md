# Schema Drift Remediation: Affected Resources Research

Comprehensive analysis of schema drift issues across Atomic CRM resources, focusing on mismatches between database schema, Zod validation, TypeScript types, and UI components.

## Overview

Schema drift has created inconsistencies across five major resource areas:
1. **Contacts**: Name field usage (first_name/last_name vs name)
2. **Opportunities**: Organization relationships and legacy field references
3. **Tasks**: Enum type validation and field naming
4. **Organizations**: Segment relationships (segment_id UUID vs legacy text field)
5. **Notes**: Table naming inconsistency (contactNotes/opportunityNotes vs contact_notes/opportunity_notes)

---

## 1. Contacts Resource

### Database Schema (`contacts` table)
**Location**: `/home/krwhynot/Projects/atomic/src/types/database.generated.ts` (Lines 198-289)

**Key Fields**:
- `name: string` (required) - Computed/denormalized field
- `first_name: string | null`
- `last_name: string | null`
- `email: any | null` - JSONB array format: `[{"email":"x@y.com","type":"Work"}]`
- `phone: any | null` - JSONB array format: `[{"number":"555-1234","type":"Work"}]`
- `organization_id: number | null` - Single organization reference (backward compatibility)
- `tags: any[] | null` - JSONB array

**Related Tables**:
- `contact_organizations` - Junction table for multi-organization support with `is_primary` flag
- `contacts_summary` - View with denormalized `company_name` field

### Zod Validation Schema
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts` (Lines 65-118)

**Schema Definition**:
```typescript
export const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
  organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  sales_id: z.union([z.string(), z.number()]).refine(...), // Required
  // NO 'name' field in schema
})
```

**DRIFT ISSUE**: Schema validates `first_name` and `last_name` but database has `name` as required field. This suggests `name` is generated from first_name/last_name at the database level.

**Helper Schemas**:
- `emailAndTypeSchema` - Validates email array entries with type enum
- `phoneNumberAndTypeSchema` - Validates phone array entries with type enum
- `contactOrganizationSchema` - Validates junction table relationships

### UI Components

#### ContactInputs.tsx
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactInputs.tsx` (Lines 17-187)

**Form Fields**:
- `first_name` - Required
- `last_name` - Required
- `email` - Array input with SimpleFormIterator
- `phone` - Array input with SimpleFormIterator
- `title`
- `department`
- `organization_id` - ReferenceInput to organizations
- `linkedin_url`
- `sales_id` - Required

**DRIFT ISSUE**: No `name` field in form. Auto-generation from `first_name`/`last_name` expected at database level.

#### ContactShow.tsx
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactShow.tsx` (Lines 12-126)

**Display Pattern**:
```typescript
<h5>{record.first_name} {record.last_name}</h5>
```

**Organization Display**:
- Uses `record.organizations?.find((org) => org.is_primary)` to show primary organization
- References field as `company_id` (Lines 42-44, 58-60) but should be `organization_id`

**DRIFT ISSUE**: Uses `company_id` for ReferenceField instead of `organization_id` when accessing junction table data.

### Test Files Requiring Updates

1. **ContactCreate.test.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/__tests__/ContactCreate.test.tsx`
2. **ContactList.test.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/__tests__/ContactList.test.tsx`
3. **ContactMultiOrg.spec.ts** - `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactMultiOrg.spec.ts`
4. **ContactList.spec.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactList.spec.tsx`
5. **Validation tests** - `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/contacts/`

### Additional Component Files

**Files needing review**:
- `ContactEdit.tsx`
- `ContactCreate.tsx`
- `ContactList.tsx`
- `ContactListContent.tsx`
- `ContactAside.tsx`
- `MultiOrganizationInput.tsx` - Multi-org relationship management
- `ContactListFilter.tsx` - Filter logic for organization_id

### Filter Registry
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts` (Lines 22-48)

**Registered Filters**:
- `organization_id` - Correct
- `company_name` - From contacts_summary view
- `email`, `phone` - JSONB array fields
- No `name` field (uses first_name/last_name separately)

---

## 2. Opportunities Resource

### Database Schema (`opportunities` table)
**Location**: `/home/krwhynot/Projects/atomic/src/types/database.generated.ts` (Lines 452-546)

**Key Fields**:
- `name: string` (required)
- `stage: any | null` - Enum type (opportunity_stage)
- `status: any | null` - Enum type (opportunity_status)
- `priority: any | null` - Enum type (opportunity_priority)
- `customer_organization_id: number | null`
- `principal_organization_id: number | null`
- `distributor_organization_id: number | null`
- `contact_ids: any[] | null` - JSONB array of contact IDs
- `opportunity_owner_id: number | null`
- `account_manager_id: number | null`
- `lead_source: string | null`
- `tags: any[] | null`

**DRIFT ISSUE**: Database uses `any` for enum types instead of proper TypeScript enum types.

### Zod Validation Schema
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts` (Lines 48-113)

**Schema Definition**:
```typescript
export const opportunitySchema = z.object({
  name: z.string().min(1, "Opportunity name is required"),
  customer_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  principal_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  distributor_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  contact_ids: z.array(z.union([z.string(), z.number()])).min(1, "At least one contact is required"),
  stage: opportunityStageSchema.nullable().default("new_lead"),
  status: opportunityStatusSchema.optional().nullable(),
  priority: opportunityPrioritySchema.nullable().default("medium"),
  estimated_close_date: z.string().min(1).default(() => new Date().toISOString().split("T")[0]),
  // ... other fields
})
.refine((data) => {
  // Legacy field validation
  if ("company_id" in data) {
    throw new Error("Field 'company_id' is no longer supported. Use customer_organization_id...");
  }
})
```

**Enum Schemas** (Lines 11-46):
- `opportunityStageSchema` - 8 stages: new_lead, initial_outreach, sample_visit_offered, etc.
- `opportunityStatusSchema` - 5 statuses: active, on_hold, nurturing, stalled, expired
- `opportunityPrioritySchema` - 4 priorities: low, medium, high, critical
- `leadSourceSchema` - 8 sources: referral, trade_show, website, etc.

**Form State Defaults** (Lines 70-77):
Uses Constitution #5 pattern: `opportunitySchema.partial().parse({})` to extract schema defaults.

### UI Components

#### OpportunityInputs.tsx
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx` (Lines 18-184)

**Form Fields**:
- `name` - Required with auto-generate button
- `description`
- `estimated_close_date` - Required with date type
- `stage` - SelectInput with default "new_lead"
- `priority` - SelectInput with default "medium"
- `lead_source` - LeadSourceInput component
- `customer_organization_id` - ReferenceInput with AutocompleteOrganizationInput
- `principal_organization_id` - ReferenceInput
- `distributor_organization_id` - ReferenceInput
- `account_manager_id` - ReferenceInput to sales
- `contact_ids` - ReferenceArrayInput to contacts_summary

**DRIFT ISSUE**: Uses `defaultValue` props on SelectInput (Lines 82, 95) which violates Constitution #5 (should use form-level defaultValues from schema).

#### OpportunityCreate.tsx
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx` (Lines 20-121)

**Form Defaults** (Lines 83-91):
```typescript
const formDefaults = {
  ...opportunitySchema.partial().parse({}),
  opportunity_owner_id: identity?.id,
  account_manager_id: identity?.id,
};
```

**CORRECT PATTERN**: Follows Constitution #5 perfectly.

### Test Files Requiring Updates

1. **OpportunityCreate.unit.test.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/__tests__/OpportunityCreate.unit.test.tsx`
2. **OpportunityEdit.unit.test.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/__tests__/OpportunityEdit.unit.test.tsx`
3. **OpportunityList.test.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/__tests__/OpportunityList.test.tsx`
4. **OpportunityCreate.spec.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.spec.tsx`
5. **OpportunityList.spec.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.spec.tsx`
6. **OpportunityShow.spec.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityShow.spec.tsx`
7. **OpportunityWorkflows.spec.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityWorkflows.spec.tsx`
8. **Validation tests** - `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/opportunities/`

### Additional Component Files

**Files needing review**:
- `OpportunityShow.tsx`
- `OpportunityEdit.tsx`
- `OpportunityList.tsx`
- `OpportunityCard.tsx` - Kanban card display
- `OpportunityColumn.tsx` - Kanban column logic
- `OpportunityHeader.tsx`
- `ContactList.tsx` - Contact relationship display
- `useAutoGenerateName.ts` - Name generation logic

### Legacy Field References

**Search Results**: "company_id" found in:
- `ContactShow.tsx` (Lines 42-44, 58-60) - Using company_id instead of organization_id
- `OpportunityWorkflows.spec.tsx`
- `ActivityLogOpportunityCreated.tsx`
- `ActivityLogContactCreated.tsx`
- Various validation test files

**Action Required**: Global search/replace `company_id` → `organization_id` or appropriate organization relationship field.

### Filter Registry
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts` (Lines 76-101)

**Registered Filters**:
- All three organization relationship fields correctly registered
- `contact_ids` - Array field
- `tags` - Array field
- Enum fields: stage, status, priority, lead_source

---

## 3. Tasks Resource

### Database Schema (`tasks` table)
**Location**: `/home/krwhynot/Projects/atomic/src/types/database.generated.ts` (Lines 1306-1355)

**Key Fields**:
- `id: number`
- `title: string` (required)
- `description: string | null`
- `due_date: string | null`
- `reminder_date: string | null`
- `completed: boolean | null`
- `completed_at: string | null`
- `priority: any | null` - Enum type
- `type: any | null` - Enum type (task_type)
- `contact_id: number | null`
- `opportunity_id: number | null`
- `sales_id: number | null`

**DRIFT ISSUE**: Database uses `any` for enum types instead of proper TypeScript types.

### Zod Validation Schema
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tasks.ts` (Lines 1-149)

**Enum Schema** (Lines 14-23):
```typescript
export const taskTypeEnum = z.enum([
  'Call',
  'Email',
  'Meeting',
  'Follow-up',
  'Proposal',
  'Discovery',
  'Administrative',
  'None'
]);
```

**Schema Definition** (Lines 28-49):
```typescript
export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  contact_id: z.union([z.string().min(1), z.number().min(1)]),
  type: taskTypeEnum,
  due_date: z.string().min(1, "Due date is required"),
  sales_id: z.union([z.string().min(1), z.number().min(1)]),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium').optional(),
  opportunity_id: z.union([z.string(), z.number()]).nullable().optional(),
})
```

**Transform Functions** (Lines 121-148):
- `transformTaskDate()` - Converts dates to UTC ISO format
- `validateTaskForSubmission()` - Validates and transforms data

### UI Components

#### AddTask.tsx
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/tasks/AddTask.tsx` (Lines 36-194)

**Form Fields**:
- `title` - Required
- `description` - Optional
- `contact_id` - ReferenceInput (conditionally shown)
- `due_date` - Required, type="date"
- `type` - SelectInput from `taskTypes` config

**Default Values** (Lines 106-111):
```typescript
record={{
  type: "None",
  contact_id: contact?.id,
  due_date: new Date().toISOString().slice(0, 10),
  sales_id: identity.id,
}}
```

**Transform Logic** (Lines 112-119):
```typescript
transform={(data) => {
  const dueDate = new Date(data.due_date);
  dueDate.setHours(0, 0, 0, 0);
  return { ...data, due_date: dueDate.toISOString() };
}}
```

**DRIFT ISSUE**: Task types loaded from `ConfigurationProvider` instead of using Zod enum as single source of truth.

### Test Files Requiring Updates

1. **Validation tests** - `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/tasks/`
   - `transformation.test.ts`
   - `edge-cases.test.ts`
   - `integration.test.ts`
   - `validation.test.ts`

### Additional Component Files

**Files needing review**:
- `TaskEdit.tsx`
- `Task.tsx` - Individual task display
- `TasksIterator.tsx` - Task list rendering
- Dashboard task components:
  - `TasksList.tsx`
  - `TasksListEmpty.tsx`
  - `TasksListFilter.tsx`

### Filter Registry
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts` (Lines 145-157)

**DRIFT ISSUE**: Filter registry uses different field names:
- Registry: `text`, `done_date`
- Database: `title`, `completed_at`

**Correct Fields**:
```typescript
tasks: [
  "id",
  "title",        // NOT "text"
  "type",
  "contact_id",
  "organization_id",
  "opportunity_id",
  "due_date",
  "completed_at", // NOT "done_date"
  "completed",
  "sales_id",
  "created_at",
  "updated_at",
]
```

---

## 4. Organizations Resource

### Database Schema (`organizations` table)
**Location**: `/home/krwhynot/Projects/atomic/src/types/database.generated.ts` (Lines 623-723)

**Key Fields**:
- `id: number`
- `name: string` (required)
- `organization_type: any | null` - Enum type
- `is_principal: boolean | null`
- `is_distributor: boolean | null`
- `parent_organization_id: number | null`
- `priority: string | null`
- `segment_id: string | null` - **UUID type** (references segments table)
- `website: string | null`
- `linkedin_url: string | null`
- `phone: string | null`
- `email: string | null`
- `sales_id: number | null`

**Related Table**:
- `segments` table (Lines 1257-1276):
  - `id: string` - UUID primary key
  - `name: string` - Unique segment name
  - `created_at: string`
  - `created_by: string | null`

**DRIFT ISSUE**: `segment_id` is UUID foreign key, but legacy code may expect text field.

### Zod Validation Schema
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts` (Lines 1-169)

**Schema Definition** (Lines 50-80):
```typescript
export const organizationSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  segment_id: z.string().uuid().optional().nullable(), // UUID validation
  linkedin_url: isLinkedinUrl.optional(),
  website: isValidUrl.optional(),
  phone: z.string().optional(),
  postal_code: z.string().optional(), // was: zipcode
  state: z.string().optional(),       // was: stateAbbr
  organization_type: organizationTypeSchema, // Required
  is_principal: z.boolean().optional(),
  is_distributor: z.boolean().optional(),
  priority: companyPrioritySchema.optional(),
})
```

**Enum Schemas** (Lines 10-20):
- `organizationTypeSchema` - 6 types: customer, prospect, partner, principal, distributor, unknown
- `companyPrioritySchema` - 4 priorities: A, B, C, D

**CORRECT**: Validation properly uses UUID validation for segment_id.

### UI Components

#### OrganizationInputs.tsx
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationInputs.tsx` (Lines 14-211)

**Tabbed Interface** (Lines 27-43):
- **General Tab**: name, logo, organization_type, description, sales_id
- **Details Tab**: segment_id, priority, address, city, postal_code, state, phone
- **Other Tab**: website, linkedin_url, context_links

**Segment Input** (Lines 138-141):
```typescript
<SegmentComboboxInput
  source="segment_id"
  label="Segment"
/>
```

**CORRECT**: Uses SegmentComboboxInput component for segment selection.

### Test Files Requiring Updates

1. **OrganizationInputs.test.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationInputs.test.tsx`
2. **OrganizationList.spec.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationList.spec.tsx`
3. **OrganizationType.spec.tsx** - `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationType.spec.tsx`
4. **Validation tests** - `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/organizations/`

### Additional Component Files

**Files needing review**:
- `OrganizationShow.tsx`
- `OrganizationEdit.tsx`
- `OrganizationCreate.tsx`
- `OrganizationList.tsx`
- `OrganizationCard.tsx`
- `OrganizationAvatar.tsx`
- `OrganizationAside.tsx`
- `OrganizationListFilter.tsx`
- `AutocompleteOrganizationInput.tsx`
- `OrganizationType.tsx`

### Filter Registry
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts` (Lines 51-74)

**Registered Filters**:
- `segment_id` - Correctly registered as UUID field
- `organization_type` - Enum
- `priority` - Enum
- All address fields

---

## 5. Notes Resources (contactNotes/opportunityNotes)

### Database Schema
**Location**: `/home/krwhynot/Projects/atomic/src/types/database.generated.ts`

#### contactNotes Table (Lines 84-115)
**Key Fields**:
- `id: number`
- `contact_id: number` (required)
- `text: string` (required)
- `attachments: any[] | null` - JSONB array
- `sales_id: number | null`
- `date: string` (required)
- `created_at: string | null`
- `updated_at: string | null`

#### opportunityNotes Table (Lines 547-578)
**Key Fields**:
- `id: number`
- `opportunity_id: number` (required)
- `text: string` (required)
- `attachments: any[] | null` - JSONB array
- `sales_id: number | null`
- `date: string` (required)
- `created_at: string | null`
- `updated_at: string | null`

**DRIFT ISSUE**: Table names use camelCase (`contactNotes`, `opportunityNotes`) while other tables use snake_case.

### Zod Validation Schema
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/notes.ts` (Lines 1-269)

**Base Schema** (Lines 24-42):
```typescript
const baseNoteSchema = z.object({
  text: z.string().min(1, "Note text is required"),
  date: z.string().min(1, "Date is required"),
  sales_id: z.union([z.string().min(1), z.number().min(1)]),
  attachments: z.array(attachmentSchema).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})
```

**Resource-Specific Schemas** (Lines 47-62):
```typescript
export const contactNoteSchema = baseNoteSchema.extend({
  contact_id: z.union([z.string().min(1), z.number().min(1)]),
});

export const opportunityNoteSchema = baseNoteSchema.extend({
  opportunity_id: z.union([z.string().min(1), z.number().min(1)]),
});
```

**Helper Functions** (Lines 194-268):
- `validateAttachmentSize()` - 10MB default limit
- `validateAttachmentType()` - File extension validation
- `getCurrentDate()` - ISO timestamp
- `formatDateForInput()` - datetime-local format

### UI Components

#### NoteCreate.tsx
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/notes/NoteCreate.tsx` (Lines 1-103)

**Foreign Key Mapping** (Lines 18-21):
```typescript
const foreignKeyMapping = {
  contacts: "contact_id",
  opportunities: "opportunity_id",
};
```

**Usage Pattern**:
```typescript
<NoteCreate reference="contacts" />
<NoteCreate reference="opportunities" />
```

**Form Transform** (Lines 87-93):
```typescript
transform={(data) => ({
  ...data,
  [foreignKeyMapping[reference]]: record.id,
  sales_id: identity.id,
  date: data.date || getCurrentDate(),
})}
```

**DRIFT ISSUE**: Component uses "contacts"/"opportunities" as reference but database tables are "contactNotes"/"opportunityNotes".

### Test Files Requiring Updates

1. **Validation tests** - `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/notes/`
   - `transformation.test.ts`
   - `edge-cases.test.ts`
   - `integration.test.ts`
   - `validation.test.ts`

### Additional Component Files

**Files needing review**:
- `NotesIterator.tsx`
- `Note.tsx`
- `NoteInputs.tsx`
- `NoteAttachments.tsx`
- `StatusSelector.tsx`
- `utils.ts`
- Dashboard components:
  - `LatestNotes.tsx`

### Resource Configuration
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts` (Lines 22-24, 90-96)

**Resource Mapping**:
```typescript
RESOURCE_MAPPING = {
  contactNotes: "contactNotes",
  opportunityNotes: "opportunityNotes",
}

RESOURCE_LIFECYCLE_CONFIG = {
  contactNotes: { hasAttachments: true },
  opportunityNotes: { hasAttachments: true },
}
```

**CORRECT**: Resource names match database table names.

### Filter Registry
**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts` (Lines 160-182)

**DRIFT ISSUE**: Registry uses snake_case names but should match resource names:

**Current**:
```typescript
contact_notes: ["id", "contact_id", "text", "date", "status", "sales_id", ...]
opportunity_notes: ["id", "opportunity_id", "text", "date", "status", "sales_id", ...]
```

**Should be**:
```typescript
contactNotes: ["id", "contact_id", "text", "date", "sales_id", ...]
opportunityNotes: ["id", "opportunity_id", "text", "date", "sales_id", ...]
```

**Also remove**: "status" field (doesn't exist in schema)

---

## Cross-Resource Issues

### 1. TypeScript Type Generation

**Location**: `/home/krwhynot/Projects/atomic/src/types/database.generated.ts`

**Issues**:
- All enum types show as `any` instead of proper TypeScript enums
- JSONB fields show as `any` or `any[]` instead of typed interfaces
- Generated comment shows: `Generated at: 2025-10-09T02:46:17.796Z`

**Action Required**:
- Regenerate types with proper enum mapping
- Create TypeScript interfaces for JSONB structures (email, phone, attachments)

### 2. Validation Service Integration

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/ValidationService.ts`

**Resource Registry** (Lines 71-146):
All resources properly registered with create/update validators.

**Filter Validation** (Lines 195-235):
Validates filters against `filterableFields` registry to prevent stale cache errors.

**CORRECT**: Validation architecture follows Constitution #5 (single-point validation at API boundary).

### 3. Data Provider

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Key Methods**:
- `getList()` - Applies filter validation via `validationService.validateFilters()` (Line 256)
- `create()` / `update()` - Validates via `processForDatabase()` → `validateData()` (Lines 177, 427)
- `normalizeResponseData()` - Ensures JSONB fields are arrays (Lines 270, 288)

**CORRECT**: Unified provider properly integrates validation and normalization.

### 4. Form Default Values Pattern

**Location**: Multiple create/edit forms

**Constitution #5 Implementation**:
✅ **CORRECT**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx`
```typescript
const formDefaults = {
  ...opportunitySchema.partial().parse({}),
  opportunity_owner_id: identity?.id,
};
```

❌ **INCORRECT**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`
```typescript
<SelectInput source="stage" defaultValue="new_lead" />
<SelectInput source="priority" defaultValue="medium" />
```

**Action Required**: Remove all `defaultValue` props from inputs, use form-level `defaultValues` from schema.

---

## Remediation Checklist

### High Priority (Breaking Issues)

1. **Tasks Filter Registry** - Fix field name mismatches
   - [ ] Change `text` → `title`
   - [ ] Change `done_date` → `completed_at`
   - [ ] Add `completed` boolean field

2. **Notes Filter Registry** - Fix resource naming
   - [ ] Rename `contact_notes` → `contactNotes`
   - [ ] Rename `opportunity_notes` → `opportunityNotes`
   - [ ] Remove non-existent `status` field

3. **Contacts Display** - Fix organization references
   - [ ] Change `company_id` → `organization_id` in ContactShow.tsx (4 occurrences)
   - [ ] Update ReferenceField source attributes

4. **TypeScript Types** - Regenerate with proper enums
   - [ ] Run type generation with enum mapping
   - [ ] Create interfaces for JSONB structures
   - [ ] Update database.generated.ts

### Medium Priority (Consistency Issues)

5. **Opportunities Form Defaults** - Remove inline defaultValue props
   - [ ] OpportunityInputs.tsx - Remove defaultValue from SelectInputs
   - [ ] Ensure all defaults come from schema via formDefaults

6. **Global Search** - Legacy field references
   - [ ] Search codebase for `company_id` usage
   - [ ] Replace with appropriate organization relationship field
   - [ ] Update activity log components

7. **Task Type Configuration** - Use schema as source of truth
   - [ ] Load task types from Zod enum instead of ConfigurationProvider
   - [ ] Update useConfigurationContext to derive from validation/tasks.ts

### Low Priority (Documentation/Testing)

8. **Test Updates** - Align with schema changes
   - [ ] Update all validation tests
   - [ ] Update component tests for form defaults
   - [ ] Update integration tests for filter validation

9. **Documentation** - Schema drift prevention
   - [ ] Document type generation process
   - [ ] Add schema migration checklist
   - [ ] Update CLAUDE.md with type sync requirements

---

## Related Files Summary

### Validation Schemas
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tasks.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/notes.ts`

### Data Provider & Services
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/ValidationService.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/resources.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts`

### Type Definitions
- `/home/krwhynot/Projects/atomic/src/types/database.generated.ts`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/types.ts`

### Component Directories
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/` (22 files)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/` (33 files)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tasks/` (4 files)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/` (17 files)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/notes/` (8 files)

### Test Directories
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/contacts/`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/opportunities/`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/tasks/`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/organizations/`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/notes/`

---

## References

- Database schema: `/home/krwhynot/Projects/atomic/src/types/database.generated.ts`
- Engineering Constitution: `/home/krwhynot/Projects/atomic/CLAUDE.md`
- Filter validation: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts`
- Validation architecture: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/ValidationService.ts`
