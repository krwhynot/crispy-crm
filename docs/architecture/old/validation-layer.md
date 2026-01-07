# Validation Layer

> Generated: 2025-12-22
> Schema Files: 18 | Total Schemas: 98

## Validation Architecture

Zod validation happens at the **API boundary only** - never in forms. This is enforced by the Engineering Constitution.

```
┌─────────────┐     ┌────────────────┐     ┌──────────────┐
│ React Admin │────▶│ ValidationService │────▶│ Zod Schema   │
│ Form Submit │     │ (API Boundary)    │     │ .parse()     │
└─────────────┘     └────────────────┘     └──────────────┘
                            │
                    ┌───────▼───────┐
                    │ ZodError →     │
                    │ RA Field Errors│
                    └───────────────┘
```

## Security Principles

### strictObject Usage
**Prevents mass assignment attacks** - only explicitly defined fields are allowed.

#### Compliant Files
- activities.ts
- categories.ts
- contacts.ts (main schemas)
- distributorAuthorizations.ts (main schemas)
- notes.ts
- operatorSegments.ts
- opportunities.ts
- organizationDistributors.ts
- organizations.ts
- productDistributors.ts
- products.ts
- quickAdd.ts
- rpc.ts
- sales.ts
- segments.ts
- tags.ts
- task.ts

#### Documented Exceptions
1. **contacts.ts** - `importContactSchema`
   - Reason: CSV import flexibility requires unknown keys
   - Uses: `z.object()` instead of `z.strictObject()`

2. **distributorAuthorizations.ts** - `specialPricingSchema`
   - Reason: Flexible JSONB pricing data
   - Uses: `z.object().passthrough()`

### Additional Security Patterns
- **Coercion:** `z.coerce` for all non-string form inputs (dates, numbers, booleans)
- **Max Length:** All strings have `.max()` constraints (DoS prevention)
- **Allowlist:** `z.enum()` for constrained values (never denylist patterns)

---

## Schema Reference

### validation/activities.ts

**Location:** `src/atomic-crm/validation/activities.ts`

**Schemas:**
- **activityTypeSchema**: `z.enum` (2 values: engagement, interaction)
  - Exported types: `ActivityType`

- **interactionTypeSchema**: `z.enum` (13 values: call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note, sample)
  - Exported types: `InteractionType`

- **sampleStatusSchema**: `z.enum` (4 values: sent, received, feedback_pending, feedback_received)
  - Exported types: `SampleStatus`

- **sentimentSchema**: `z.enum` (3 values: positive, neutral, negative)
  - Exported types: `Sentiment`

- **baseActivitiesSchema**: `z.strictObject`
  - Field count: 24
  - Base schema without refinements, extensible

- **activitiesSchema**: `z.strictObject with superRefine`
  - Exported types: `ActivitiesInput`, `Activities`, `ActivityRecord`
  - Cross-field validations: opportunity_id required for interactions, contact/organization required, follow_up_date when follow_up_required, sample_status when type is sample

- **engagementsSchema**: `z.strictObject with superRefine`
  - Exported types: `EngagementsInput`, `Engagements`
  - Specialized for engagement activities (no opportunity)

- **interactionsSchema**: `z.strictObject with superRefine`
  - Exported types: `InteractionsInput`, `Interactions`
  - Specialized for opportunity interactions (requires opportunity_id)

- **activityNoteFormSchema**: `z.strictObject`
  - Exported types: `ActivityNoteFormData`
  - Simplified schema for quick note capture

- **quickLogFormSchema**: `z.object with refine`
  - Exported types: `QuickLogFormInput`, `QuickLogFormOutput`, `ActivityLogInput`, `ActivityLog`
  - UI-friendly version with Title Case activity types

### validation/contacts.ts

**Location:** `src/atomic-crm/validation/contacts.ts`

**Schemas:**
- **personalInfoTypeSchema**: `z.enum` (3 values: work, home, other)

- **contactDepartmentSchema**: `z.enum` (7 values: senior_management, sales_management, district_management, area_sales, sales_specialist, sales_support, procurement)
  - Exported types: `ContactDepartment`

