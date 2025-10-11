# Validation System Architecture Research

Research conducted for schema drift remediation plan to align Zod validation schemas with current database schema.

## Overview

The Atomic CRM validation system follows Engineering Constitution principle #5: **Single validation at API boundary only** using Zod schemas. The architecture consists of three main layers: validation schemas (`src/atomic-crm/validation/`), ValidationService for enforcement, and integration with unifiedDataProvider. This research documents the current implementation patterns, integration points, and critical insights for updating schemas to match the database schema.

## Relevant Files

### Core Validation Infrastructure
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/ValidationService.ts` - Central validation registry and enforcement
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Data provider integration (lines 120-151, 171-183, 353-415)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/TransformService.ts` - Post-validation data transformation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts` - Filter field validation registry

### Validation Schemas (Single Source of Truth)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts` - Opportunity validation with enums and defaults
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts` - Contact validation with JSONB array fields
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts` - Organization validation with URL/LinkedIn validators
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tasks.ts` - Task validation with type enum and date transformation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/notes.ts` - Contact/opportunity notes with attachment validation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tags.ts` - Tag validation with semantic color transformation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/products.ts` - Product validation with category enums
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/segments.ts` - Segment validation (imported by organizations)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/index.ts` - Centralized export for all schemas

### Database Schema Reference
- `/home/krwhynot/Projects/atomic/src/types/database.generated.ts` - Generated TypeScript types from Supabase schema

### Test Infrastructure
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/opportunities/validation.test.ts` - Example test pattern
- Additional test files in `src/atomic-crm/validation/__tests__/` for contacts, organizations, tasks, tags, notes

## Architectural Patterns

### 1. Single Validation Point at API Boundary

**Pattern**: All validation occurs ONLY at the API boundary through `unifiedDataProvider.ts` before database operations.

**Implementation** (`unifiedDataProvider.ts` lines 120-151):
```typescript
async function validateData(
  resource: string,
  data: any,
  operation: "create" | "update" = "create",
): Promise<void> {
  try {
    await validationService.validate(resource, operation, data);
  } catch (error: any) {
    // Format errors for React Admin inline display
    throw {
      message: error.message || "Validation failed",
      errors: { fieldName: errorMessage }
    };
  }
}
```

**Key Insight**: Validation happens BEFORE transformation (lines 171-183), allowing validation of original field names (e.g., 'products') before transformation renames them (e.g., 'products_to_sync').

### 2. ValidationService Registry Pattern

**Pattern**: Central registry maps resources to validation functions with separate create/update logic.

**Implementation** (`ValidationService.ts` lines 71-146):
```typescript
private validationRegistry: Record<string, ValidationHandlers<unknown>> = {
  contacts: {
    create: async (data) => validateContactForm(data),
    update: async (data) => validateUpdateContact(data),
  },
  opportunities: {
    create: async (data) => validateCreateOpportunity(data),
    update: async (data) => validateUpdateOpportunity(data),
  },
  // ... other resources
}
```

**Registry Structure**:
- `contacts`, `organizations`, `opportunities` - Core entities with separate create/update validators
- `contactNotes`, `opportunityNotes` - Entity-specific notes
- `tasks`, `tags`, `segments`, `products` - Supporting entities
- `sales`, `activities`, `engagements`, `interactions` - Additional resources

### 3. Schema Structure Pattern (Three-Schema Approach)

**Pattern**: Each resource defines three related schemas for different operations.

**Implementation** (Example from `opportunities.ts` lines 54-162):
```typescript
// 1. Base schema with all fields and business rules
export const opportunitySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, "Opportunity name is required"),
  stage: opportunityStageSchema.nullable().default("new_lead"),
  // ... all fields with validation rules
});

// 2. Create-specific schema (stricter, no system fields)
export const createOpportunitySchema = opportunitySchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
  .required({
    name: true,
    contact_ids: true,
    estimated_close_date: true,
  });

// 3. Update-specific schema (more flexible, partial updates)
export const updateOpportunitySchema = opportunitySchema
  .partial()
  .required({ id: true });
```

### 4. Default Value Pattern (Form State Derived from Truth)

**Pattern**: Zod schemas define defaults using `.default()` method, which forms extract via `schema.partial().parse({})`.

**Implementation** (Example from `opportunities.ts` lines 70-82):
```typescript
stage: opportunityStageSchema.nullable().default("new_lead"),
priority: opportunityPrioritySchema.nullable().default("medium"),
estimated_close_date: z
  .string()
  .min(1, "Expected closing date is required")
  .default(() => new Date().toISOString().split("T")[0]),
index: z.number().default(0),
```

**Form Integration**: React Hook Form uses `defaultValues` generated from schema:
```typescript
const defaultValues = opportunitySchema.partial().parse({});
// Extracts: { stage: "new_lead", priority: "medium", index: 0, ... }
```

### 5. JSONB Array Field Pattern

**Pattern**: Contacts use JSONB arrays for emails/phones with nested validation.

**Implementation** (`contacts.ts` lines 34-42, 74):
```typescript
export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"),
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: personalInfoTypeSchema.default("Work"),
});

// In main schema:
email: z.array(emailAndTypeSchema).default([]),
phone: z.array(phoneNumberAndTypeSchema).default([]),
```

**Database Schema**: Fields are `any | null` in database types (JSONB columns).

### 6. Enum Validation Pattern

**Pattern**: Database enums are validated using `z.enum()` for type safety.

**Examples**:
- **Opportunities** (`opportunities.ts` lines 11-46): `stage`, `status`, `priority`, `lead_source`
- **Organizations** (`organizations.ts` lines 10-20): `organization_type`, `priority`
- **Tasks** (`tasks.ts` lines 14-23): `type` enum with 8 values
- **Products** (`products.ts` lines 9-39): `category`, `status`, `currency_code`

**Pattern Structure**:
```typescript
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  // ... all valid values
]);

// Use in main schema:
stage: opportunityStageSchema.nullable().default("new_lead"),
```

### 7. Custom Validator Pattern

**Pattern**: Complex validations use `.refine()` or custom validators with reusable logic.

**Examples**:

**URL Validation** (`organizations.ts` lines 23-45):
```typescript
const URL_REGEX = /^(http:\/\/www\.|https:\/\/www\.|...$/i;
const isValidUrl = z.string().refine(
  (url) => !url || URL_REGEX.test(url),
  { message: "Must be a valid URL" }
);

const isLinkedinUrl = z.string().refine(
  (url) => {
    if (!url) return true;
    return new URL(url).href.match(LINKEDIN_URL_REGEX);
  },
  { message: "URL must be from linkedin.com" }
);
```

**Legacy Field Detection** (`opportunities.ts` lines 100-113):
```typescript
.refine((data) => {
  if ("company_id" in data) {
    throw new Error(
      "Field 'company_id' is no longer supported. Use customer_organization_id..."
    );
  }
  return true;
});
```

### 8. Error Formatting Pattern

**Pattern**: Zod errors are transformed to React Admin's expected format for inline field display.

**Implementation** (Example from `opportunities.ts` lines 122-143):
```typescript
export async function validateOpportunityForm(data: any): Promise<void> {
  try {
    opportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });

      throw {
        message: "Validation failed",
        errors: formattedErrors, // { "field_name": "Error message" }
      };
    }
    throw error;
  }
}
```

**React Admin Integration**: Errors display inline next to form fields via `errors` object.

### 9. Filter Validation Pattern

**Pattern**: Separate registry validates filter parameters to prevent 400 errors from stale cached filters.

**Implementation** (`filterRegistry.ts` lines 21-182):
```typescript
export const filterableFields: Record<string, string[]> = {
  contacts: [
    "id", "first_name", "last_name", "email", "phone",
    "sales_id", "organization_id", "tags", "q", // ...
  ],
  opportunities: [
    "id", "name", "stage", "status", "priority",
    "contact_ids", "tags", "q", // ...
  ],
  // ... other resources
};

export function isValidFilterField(resource: string, filterKey: string): boolean {
  const baseField = filterKey.split('@')[0]; // Handle operators (@gte, @lte)
  return allowedFields.includes(baseField);
}
```

**Integration** (`ValidationService.ts` lines 185-235, `unifiedDataProvider.ts` lines 253-257):
```typescript
// In ValidationService
validateFilters(resource: string, filters: Record<string, any>): Record<string, any> {
  const allowedFields = filterableFields[resource];
  // Remove invalid fields, log warnings
  return cleanedFilters;
}