- **emailAndTypeSchema**: `z.strictObject`
  - Fields: value (email string), type (personalInfoTypeSchema)
  - For JSONB email arrays

- **phoneNumberAndTypeSchema**: `z.strictObject`
  - Fields: value (phone string), type (personalInfoTypeSchema)
  - For JSONB phone arrays

- **contactOrganizationSchema**: `z.strictObject with superRefine`
  - Exported types: `ContactOrganization`
  - Junction table for contact-organization relationships

- **contactBaseSchema**: `z.strictObject`
  - Field count: 35
  - Core contact fields with UI inputs

- **contactSchema**: `z.strictObject with transform`
  - Exported types: `ContactInput`, `Contact`
  - Computes name from first_name + last_name, validates email array

- **importContactSchema**: `z.object with superRefine`
  - Exported types: `ImportContactInput`
  - Security note: Uses z.object (not strictObject) for CSV import flexibility

- **createContactSchema**: `z.strictObject with transform`
  - Stricter requirements: name, sales_id, organization_id required

- **updateContactSchema**: `z.strictObject partial with transform`
  - Flexible partial updates

### validation/opportunities.ts

**Location:** `src/atomic-crm/validation/opportunities.ts`

**Schemas:**
- **opportunityStageSchema**: `z.enum` (7 values: new_lead, initial_outreach, sample_visit_offered, feedback_logged, demo_scheduled, closed_won, closed_lost)
  - Exported types: `OpportunityStageValue`

- **opportunityPrioritySchema**: `z.enum` (4 values: low, medium, high, critical)
  - Exported types: `OpportunityPriority`

- **leadSourceSchema**: `z.enum` (8 values: referral, trade_show, website, cold_call, email_campaign, social_media, partner, existing_customer)
  - Exported types: `LeadSource`

- **winReasonSchema**: `z.enum` (5 values: relationship, product_quality, price_competitive, timing, other)
  - Exported types: `WinReason`

- **lossReasonSchema**: `z.enum` (7 values: price_too_high, no_authorization, competitor_relationship, product_fit, timing, no_response, other)
  - Exported types: `LossReason`

- **opportunityBaseSchema**: `z.strictObject`
  - Field count: 26
  - Core opportunity fields

- **opportunitySchema**: `z.strictObject`
  - Exported types: `OpportunityInput`, `Opportunity`
  - Main schema with business logic defaults

- **createOpportunitySchema**: `z.strictObject.omit.extend`
  - Salesforce standard: customer_organization_id required
  - Principal optional (can be enriched later)

- **quickCreateOpportunitySchema**: `z.strictObject`
  - Exported types: `QuickCreateOpportunityInput`
  - Minimal schema for Kanban quick-add

- **updateOpportunitySchema**: `z.strictObject.partial with refines`
  - Validates contact_ids, win_reason, loss_reason based on stage

- **closeOpportunitySchema**: `z.strictObject with refines`
  - Exported types: `CloseOpportunityInput`
  - Dedicated schema for CloseOpportunityModal

### validation/organizations.ts

**Location:** `src/atomic-crm/validation/organizations.ts`

**Schemas:**
- **organizationTypeSchema**: `z.enum` (4 values: customer, prospect, principal, distributor)
  - Exported types: `OrganizationType`

- **organizationPrioritySchema**: `z.enum` (4 values: A, B, C, D)
  - Exported types: `OrganizationPriority`

- **orgScopeSchema**: `z.enum` (3 values: national, regional, local)
  - Exported types: `OrgScope`

- **orgStatusSchema**: `z.enum` (2 values: active, inactive)
  - Exported types: `OrgStatus`

- **orgStatusReasonSchema**: `z.enum` (6 values: active_customer, prospect, authorized_distributor, account_closed, out_of_business, disqualified)
  - Exported types: `OrgStatusReason`

- **paymentTermsSchema**: `z.enum` (6 values: net_30, net_60, net_90, cod, prepaid, 2_10_net_30)
  - Exported types: `PaymentTerms`