// In unifiedDataProvider.getList()
if (processedParams.filter) {
  processedParams.filter = validationService.validateFilters(resource, processedParams.filter);
}
```

### 10. Transformation Separation Pattern

**Pattern**: Validation happens FIRST, transformation SECOND (distinct services).

**Implementation** (`unifiedDataProvider.ts` lines 171-183):
```typescript
async function processForDatabase<T>(
  resource: string,
  data: Partial<T>,
  operation: "create" | "update" = "create",
): Promise<Partial<T>> {
  // CRITICAL: Validate FIRST (original field names)
  await validateData(resource, data, operation);

  // Then apply transformations (field renames, uploads, timestamps)
  const processedData = await transformData(resource, data, operation);

  return processedData;
}
```

**TransformService Responsibilities** (`TransformService.ts` lines 30-124):
- File uploads (avatars, logos, attachments)
- Field renames (e.g., `organizations` → `organizations_to_sync`)
- Timestamp addition for create operations
- Junction table data extraction

## Edge Cases & Gotchas

### 1. Validation Before Transformation (Critical Issue 0.4)

**Location**: `unifiedDataProvider.ts` lines 166-183

**Issue**: Previous implementation transformed data BEFORE validation, causing validation errors because field names changed (e.g., 'products' became 'products_to_sync').

**Solution**: Current implementation validates FIRST (original field names), then transforms SECOND.

**Rationale**: Allows validation of form field names (e.g., 'products') before transformation renames them for database operations.

### 2. React Admin Error Format

**Location**: `unifiedDataProvider.ts` lines 189-238

**Issue**: React Admin requires specific error format `{ message: string, errors: { field: string } }` for inline field display. Generic errors don't show next to fields.

**Solution**: All validation functions must catch `ZodError` and transform to React Admin format.

**Implementation**: Every validation function follows this pattern (see Error Formatting Pattern above).

### 3. Idempotent Delete Operations

**Location**: `unifiedDataProvider.ts` lines 202-206

**Issue**: React Admin's undoable mode updates UI before API call. If user rapidly deletes, API may receive delete for already-deleted resource.

**Solution**: Treat "resource not found" on delete as success:
```typescript
if (method === 'delete' && error.message?.includes('Cannot coerce to single JSON object')) {
  return { data: params.previousData };
}
```

### 4. Products Sync Requires previousData.products

**Location**: `unifiedDataProvider.ts` lines 436-442

**Issue**: Updating opportunity products requires `previousData.products` to diff changes. Missing this field causes errors.

**Solution**: Forms must use `meta.select` to fetch complete record with products array:
```typescript
if (!params.previousData?.products) {
  throw new Error(
    "Cannot update products: previousData.products is missing. " +
    "Ensure the form fetches the complete record with meta.select."
  );
}
```

### 5. Field Name Mismatches (Schema vs Database)

**Current Mismatches Identified**:

**Organizations** (`organizations.ts` lines 54-63):
- Schema: `segment_id` (UUID string) vs Database: `segment_id` (string)
- Schema: `phone` vs Database: `phone_number` → **RESOLVED**: DB uses `phone`
- Schema: `postal_code` vs Database: `zipcode` → **RESOLVED**: DB uses `postal_code`
- Schema: `state` vs Database: `stateAbbr` → **RESOLVED**: DB uses `state`

**Contacts** (`contacts.ts` lines 68-102):
- Schema has `first_name`, `last_name` separately
- TransformService combines into `name` field (line 84)
- Database has both `name` (required) and `first_name`/`last_name` (nullable)

### 6. Contact Email/Phone JSONB Validation

**Location**: `contacts.ts` lines 104-118

**Pattern**: Uses `.superRefine()` for array element validation:
```typescript
.superRefine((data, ctx) => {
  if (data.email && Array.isArray(data.email)) {
    data.email.forEach((entry: any, index: number) => {
      if (!emailSchema.safeParse(entry.email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email", index, "email"],
          message: "Must be a valid email address",
        });
      }
    });
  }
});
```

**Why Not Simple Validation**: Array elements need individual error paths for React Admin to show which email/phone entry is invalid.

### 7. Segments Get-or-Create Pattern

**Location**: `unifiedDataProvider.ts` lines 368-376

**Issue**: Segments use RPC function for get-or-create logic instead of standard create.

**Implementation**:
```typescript
if (resource === "segments") {
  const { data, error } = await supabase
    .rpc('get_or_create_segment', { p_name: processedData.name });

  if (error) throw error;
  return { data: data[0] }; // RPC returns array
}
```

**Validation**: Still uses standard Zod validation before RPC call.

### 8. Task Type Enum Capitalization

**Location**: `tasks.ts` lines 14-23

**Database Enum Values**: 'Call', 'Email', 'Meeting', 'Follow-up', 'Proposal', 'Discovery', 'Administrative', 'None' (capitalized)

**Pattern**: Zod enum must match database enum exactly (case-sensitive):
```typescript
export const taskTypeEnum = z.enum([
  'Call', 'Email', 'Meeting', // Capital first letter
  'Follow-up', 'Proposal', 'Discovery',
  'Administrative', 'None'
]);
```

### 9. Tags Semantic Color Transformation

**Location**: `tags.ts` lines 17-50

**Pattern**: Accepts legacy hex values and transforms to semantic colors:
```typescript
const semanticColorSchema = z.string()
  .refine((value) => {
    // Accept semantic colors OR legacy hex values
    return VALID_TAG_COLORS.includes(value) ||
           HEX_TO_SEMANTIC_MAP[value.toLowerCase()];
  })
  .transform((value) => {
    // Transform hex to semantic, or return semantic as-is
    return VALID_TAG_COLORS.includes(value)
      ? value
      : HEX_TO_SEMANTIC_MAP[value.toLowerCase()] || "gray";
  });
```

**Rationale**: Ensures Constitution principle #8 (semantic colors only) while supporting migration from hex colors.

### 10. Filter Validation Prevents 400 Errors

**Location**: `ValidationService.ts` lines 185-235

**Issue**: After schema migrations, stale cached filters in localStorage reference non-existent columns, causing 400 errors from Supabase.

**Solution**: Filter validation runs BEFORE API calls to clean invalid filters:
```typescript
// CRITICAL: Validate and clean filters BEFORE applying search parameters
if (processedParams.filter) {
  processedParams.filter = validationService.validateFilters(
    resource,
    processedParams.filter
  );
}
```

**Example**: After removing `nb_tasks` from contacts table, filter validation prevents `{ nb_tasks@gte: 0 }` from reaching the API.

## Validation-to-Database Schema Alignment

### Critical Schema Mapping Requirements

**Opportunities**:
- ✅ `stage`, `status`, `priority` - Enums match database
- ✅ `contact_ids` - Array field matches database
- ❌ `amount`, `probability` fields in validation but NOT in current database schema (lines 452-483)
- ✅ `customer_organization_id`, `principal_organization_id`, `distributor_organization_id` - Match database
- ✅ `lead_source` - Added to schema (line 482) and validation (line 81)

**Organizations**:
- ✅ `segment_id` - UUID field matches database
- ✅ `organization_type` - Required field matches database (line 68)
- ⚠️ Schema validation makes `organization_type` required, but database allows nullable

**Contacts**:
- ✅ `email`, `phone` - JSONB array fields match database
- ✅ `name` field - Added by TransformService, matches database requirement
- ✅ `organization_id` - Simplified single organization field matches database
- ❌ Validation has `has_newsletter` field (line 79) - verify if database has this column

**Tasks**:
- ✅ `type` enum - Matches database enum exactly (capitalization critical)
- ✅ `title`, `contact_id`, `due_date`, `sales_id` - Required fields match database
- ✅ Date transformation ensures ISO format (lines 117-125)

**Products**:
- ✅ `category`, `status` enums - Match database enums
- ✅ `principal_id` - Required field matches database
- ✅ `currency_code`, `unit_of_measure`, `minimum_order_quantity` - B2B fields match database

**Tags**:
- ✅ Color semantic validation - Enforces Constitution principle #8
- ✅ `name`, `color` - Match database fields
- ⚠️ Schema uses `createdAt`, `updatedAt` (camelCase) vs database `created_at`, `updated_at` (snake_case)

**Notes (Contact/Opportunity)**:
- ✅ `text`, `date`, `sales_id` - Required fields match database
- ✅ `attachments` - JSONB array field matches database
- ✅ Entity ID fields (`contact_id`, `opportunity_id`) match database

## Relevant Documentation

### Internal Documentation
- Engineering Constitution in `/home/krwhynot/Projects/atomic/CLAUDE.md`
  - Principle #4: Validation - Zod schemas at API boundary only
  - Principle #5: Form state derived from truth - `.default()` in Zod schemas
  - Principle #2: Single source of truth - One data provider (Supabase)

### Previous Research Documents
- `/home/krwhynot/Projects/atomic/.docs/plans/X-consolidate-data-providers/validation-research.docs.md` - Data provider validation patterns
- `/home/krwhynot/Projects/atomic/.docs/plans/X-fresh-start-migration/validation-research.docs.md` - Validation layer design
- `/home/krwhynot/Projects/atomic/.docs/plans/X-organization-pipeline-migration/validation-data-provider.docs.md` - Organization validation specifics

### External References
- Zod Documentation: https://zod.dev/
- React Admin Validation: https://marmelab.com/react-admin/Validation.html
- Supabase PostgreSQL Types: https://supabase.com/docs/guides/database/tables

## Implementation Checklist for Schema Drift Remediation

### 1. Database Schema Audit
- [ ] Generate fresh TypeScript types using `mcp__supabase-lite__generate_typescript_types`
- [ ] List all tables using `mcp__supabase-lite__list_tables`
- [ ] Execute SQL to get enum types: `SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid`
- [ ] Document all JSONB columns and their expected structure

### 2. Validation Schema Updates
- [ ] Opportunities: Remove `amount`, `probability` fields if not in database (or add to database)
- [ ] Organizations: Verify `organization_type` nullability matches business requirements
- [ ] Contacts: Verify `has_newsletter` field exists in database
- [ ] Tags: Align `createdAt`/`updatedAt` naming with database `created_at`/`updated_at`
- [ ] Update all enum schemas to match exact database enum values (case-sensitive)

### 3. Filter Registry Updates
- [ ] Update `filterableFields` in `filterRegistry.ts` to match current database columns
- [ ] Remove any deprecated fields (e.g., `nb_tasks` from contacts)
- [ ] Add new filterable fields from recent schema changes
- [ ] Test filter validation with `npm test` - filter-related tests

### 4. Validation Test Updates
- [ ] Update test fixtures to match new database schema
- [ ] Add tests for new required fields
- [ ] Add tests for new enum values
- [ ] Verify default value tests still pass
- [ ] Run full validation test suite: `npm test -- src/atomic-crm/validation/__tests__`

### 5. Form Default Value Verification
- [ ] Verify `schema.partial().parse({})` extracts expected defaults
- [ ] Test forms initialize with correct default values
- [ ] Verify required fields show validation errors on submit

### 6. Integration Testing
- [ ] Test create operations for each resource
- [ ] Test update operations for each resource
- [ ] Test validation error display in React Admin forms
- [ ] Test filter validation prevents 400 errors
- [ ] Test transformation service still works after validation

### 7. Documentation Updates
- [ ] Update validation schema JSDoc comments with current field descriptions
- [ ] Document any breaking changes in validation
- [ ] Update CLAUDE.md if validation patterns change
- [ ] Add migration notes for deprecated fields

## Key Functions and Methods

**ValidationService** (`ValidationService.ts`):
- `validate(resource, method, data)` - Main validation entry point (lines 155-173)
- `hasValidation(resource)` - Check if resource has validation (lines 180-182)
- `validateFilters(resource, filters)` - Clean invalid filter fields (lines 195-235)

**Data Provider Integration** (`unifiedDataProvider.ts`):
- `validateData(resource, data, operation)` - Validate and format errors (lines 120-151)
- `processForDatabase(resource, data, operation)` - Validate then transform (lines 171-183)
- `create(resource, params)` - Create with validation (lines 353-415)
- `update(resource, params)` - Update with validation (lines 418-484)

**Validation Functions** (per schema file):
- `validateContactForm(data)` - Contact validation wrapper
- `validateCreateOpportunity(data)` - Create-specific validation
- `validateUpdateOpportunity(data)` - Update-specific validation
- Pattern repeats for all resources

**Schema Utilities** (per schema file):
- Base schema (e.g., `opportunitySchema`) - All fields with validation
- Create schema (e.g., `createOpportunitySchema`) - Omit system fields, enforce required
- Update schema (e.g., `updateOpportunitySchema`) - Partial with ID required

## Summary

The validation system is architecturally sound with clear separation of concerns:
1. **Zod schemas** define validation rules and defaults (single source of truth)
2. **ValidationService** enforces validation via registry pattern
3. **unifiedDataProvider** integrates validation at API boundary (before transformation)
4. **TransformService** handles post-validation data mutations

**Critical for Schema Drift Remediation**:
- Validation schemas must exactly match database schema (field names, types, nullability)
- Enum schemas must match database enums exactly (case-sensitive)
- Filter registry must reflect current database columns
- Default values in schemas drive form initialization
- All validation functions must return React Admin error format
- Validation must happen BEFORE transformation to support field renames

**Next Steps**:
1. Audit database schema using Supabase Lite MCP tools
2. Compare current validation schemas against database schema
3. Update validation schemas to match database (field names, types, enums)
4. Update filter registry to remove deprecated fields
5. Run test suite to verify changes
6. Test forms to ensure default values and validation work correctly