- **organizationSchema**: `z.strictObject`
  - Field count: 43
  - Exported types: `OrganizationInput`, `Organization`
  - Comprehensive organization validation

- **createOrganizationSchema**: `z.strictObject.omit.required`
  - Omits system-managed fields, requires name

- **updateOrganizationSchema**: `z.strictObject.partial.required`
  - Requires id, all other fields optional

### validation/notes.ts

**Location:** `src/atomic-crm/validation/notes.ts`

**Schemas:**
- **attachmentSchema**: `z.strictObject`
  - Exported types: `Attachment`
  - Fields: src, title, type, size

- **baseNoteSchema**: `z.strictObject`
  - Field count: 7
  - Common fields for all note types

- **contactNoteSchema**: `baseNoteSchema.extend`
  - Exported types: `ContactNote`
  - Extends base with contact_id

- **opportunityNoteSchema**: `baseNoteSchema.extend`
  - Exported types: `OpportunityNote`
  - Extends base with opportunity_id

- **organizationNoteSchema**: `baseNoteSchema.extend`
  - Exported types: `OrganizationNote`
  - Extends base with organization_id

- **createContactNoteSchema**: `contactNoteSchema.omit`
  - Exported types: `CreateContactNoteInput`

- **updateContactNoteSchema**: `contactNoteSchema.partial.required`
  - Exported types: `UpdateContactNoteInput`

- **createOpportunityNoteSchema**: `opportunityNoteSchema.omit`
  - Exported types: `CreateOpportunityNoteInput`

- **updateOpportunityNoteSchema**: `opportunityNoteSchema.partial.required`
  - Exported types: `UpdateOpportunityNoteInput`

- **createOrganizationNoteSchema**: `organizationNoteSchema.omit`
  - Exported types: `CreateOrganizationNoteInput`

- **updateOrganizationNoteSchema**: `organizationNoteSchema.partial.required`
  - Exported types: `UpdateOrganizationNoteInput`

### validation/products.ts

**Location:** `src/atomic-crm/validation/products.ts`

**Schemas:**
- **productCategorySchema**: `z.string with validation`
  - Accepts any non-empty string (flexible category system)

- **productStatusSchema**: `z.enum` (3 values: active, discontinued, coming_soon)

- **productSchema**: `z.strictObject`
  - Field count: 12
  - Exported types: `ProductFormData`
  - Main product validation

- **productUpdateSchema**: `productSchema.strip()`
  - Allows updates without strict validation

- **opportunityProductSchema**: `z.strictObject`
  - Exported types: `OpportunityProduct`
  - Line items for opportunity-products junction

### validation/sales.ts

**Location:** `src/atomic-crm/validation/sales.ts`

**Schemas:**
- **UserRoleEnum**: `z.enum` (3 values: admin, manager, rep)
  - Exported types: `UserRole`

- **salesSchema**: `z.strictObject`
  - Field count: 16
  - Exported types: `SalesInput`, `Sales`, `Sale`, `SalesRole`
  - Main sales/user validation

- **createSalesSchema**: `salesSchema.omit.extend.required`
  - Industry-standard invite flow: name/email/role required, password optional

- **updateSalesSchema**: `salesSchema.partial.required`
  - Requires id, all other fields optional

- **userInviteSchema**: `z.strictObject`
  - Exported types: `UserInvite`
  - For inviting new users via email

- **userUpdateSchema**: `z.strictObject`
  - Exported types: `UserUpdate`
  - For updating existing users

- **salesProfileSchema**: `z.strictObject with transforms`
  - Exported types: `SalesProfileFormData`
  - Form defaults for profile tab

- **salesPermissionsSchema**: `z.strictObject`
  - Exported types: `SalesPermissionsFormData`
  - Form defaults for permissions tab

### validation/task.ts

**Location:** `src/atomic-crm/validation/task.ts`

**Schemas:**
- **taskTypeSchema**: `z.enum` (7 values: Call, Email, Meeting, Follow-up, Demo, Proposal, Other)
  - Exported types: `TaskType`

- **priorityLevelSchema**: `z.enum` (4 values: low, medium, high, critical)
  - Exported types: `PriorityLevel`

- **taskSchema**: `z.strictObject`
  - Field count: 18
  - Exported types: `Task`
  - Core task validation

- **taskCreateSchema**: `taskSchema.omit`
  - Exported types: `CreateTaskInput`
  - Omits system-managed fields

- **taskUpdateSchema**: `taskSchema.partial.passthrough.required`
  - Exported types: `UpdateTaskInput`
  - Uses passthrough() for computed fields from views

### validation/tags.ts

**Location:** `src/atomic-crm/validation/tags.ts`

**Schemas:**
- **semanticColorSchema**: `z.string with refine and transform`
  - Validates semantic color names, maps legacy hex values

- **tagSchema**: `z.strictObject`
  - Field count: 5
  - Exported types: `Tag`
  - Base tag validation

- **createTagSchema**: `tagSchema.omit.extend`
  - Exported types: `CreateTagInput`
  - Default color: "warm"

- **updateTagSchema**: `tagSchema.partial.required.omit`
  - Exported types: `UpdateTagInput`

- **tagWithCountSchema**: `tagSchema.extend`
  - Exported types: `TagWithCount`
  - Tag with usage count

- **tagFilterSchema**: `z.strictObject`
  - Exported types: `TagFilterOptions`
  - Filter options for tags

### validation/segments.ts

**Location:** `src/atomic-crm/validation/segments.ts`

**Schemas:**
- **playbookCategorySchema**: `z.enum` (9 values: Major Broadline, Specialty/Regional, Management Company, GPO, University, Restaurant Group, Chain Restaurant, Hotel & Aviation, Unknown)
  - Exported types: `PlaybookCategory`
  - Fixed playbook categories for distributor classification

- **segmentSchema**: `z.strictObject`
  - Field count: 7
  - Exported types: `Segment`
  - Base segment validation

- **playbookSegmentSchema**: `segmentSchema.extend`
  - Restricts name to playbook enum, segment_type to 'playbook'

- **createSegmentSchema**: `segmentSchema.omit`
  - Exported types: `CreateSegmentInput`
  - Deprecated: use fixed categories

- **updateSegmentSchema**: `segmentSchema.partial.required.omit`
  - Exported types: `UpdateSegmentInput`
  - Deprecated: use fixed categories

### validation/distributorAuthorizations.ts

**Location:** `src/atomic-crm/validation/distributorAuthorizations.ts`

**Schemas:**
- **distributorAuthorizationSchema**: `z.strictObject with refine`
  - Field count: 12
  - Exported types: `DistributorAuthorization`, `DistributorAuthorizationInput`, `DistributorAuthorizationWithNames`
  - Tracks principal authorization through distributors

- **specialPricingSchema**: `z.object with passthrough`
  - Security note: Uses passthrough for flexible JSONB pricing data

- **productDistributorAuthorizationSchema**: `z.strictObject with refine`
  - Exported types: `ProductDistributorAuthorization`, `ProductDistributorAuthorizationInput`, `ProductDistributorAuthorizationWithNames`
  - Product-level authorization overrides

- **createDistributorAuthorizationSchema**: `distributorAuthorizationSchema.innerType.omit`

- **updateDistributorAuthorizationSchema**: `distributorAuthorizationSchema.innerType.partial.required`

- **createProductDistributorAuthorizationSchema**: `productDistributorAuthorizationSchema.innerType.omit`

- **updateProductDistributorAuthorizationSchema**: `productDistributorAuthorizationSchema.innerType.partial.required`

### validation/productDistributors.ts

**Location:** `src/atomic-crm/validation/productDistributors.ts`

**Schemas:**
- **productDistributorStatusSchema**: `z.enum` (3 values: pending, active, inactive)
  - Exported types: `ProductDistributorStatus`

- **productDistributorSchema**: `z.strictObject`
  - Field count: 9
  - Exported types: `ProductDistributor`, `ProductDistributorInput`
  - Junction table with vendor item codes

- **createProductDistributorSchema**: `productDistributorSchema.omit.required`
  - Requires both product_id and distributor_id

- **updateProductDistributorSchema**: `productDistributorSchema.partial.omit`
  - FKs immutable after creation

### validation/operatorSegments.ts

**Location:** `src/atomic-crm/validation/operatorSegments.ts`

**Schemas:**
- **operatorSegmentSchema**: `z.enum` (43 values: all parent and child segments)
  - Exported types: `OperatorSegment`

- **operatorParentSegmentSchema**: `z.enum` (16 values: top-level categories)
  - Exported types: `OperatorParentSegment`

- **operatorChildSegmentSchema**: `z.enum` (14 values: sub-classifications)
  - Exported types: `OperatorChildSegment`

- **operatorSegmentRecordSchema**: `z.strictObject`
  - Exported types: `OperatorSegmentRecord`
  - Full segment record with metadata

- **createOperatorSegmentSchema**: `operatorSegmentRecordSchema.omit`
  - Exported types: `CreateOperatorSegmentInput`
  - Deprecated: use fixed categories

- **updateOperatorSegmentSchema**: `operatorSegmentRecordSchema.partial.required.omit`
  - Exported types: `UpdateOperatorSegmentInput`
  - Deprecated: use fixed categories

### validation/organizationDistributors.ts

**Location:** `src/atomic-crm/validation/organizationDistributors.ts`

**Schemas:**
- **organizationDistributorSchema**: `z.strictObject with refine`
  - Field count: 9
  - Exported types: `OrganizationDistributor`, `OrganizationDistributorInput`, `OrganizationDistributorWithNames`
  - Tracks which distributors serve which customers

- **createOrganizationDistributorSchema**: `organizationDistributorSchema.innerType.omit`

- **updateOrganizationDistributorSchema**: `organizationDistributorSchema.innerType.partial.required`

### validation/rpc.ts

**Location:** `src/atomic-crm/validation/rpc.ts`

**Schemas:**
- **getOrCreateSegmentParamsSchema**: `z.strictObject`
  - For RPC: get_or_create_segment

- **setPrimaryOrganizationParamsSchema**: `z.strictObject`
  - For RPC: set_primary_organization

- **archiveOpportunityWithRelationsParamsSchema**: `z.strictObject`
  - For RPC: archive_opportunity_with_relations

- **unarchiveOpportunityWithRelationsParamsSchema**: `z.strictObject`
  - For RPC: unarchive_opportunity_with_relations

- **syncOpportunityWithProductsParamsSchema**: `z.strictObject`
  - For RPC: sync_opportunity_with_products

- **checkAuthorizationParamsSchema**: `z.strictObject`
  - Exported types: `CheckAuthorizationParams`
  - For RPC: check_authorization

- **checkAuthorizationResponseSchema**: `z.strictObject`
  - Exported types: `CheckAuthorizationResponse`
  - Response validation for check_authorization

- **checkAuthorizationBatchParamsSchema**: `z.strictObject`
  - Exported types: `CheckAuthorizationBatchParams`
  - For RPC: check_authorization_batch

- **checkAuthorizationBatchResponseSchema**: `z.strictObject`
  - Exported types: `CheckAuthorizationBatchResponse`
  - Response validation for batch authorization

### validation/quickAdd.ts

**Location:** `src/atomic-crm/validation/quickAdd.ts`

**Schemas:**
- **quickAddSchema**: `z.strictObject with refine`
  - Field count: 11
  - Exported types: `QuickAddInput`
  - Atomic creation of organization + contact + opportunity
  - Cross-field validation: phone OR email required

### validation/categories.ts

**Location:** `src/atomic-crm/validation/categories.ts`

**Schemas:**
- **categorySchema**: `z.strictObject`
  - Exported types: `Category`
  - For distinct_product_categories view

### validation/constants.ts

**Location:** `src/atomic-crm/validation/constants.ts`

**Schemas:**
- **VALIDATION_LIMITS**: `const object`
  - Purpose: Central validation constants for DoS prevention
  - Exported types: `ValidationLimitKey`
  - Contains: EMAIL_MAX (254), PHONE_MAX (30), URL_MAX (2000), NAME_MAX (100), etc.

---

## Core Schema Patterns

### 1. Base + Extension Pattern
```typescript
const baseSchema = z.strictObject({
  id: z.coerce.number().optional(),
  name: z.string().max(255),
  // ... common fields
});

const createSchema = baseSchema.omit({ id: true });
const updateSchema = baseSchema.partial().required({ id: true });
```

**Used in:** contacts, opportunities, organizations, sales, tasks

### 2. Enum Schemas
Used for constrained values like stages, priorities, types.
```typescript
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  // ... 7 total stages
]);
export type OpportunityStageValue = z.infer<typeof opportunityStageSchema>;
```

**Used in:** activities, contacts, opportunities, organizations, sales, tasks, tags, segments

### 3. Form-Specific Schemas
Schemas ending in `FormSchema` or `FormData` are for UI components.
```typescript
export const salesProfileSchema = z.strictObject({
  first_name: z.string().max(100).nullish().transform(v => v ?? ''),
  // ... form-specific transforms
});
```

**Used in:** activities (activityNoteFormSchema, quickLogFormSchema), sales (salesProfileSchema, salesPermissionsSchema)

### 4. RPC Schemas (validation/rpc.ts)
Schemas for Supabase RPC function parameters and responses.
```typescript
export const checkAuthorizationParamsSchema = z.strictObject({
  _distributor_id: z.number().int().positive(),
  _principal_id: z.number().int().positive().optional().nullable(),
  _product_id: z.number().int().positive().optional().nullable(),
});
```

**RPC Functions:** get_or_create_segment, set_primary_organization, archive_opportunity_with_relations, check_authorization, check_authorization_batch

---

## Adding a New Schema

Follow these steps to add a new resource validation schema:

### Step 1: Create file
```bash
src/atomic-crm/validation/[resource].ts
```

### Step 2: Define base schema
```typescript
import { z } from "zod";

export const [resource]Schema = z.strictObject({
  id: z.coerce.number().optional(),
  name: z.string().trim().min(1).max(255),
  // Add all fields with .max() on strings
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  deleted_at: z.string().max(50).optional().nullable(),
});
```

### Step 3: Use z.coerce for form inputs
```typescript
// Dates
due_date: z.coerce.date(),

// Numbers
count: z.coerce.number().int().positive(),

// Booleans
is_active: z.coerce.boolean().default(true),
```

### Step 4: Use z.enum for constrained values
```typescript
export const statusSchema = z.enum(['active', 'inactive', 'pending']);
export type Status = z.infer<typeof statusSchema>;
```

### Step 5: Export types via z.infer
```typescript
export type [Resource]Input = z.input<typeof [resource]Schema>;
export type [Resource] = z.infer<typeof [resource]Schema>;
```

### Step 6: Export validation function
```typescript
export async function validate[Resource]Form(data: unknown): Promise<void> {
  try {
    [resource]Schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        body: { errors: formattedErrors },
      };
    }
    throw error;
  }
}
```

### Step 7: Add to validation/index.ts exports
```typescript
export * from './[resource]';
```

### Step 8: Wire to ValidationService
In `src/atomic-crm/providers/supabase/services/ValidationService.ts`:

```typescript
import { validate[Resource]Form } from '@/atomic-crm/validation/[resource]';

private validators: Record<string, ValidationFunction> = {
  // ...
  [resource]: validate[Resource]Form,
};
```

### Step 9: Create operation-specific schemas
```typescript
// Create schema (omit system fields)
export const create[Resource]Schema = [resource]Schema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

// Update schema (partial, require ID)
export const update[Resource]Schema = [resource]Schema
  .partial()
  .required({ id: true });
```

---

## Type Export Conventions

| Convention | Use Case | Example |
|-----------|----------|---------|
| `[Resource]Input` | Form input type (may have optional fields) | `OpportunityInput` |
| `[Resource]` | Validated output type (complete record) | `Opportunity` |
| `Create[Resource]Input` | For create operations | `CreateOpportunityInput` |
| `Update[Resource]Input` | For update operations (partial) | `UpdateOpportunityInput` |

### Enum Type Exports
```typescript
export const opportunityStageSchema = z.enum([...]);
export type OpportunityStageValue = z.infer<typeof opportunityStageSchema>;
```

### Composite Types
```typescript
export interface DistributorAuthorizationWithNames extends DistributorAuthorization {
  principal_name?: string;
  distributor_name?: string;
}
```

---

## Validation Function Patterns

### Standard Pattern
```typescript
export async function validate[Resource]Form(data: unknown): Promise<void> {
  try {
    [resource]Schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        body: { errors: formattedErrors },
      };
    }
    throw error;
  }
}
```

### Sync Pattern (simpler resources)
```typescript
export function validate[Resource](data: unknown): [Resource] {
  return [resource]Schema.parse(data);
}
```

---

## Cross-Field Validation

Use `.superRefine()` or `.refine()` for complex business rules:

### superRefine (multiple issues)
```typescript
export const activitiesSchema = baseActivitiesSchema.superRefine((data, ctx) => {
  // Rule 1: interactions require opportunity_id
  if (data.activity_type === "interaction" && !data.opportunity_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["opportunity_id"],
      message: "Opportunity is required for interaction activities",
    });
  }

  // Rule 2: at least contact or organization required
  if (!data.contact_id && !data.organization_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contact_id"],
      message: "Either contact or organization is required",
    });
  }
});
```

### refine (single issue)
```typescript
.refine((data) => data.distributor_id !== data.principal_id, {
  message: "Distributor and Principal cannot be the same organization",
})
```

---

## Form Defaults (Engineering Constitution #5)

Generate defaults from schema via `.partial().parse({})`:

```typescript
// Define schema with defaults
export const taskSchema = z.strictObject({
  completed: z.coerce.boolean().default(false),
  priority: priorityLevelSchema.default("medium"),
  type: taskTypeSchema.default("Call"),
  // ...
});

// Generate form defaults
export const getTaskDefaultValues = () =>
  taskSchema.partial().parse({
    completed: false,
    priority: "medium" as const,
    type: "Call" as const,
    due_date: new Date(),
  });
```

---

## Special Cases

### CSV Import (contacts.ts)
Uses `z.object()` instead of `z.strictObject()` for flexibility:
```typescript
export const importContactSchema = z.object({
  // More permissive for real-world CSV data
  email_work: z.union([
    z.literal(""),
    z.literal(null),
    z.undefined(),
    z.string().trim().email(),
  ]).optional().nullable(),
});
```

### JSONB Fields (distributorAuthorizations.ts)
Uses `.passthrough()` for flexible pricing data:
```typescript
export const specialPricingSchema = z.object({
  unit_price: z.coerce.number().positive().optional(),
  discount_percent: z.coerce.number().min(0).max(100).optional(),
  // ...
}).passthrough(); // Allow additional fields
```

### Computed Fields (tasks.ts)
Uses `.passthrough()` on update schema to allow view-computed fields:
```typescript
export const taskUpdateSchema = taskSchema
  .partial()
  .passthrough() // Allow computed fields through - stripped by callbacks
  .required({ id: true });
```

---

## Security Checklist

When creating a new schema, ensure:

- [ ] Uses `z.strictObject()` (or documented exception)
- [ ] All strings have `.max()` constraints
- [ ] Form inputs use `z.coerce` for dates/numbers/booleans
- [ ] Constrained values use `z.enum()` (not string unions)
- [ ] No sensitive data (passwords, tokens) in validation errors
- [ ] Cross-field validations use `.superRefine()` or `.refine()`
- [ ] System fields (created_at, updated_at) omitted from create schemas
- [ ] Foreign keys validated as positive integers
- [ ] Nullable fields use `.optional().nullable()` pattern

---

## References

- **Engineering Constitution:** `/home/krwhynot/projects/crispy-crm/CLAUDE.md`
- **Data Provider Discovery:** `/home/krwhynot/projects/crispy-crm/.claude/state/data-provider-discovery.json`
- **ValidationService:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/services/ValidationService.ts`
- **Validation Constants:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/constants.ts`
