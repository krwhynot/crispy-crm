# Validation Patterns

Standard patterns for Zod validation schemas in Crispy CRM.

## Schema Architecture Overview

```
VALIDATION_LIMITS (constants.ts)
    |
    v
Base Schemas (z.strictObject)
    |
    +----> Create Schemas (.omit system fields)
    |           |
    |           +----> Quick-Add Schemas (minimal fields + .refine)
    |
    +----> Update Schemas (.partial().required({id}))
    |           |
    |           +----> Close/Action Schemas (with .superRefine)
    |
    +----> RPC Schemas (rpc.ts registry)
            |
            +----> Response Schemas (type inference)

Validation Functions (async, React Admin format)
    |
    v
unifiedDataProvider (API boundary)
```

---

## File Structure (Modularized)

Complex entities are split into subdirectories per the 500-line rule. Simple entities remain as single files.

```
src/atomic-crm/validation/
├── index.ts                      # Main barrel export
├── constants.ts                  # VALIDATION_LIMITS
├── rpc.ts                        # RPC_SCHEMAS registry
├── quickAdd.ts                   # Quick-add form schemas
│
├── opportunities/                # Modularized (was 739 lines)
│   ├── index.ts                  # Barrel re-export
│   ├── opportunities-core.ts     # Base schema, enums, types
│   ├── opportunities-operations.ts # Create, update, close schemas
│   └── opportunities-duplicates.ts # Duplicate detection schemas
│
├── contacts/                     # Modularized (500-line rule)
│   ├── index.ts                  # Barrel re-export
│   ├── contacts-core.ts          # Base schema, transforms, validation
│   ├── contacts-communication.ts # Email, phone sub-schemas
│   ├── contacts-department.ts    # Department/role schemas
│   ├── contacts-import.ts        # Import/CSV schemas
│   ├── contacts-quick-create.ts  # Quick-create form
│   └── contacts-relations.ts     # Junction table schemas
│
├── organizations.ts              # Single file (under 500 lines)
├── products.ts
├── activities.ts
├── sales.ts
├── notes.ts
├── tags.ts
├── task.ts
├── segments.ts
├── operatorSegments.ts
├── distributorAuthorizations.ts
├── productDistributors.ts
├── organizationDistributors.ts
├── favorites.ts
├── categories.ts
└── productWithDistributors.ts
```

**Import Pattern:** Import from the main index or feature subdirectory:

```tsx
// Recommended: Import from main barrel
import { opportunitySchema, contactSchema } from "@/atomic-crm/validation";

// Alternative: Direct subdirectory import
import { opportunitySchema } from "@/atomic-crm/validation/opportunities";
import { contactSchema } from "@/atomic-crm/validation/contacts";
```

**Modularization Rule:** When a validation file exceeds 500 lines, split by concern:
1. Create a subdirectory named after the entity
2. Split into `-core.ts`, `-operations.ts`, and domain-specific files
3. Create `index.ts` barrel that re-exports all submodules
4. Update main `validation/index.ts` to export from subdirectory

---

## Pattern A: Base Schema with strictObject

For primary entity schemas with mass assignment prevention.

```tsx
// src/atomic-crm/validation/opportunities/opportunities-core.ts
const opportunityBaseSchema = z.strictObject({
  // System fields (optional for forms)
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  version: z.number().optional(),
  deleted_at: z.string().max(50).optional().nullable(),

  // Required fields with DoS prevention limits
  name: z.string().trim().min(1, "Opportunity name is required").max(255, "Opportunity name too long"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),

  // Date coercion for form inputs
  estimated_close_date: z.coerce
    .date({ error: "Expected closing date is required" })
    .default(() => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }),

  // Reference IDs accept string | number for flexibility
  customer_organization_id: z.union([z.string(), z.number()]),
  principal_organization_id: z.union([z.string(), z.number()]),
});
```

**When to use**: Primary entity schemas that define the complete shape of a record.

**Key points:**
- `z.strictObject()` rejects unknown keys (mass assignment prevention)
- All strings have `.max()` limits (DoS prevention)
- `z.coerce` for form inputs (dates, numbers, booleans)
- `.transform()` for sanitization (XSS prevention)
- Union types for IDs that may be string or number from different sources

---

## Pattern B: Create/Update Schema Derivation

For operation-specific schemas derived from the base schema.

```tsx
// src/atomic-crm/validation/organizations.ts

// Create: Omit system-managed fields
export const createOrganizationSchema = organizationSchema
  .omit({
    id: true,
    created_at: true,
    created_by: true,    // Auto-set by trigger
    updated_at: true,    // Auto-set by trigger
    updated_by: true,    // Auto-set by trigger
    deleted_at: true,
    nb_contacts: true,   // Computed field
    nb_opportunities: true,
    nb_notes: true,
  })
  .required({
    name: true,
  });

// Update: Partial with required ID
export const updateOrganizationSchema = organizationSchema.partial().required({
  id: true,
});
```

```tsx
// src/atomic-crm/validation/contacts/contacts-core.ts

// Create: Omit + transform + superRefine for business rules
export const createContactSchema = contactBaseSchema
  .omit({
    id: true,
    first_seen: true,
    last_seen: true,
    deleted_at: true,
    nb_tasks: true,
    company_name: true,
    created_at: true,
    updated_at: true,
    created_by: true,
  })
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    // Organization ID required for creation (no orphan contacts)
    if (!data.organization_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organization_id"],
        message: "Organization is required - contacts cannot exist without an organization",
      });
    }
  });

// Update: Partial with transform (ID in params.id, not data)
export const updateContactSchema = contactBaseSchema.partial().transform(transformContactData);
```

**When to use**: Creating operation-specific variants of a base schema.

**Key points:**
- `.omit()` removes system-managed fields for create operations
- `.partial()` makes all fields optional for update operations
- `.required({id: true})` ensures ID is present for updates
- Chain `.transform()` and `.superRefine()` after derivation for business logic

---

## Pattern B2: Two-Schema Rule (View vs Write Safety)

**Problem:** SQL Views (e.g., `opportunities_summary`, `contacts_summary`) include computed fields
like `nb_contacts`, `principal_organization_name`, `nb_interactions` that don't exist on base tables.
When React Admin sends form data back during updates, these view-only fields cause:
1. **Zod validation failure** (field not in `strictObject` schema)
2. **PostgREST error** (column doesn't exist on base table)

**Solution:** Defense in Depth with two stripping mechanisms.

| Layer | Method | When to Use |
|-------|--------|-------------|
| **TransformService** | `FIELDS_TO_STRIP` constant | Complex resources (Opportunities, Contacts) |
| **Schema `.strip()`** | `updateSchema = baseSchema.strip()` | Simple resources (Products, Segments) |

```tsx
// Layer 1: TransformService (runtime stripping before validation)
// src/atomic-crm/providers/supabase/services/TransformService.ts

const OPPORTUNITY_FIELDS_TO_STRIP = [
  "principal_organization_name",  // JOIN from organizations
  "nb_interactions",              // COUNT aggregate
  "next_task_title",              // Subquery result
  "customer_organization_name",   // JOIN from organizations
] as const;

// Called in handler BEFORE Zod validation
const cleanData = transformService.transformForValidation("opportunities", params.data);
```

```tsx
// Layer 2: Schema .strip() (Zod removes unknown keys)
// src/atomic-crm/validation/products.ts

// .strip() silently removes unknown keys (safer for simple resources)
export const productUpdateSchema = productSchema.strip();

// Alternative: strictObject REJECTS unknown keys (fails fast if Layer 1 missed something)
export const opportunitySchema = z.strictObject({ ... });
```

**When to use which:**

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| `TransformService` | Logging, explicit list, shared logic | More boilerplate | Complex resources with many computed fields |
| `.strip()` | Simple, automatic | Silent, no logging | Simple resources with few computed fields |
| **Both layers** | Maximum safety | Slightly redundant | Critical resources (Opportunities, Contacts) |

**Key points:**
- Always strip view-only fields BEFORE Zod validation
- Use `strictObject` as final safety net (rejects unknown keys that slipped through)
- Document which fields are stripped in `TransformService.ts` constants
- See also: PROVIDER_RULES.md Rule 2 (View vs Table Duality)

---

## Pattern C: Enum Schemas with UI Choices

For constrained value sets with matching UI dropdown arrays.

```tsx
// src/atomic-crm/validation/opportunities/opportunities-core.ts

// Enum schema - single source of truth
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]);

export const opportunityPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

// Win/Loss reason schemas
export const winReasonSchema = z.enum([
  "relationship",
  "product_quality",
  "price_competitive",
  "timing",
  "other",
]);

export const lossReasonSchema = z.enum([
  "price_too_high",
  "no_authorization",
  "competitor_relationship",
  "product_fit",
  "timing",
  "no_response",
  "other",
]);

// Type exports via z.infer<>
export type WinReason = z.infer<typeof winReasonSchema>;
export type LossReason = z.infer<typeof lossReasonSchema>;
export type OpportunityStageValue = z.infer<typeof opportunityStageSchema>;
export type OpportunityPriority = z.infer<typeof opportunityPrioritySchema>;

// CHOICES arrays for React Admin SelectInput
export const WIN_REASONS: Array<{ id: WinReason; name: string }> = [
  { id: "relationship", name: "Strong Relationship" },
  { id: "product_quality", name: "Product Quality/Fit" },
  { id: "price_competitive", name: "Competitive Pricing" },
  { id: "timing", name: "Right Timing" },
  { id: "other", name: "Other (specify)" },
];

export const LOSS_REASONS: Array<{ id: LossReason; name: string }> = [
  { id: "price_too_high", name: "Price Too High" },
  { id: "no_authorization", name: "No Distributor Authorization" },
  { id: "competitor_relationship", name: "Competitor Relationship" },
  { id: "product_fit", name: "Product Didn't Fit" },
  { id: "timing", name: "Bad Timing" },
  { id: "no_response", name: "Customer Unresponsive" },
  { id: "other", name: "Other (specify)" },
];
```

**When to use**: Database enum fields with corresponding UI dropdowns.

**Key points:**
- `z.enum()` is the single source of truth for valid values
- Export types via `z.infer<>` for type-safe consumption
- CHOICES arrays parallel the enum for React Admin SelectInput
- Use `.default()` on enum fields in base schema for form defaults

---

## Pattern D: Conditional Validation with superRefine

For cross-field validation rules and conditional requirements.

```tsx
// src/atomic-crm/validation/opportunities/opportunities-operations.ts

export const updateOpportunitySchema = opportunityBaseSchema
  .partial()
  .extend({
    contact_ids: z.array(z.union([z.string(), z.number()])).optional(),
    products_to_sync: z
      .array(z.strictObject({
        product_id_reference: z.union([z.string(), z.number()]).optional(),
        notes: z.string().max(2000).optional().nullable(),
      }))
      .optional(),
  })
  .required({ id: true })
  // Chained .refine() calls for cross-field validation
  .refine(
    (data) => {
      // Skip contact validation for stage-only updates (Kanban drag-drop)
      if (data.contact_ids === undefined) return true;
      const stageOnlyFields = new Set(["id", "stage", "win_reason", "loss_reason", "close_reason_notes", "contact_ids"]);
      const providedFields = Object.keys(data).filter((key) => data[key as keyof typeof data] !== undefined);
      const isStageOnlyUpdate = providedFields.every((field) => stageOnlyFields.has(field));
      if (isStageOnlyUpdate) return true;
      return Array.isArray(data.contact_ids) && data.contact_ids.length > 0;
    },
    { message: "At least one contact is required", path: ["contact_ids"] }
  )
  // Win reason required when closing as won
  .refine(
    (data) => {
      if (data.stage === "closed_won") return !!data.win_reason;
      return true;
    },
    { message: "Win reason is required when closing as won", path: ["win_reason"] }
  )
  // Loss reason required when closing as lost
  .refine(
    (data) => {
      if (data.stage === "closed_lost") return !!data.loss_reason;
      return true;
    },
    { message: "Loss reason is required when closing as lost", path: ["loss_reason"] }
  )
  // Notes required when reason is "other"
  .refine(
    (data) => {
      if (data.win_reason === "other" || data.loss_reason === "other") {
        return !!data.close_reason_notes && data.close_reason_notes.trim().length > 0;
      }
      return true;
    },
    { message: "Please specify the reason in notes when selecting 'Other'", path: ["close_reason_notes"] }
  );
```

```tsx
// src/atomic-crm/validation/contacts/contacts-core.ts

// Using superRefine for multiple issues
export const contactSchema = contactBaseSchema
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    // Validate name requirements
    if (!data.name && !data.first_name && !data.last_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Either name or first_name/last_name must be provided",
      });
    }

    // Validate nested email entries
    if (data.email && Array.isArray(data.email)) {
      const emailValidator = z.string().email("Invalid email address");
      data.email.forEach((entry, index) => {
        if (entry.value && !emailValidator.safeParse(entry.value).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["email", index, "value"],
            message: "Must be a valid email address",
          });
        }
      });
    }

    // Prevent circular reference
    if (data.manager_id && data.id && data.manager_id === data.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contact cannot be their own manager",
        path: ["manager_id"],
      });
    }
  });
```

**When to use**: Cross-field validation, conditional requirements, nested array validation.

**Key points:**
- `.refine()` for single-condition validation with custom message
- `.superRefine()` for multiple conditions with `ctx.addIssue()`
- Chain multiple `.refine()` calls for independent conditions
- Specify `path` to show error on the correct form field
- Check for undefined to allow partial updates

---

## Pattern E: Quick-Add Schema

For minimal required fields with "at least one of" validation.

```tsx
// src/atomic-crm/validation/quickAdd.ts

export const quickAddSchema = z
  .strictObject({
    // Contact fields (optional)
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),

    // Contact information (at least one required, validated in refine)
    phone: z.string().max(50).optional(),
    email: z.union([z.string().email("Invalid email address").max(254), z.literal("")]).optional(),

    // Organization fields (org_name required, city/state optional)
    org_name: z.string({ error: "Organization name required" }).min(1, "Organization name required").max(255),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),

    // Opportunity fields (required)
    campaign: z.string({ error: "Campaign required" }).min(1, "Campaign required").max(255),
    principal_id: z.number({ error: "Principal required" }),

    // Optional fields with auto-defaults
    product_ids: z.array(z.number()).optional().default([]),
    quick_note: z.string().max(2000).optional(),
  })
  .refine((data) => !!data.phone || !!data.email, {
    message: "Phone or Email required (at least one)",
    path: ["phone"],
  });

export type QuickAddInput = z.infer<typeof quickAddSchema>;
```

```tsx
// src/atomic-crm/validation/opportunities/opportunities-operations.ts

// Kanban quick-add schema
export const quickCreateOpportunitySchema = z.strictObject({
  // Required fields (Salesforce standard)
  name: z.string().trim().min(1, "Opportunity name is required").max(255),
  stage: opportunityStageSchema,
  customer_organization_id: z.union([z.string(), z.number()]),

  // Auto-populated fields with sensible defaults
  status: z.literal("active").default("active"),
  priority: opportunityPrioritySchema.default("medium"),

  // Owner assignment (current user)
  opportunity_owner_id: z.union([z.string(), z.number()]).optional(),
  account_manager_id: z.union([z.string(), z.number()]).optional(),

  // Auto-default: 30 days from now
  estimated_close_date: z.coerce.date().default(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }),
});

export type QuickCreateOpportunityInput = z.infer<typeof quickCreateOpportunitySchema>;
```

**When to use**: Quick-add dialogs, Kanban quick-create, trade show data entry.

**Key points:**
- Minimal required fields for fast data entry
- `.refine()` for "at least one of X or Y" validation
- `.default([])` for optional arrays
- `.default(() => ...)` for computed defaults
- Zod v4 uses `{ error: "message" }` instead of `required_error`

---

## Pattern F: Transform Schema

For data normalization and computed field generation.

```tsx
// src/atomic-crm/validation/contacts/contacts-core.ts

// Transform helper function
function transformContactData(data: Record<string, unknown>) {
  // Compute name from first + last if not provided
  if (!data.name && (data.first_name || data.last_name)) {
    data.name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Unknown";
  }

  // Ensure first_name and last_name are set if name is provided but they aren't
  if (data.name && !data.first_name && !data.last_name) {
    const parts = data.name.split(" ");
    if (parts.length >= 2) {
      data.first_name = parts[0];
      data.last_name = parts.slice(1).join(" ");
    } else {
      data.first_name = data.name;
      data.last_name = "";
    }
  }

  return data;
}

// Apply transform in schema chain
export const contactSchema = contactBaseSchema
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    // Validation runs on transformed data
  });
```

```tsx
// src/atomic-crm/validation/organizations.ts

// URL auto-prefix transform with .pipe() for post-transform validation
const urlAutoPrefix = (val: string | null | undefined): string => {
  if (!val) return val ?? '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const isValidUrl = z.string()
  .transform(urlAutoPrefix)
  .pipe(z.string().url({ message: "Must be a valid URL" }).max(2048).or(z.literal("")));

const isLinkedinUrl = z.string()
  .transform(urlAutoPrefix)
  .pipe(
    z.string().refine(
      (url) => {
        if (!url) return true;
        try {
          const parsedUrl = new URL(url);
          return parsedUrl.href.match(/^http(?:s)?:\/\/(?:www\.)?linkedin.com\//) !== null;
        } catch {
          return false;
        }
      },
      { message: "Must be a valid LinkedIn organization URL" }
    )
  );
```

**When to use**: Data normalization, computed fields, URL prefixing.

**Key points:**
- `.transform()` mutates data before validation continues
- `.pipe()` passes transformed output to a new schema for validation
- Transform functions receive the current data shape
- Chain: `.transform()` -> `.pipe()` -> `.refine()` for complex flows
- Use for bi-directional field computation (name <-> first_name + last_name)

---

## Pattern G: RPC Param/Response Schemas

For Edge Function and database RPC validation with registry lookup.

```tsx
// src/atomic-crm/validation/rpc.ts

// Parameter schemas for RPC functions
export const getOrCreateSegmentParamsSchema = z.strictObject({
  p_name: z.string().trim().min(1, "Segment name is required").max(255, "Segment name too long"),
});

export const archiveOpportunityWithRelationsParamsSchema = z.strictObject({
  opp_id: z.number().int().positive("Opportunity ID must be a positive integer"),
});

export const checkAuthorizationParamsSchema = z.strictObject({
  _distributor_id: z.number().int().positive("Distributor ID must be a positive integer"),
  _principal_id: z.number().int().positive("Principal ID must be a positive integer").optional().nullable(),
  _product_id: z.number().int().positive("Product ID must be a positive integer").optional().nullable(),
});

// Response schema with strictObject for mass assignment prevention
export const checkAuthorizationResponseSchema = z.strictObject({
  authorized: z.boolean(),
  reason: z.string().max(500).optional(),
  error: z.string().max(1000).optional(),
  authorization_id: z.number().optional(),
  distributor_id: z.number(),
  distributor_name: z.string().max(255).optional(),
  principal_id: z.number().optional(),
  principal_name: z.string().max(255).optional(),
  authorization_date: z.string().max(50).optional(),
  expiration_date: z.string().max(50).nullable().optional(),
  territory_restrictions: z.array(z.string().max(255)).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  product_id: z.number().optional(),
  product_name: z.string().max(255).optional(),
  resolved_via: z.literal("product_lookup").optional(),
});

// Type exports
export type CheckAuthorizationParams = z.infer<typeof checkAuthorizationParamsSchema>;
export type CheckAuthorizationResponse = z.infer<typeof checkAuthorizationResponseSchema>;

// Registry pattern for data provider lookup
export const RPC_SCHEMAS = {
  get_or_create_segment: getOrCreateSegmentParamsSchema,
  set_primary_organization: setPrimaryOrganizationParamsSchema,
  archive_opportunity_with_relations: archiveOpportunityWithRelationsParamsSchema,
  unarchive_opportunity_with_relations: unarchiveOpportunityWithRelationsParamsSchema,
  sync_opportunity_with_products: syncOpportunityWithProductsParamsSchema,
  check_authorization: checkAuthorizationParamsSchema,
  check_authorization_batch: checkAuthorizationBatchParamsSchema,
} as const;

export type RPCFunctionName = keyof typeof RPC_SCHEMAS;
```

**When to use**: Database RPC calls, Edge Function parameters, API responses.

**Key points:**
- `z.strictObject()` on response schemas prevents mass assignment from DB
- Registry pattern (`RPC_SCHEMAS`) enables data provider schema lookup
- Type exports via `z.infer<>` for type-safe params and responses
- Parameter names match PostgreSQL function signatures (`p_name`, `_distributor_id`)
- All strings have `.max()` limits even in responses

---

## Pattern H: Sub-Schema Composition

For JSONB array fields and nested object structures.

```tsx
// src/atomic-crm/validation/contacts/contacts-communication.ts

// Sub-schemas for JSONB arrays
export const personalInfoTypeSchema = z.enum(["work", "home", "other"]);

// Email entry schema - field is "value" to match database JSONB format
export const emailAndTypeSchema = z.strictObject({
  value: z.string().email("Invalid email address").max(254, "Email too long"),
  type: personalInfoTypeSchema.default("work"),
});

// Phone entry schema - field is "value" to match database JSONB format
export const phoneNumberAndTypeSchema = z.strictObject({
  value: z.string().max(30, "Phone number too long"),
  type: personalInfoTypeSchema.default("work"),
});

// Use in base schema (contacts/contacts-core.ts)
export const contactBaseSchema = z.strictObject({
  // ... other fields

  // JSONB arrays with sub-schema validation
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),

  // Array of strings with max length per item
  tags: z.array(z.string().max(100)).default([]),

  // ... other fields
});
```

```tsx
// src/atomic-crm/validation/opportunities/opportunities-operations.ts

// Nested object schema for junction table operations
const opportunityProductItemSchema = z.strictObject({
  product_id_reference: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateOpportunitySchema = opportunityBaseSchema
  .partial()
  .extend({
    // Virtual field: stripped before DB save
    products_to_sync: z
      .array(z.strictObject({
        product_id_reference: z.union([z.string(), z.number()]).optional(),
        notes: z.string().max(2000).optional().nullable(),
      }))
      .optional(),
  })
  .required({ id: true });
```

**When to use**: JSONB columns with typed arrays, junction table sync operations.

**Key points:**
- Sub-schemas use `z.strictObject()` for nested mass assignment prevention
- Field names must match database JSONB format (`value`, not `email`)
- Use `.default([])` for optional arrays to ensure array type
- `.max()` limits on each string within arrays
- Document virtual fields that are stripped before DB operations

---

## Pattern I: Validation Function Wrapper

For formatting ZodError into React Admin's expected format.

```tsx
// src/atomic-crm/validation/products.ts

export async function validateProductForm(data: unknown): Promise<void> {
  // Use safeParse for consistent error handling
  const result = productSchema.safeParse(data);

  if (!result.success) {
    // Format validation errors for React Admin
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });

    // React Admin expects { message, body: { errors } }
    throw {
      message: "Validation failed",
      body: { errors: formattedErrors },
    };
  }
}
```

```tsx
// src/atomic-crm/validation/opportunities.ts

export async function validateOpportunityForm(data: unknown): Promise<void> {
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
        body: { errors: formattedErrors }, // React Admin expects errors at body.errors
      };
    }
    throw error;
  }
}
```

**When to use**: All validation functions called from unifiedDataProvider.

**Key points:**
- Async function signature for consistency with data provider
- `.safeParse()` or try/catch with `.parse()` - both work
- Path joined with `.` for nested field errors: `email.0.value`
- Error format: `{ message: string, body: { errors: Record<string, string> } }`
- Re-throw non-Zod errors for fail-fast behavior

---

## Pattern J: Constants and Limits

For centralized DoS prevention values.

```tsx
// src/atomic-crm/validation/constants.ts

export const VALIDATION_LIMITS = {
  // IDs and References
  UUID_LENGTH: 36,

  // Contact Information
  EMAIL_MAX: 254,      // RFC 5321 maximum
  PHONE_MAX: 30,       // International format with extensions

  // URLs
  URL_MAX: 2000,       // Practical browser limit
  AVATAR_URL_MAX: 500, // CDN URLs are shorter

  // Text Fields (aligned with DB column sizes)
  NAME_MAX: 100,           // Names, titles, short identifiers
  SHORT_TEXT_MAX: 255,     // Default varchar(255)
  MEDIUM_TEXT_MAX: 1000,   // Descriptions, summaries
  LONG_TEXT_MAX: 5000,     // Notes, comments

  // System Fields
  TIMESTAMP_MAX: 50,   // ISO 8601 strings
  TIMEZONE_MAX: 50,    // IANA timezone identifiers
} as const;

export type ValidationLimitKey = keyof typeof VALIDATION_LIMITS;
```

```tsx
// Usage in schemas
import { VALIDATION_LIMITS } from "./constants";

const userSchema = z.strictObject({
  email: z.string().email().max(VALIDATION_LIMITS.EMAIL_MAX),
  name: z.string().max(VALIDATION_LIMITS.NAME_MAX),
  bio: z.string().max(VALIDATION_LIMITS.LONG_TEXT_MAX).optional(),
  created_at: z.string().max(VALIDATION_LIMITS.TIMESTAMP_MAX),
});
```

**When to use**: All string field `.max()` constraints.

**Key points:**
- `as const` for type-safe key access
- Aligned with database column sizes
- RFC standards for emails, UUIDs
- Practical limits for URLs (browser/CDN constraints)
- Consistent limits prevent DoS via payload size

---

## Security Patterns Summary

### DoS Prevention

| Pattern | Implementation | Example |
|---------|----------------|---------|
| String limits | `.max(N)` on all strings | `.max(255, "Name too long")` |
| Array limits | `.max(N)` on arrays | `.max(50, "Too many items")` |
| Nested limits | `.max()` on each nested string | `z.array(z.string().max(100))` |
| Centralized | `VALIDATION_LIMITS` constants | `VALIDATION_LIMITS.EMAIL_MAX` |

### XSS Prevention

| Pattern | Implementation | Example |
|---------|----------------|---------|
| HTML sanitization | `.transform()` with sanitizeHtml | `.transform((val) => val ? sanitizeHtml(val) : val)` |
| Rich text fields | Always sanitize | `description`, `notes`, `decision_criteria` |

### Mass Assignment Prevention

| Pattern | Implementation | Example |
|---------|----------------|---------|
| Strict objects | `z.strictObject()` | Rejects unknown keys |
| System fields | `.omit()` for create | Remove `id`, `created_at`, `updated_by` |
| Allowlist enums | `z.enum()` | Never denylist patterns |
| Response schemas | `z.strictObject()` on RPC responses | Explicit fields only |

---

## Pattern Comparison Table

| Aspect | Pattern A | Pattern B | Pattern C | Pattern D | Pattern E |
|--------|-----------|-----------|-----------|-----------|-----------|
| **Purpose** | Base entity | Operation variants | Constrained values | Cross-field rules | Fast data entry |
| **Zod method** | `z.strictObject()` | `.omit()/.partial()` | `z.enum()` | `.refine()/.superRefine()` | `.refine()` |
| **Mass assignment** | Yes | Inherits | N/A | N/A | Yes |
| **Type export** | `z.infer<>` | Derives from base | `z.infer<>` | Derives from base | `z.infer<>` |
| **Use case** | Schema definition | Create/Update | Dropdowns | Conditional logic | Quick-add dialogs |

| Aspect | Pattern F | Pattern G | Pattern H | Pattern I | Pattern J |
|--------|-----------|-----------|-----------|-----------|-----------|
| **Purpose** | Data normalization | RPC validation | Nested structures | Error formatting | DoS limits |
| **Zod method** | `.transform()/.pipe()` | Registry lookup | Sub-schemas | `safeParse` | `.max()` |
| **Mass assignment** | N/A | Yes (strictObject) | Yes (strictObject) | N/A | N/A |
| **Type export** | N/A | Params + Response | Sub-types | N/A | `as const` |
| **Use case** | URL prefixing | Edge Functions | JSONB arrays | Data provider | All strings |

---

## Anti-Patterns to Avoid

### 1. Missing String Limits (DoS Vulnerability)

```tsx
// BAD: No length limit
name: z.string().min(1)

// GOOD: Always include .max()
name: z.string().min(1).max(255)
```

### 2. Using z.object Instead of z.strictObject (Mass Assignment)

```tsx
// BAD: Accepts unknown keys
const schema = z.object({ name: z.string() });

// GOOD: Rejects unknown keys at API boundary
const schema = z.strictObject({ name: z.string().max(255) });
```

### 3. Denylist Instead of Allowlist

```tsx
// BAD: Denylist pattern
status: z.string().refine(s => !['admin', 'root'].includes(s))

// GOOD: Allowlist with enum
status: z.enum(['active', 'inactive', 'pending'])
```

### 4. Form-Level Validation (Violates Single Source of Truth)

```tsx
// BAD: Validation in form component
<TextInput validate={required()} />

// GOOD: Validation at API boundary only
// Form displays errors from data provider validation
```

### 5. Using `any` Type

```tsx
// BAD: Bypasses type safety
data: z.any()

// GOOD: Use z.unknown() and narrow
data: z.unknown().refine((d): d is SomeType => isValidType(d))
```

### 6. Not Sanitizing User Input

```tsx
// BAD: Direct storage of rich text
notes: z.string().max(5000)

// GOOD: Sanitize before storage
notes: z.string().max(5000).transform((val) => val ? sanitizeHtml(val) : val)
```

### 7. Coercion Without Limits

```tsx
// BAD: Coerced number without bounds
year: z.coerce.number()

// GOOD: Coerced with reasonable bounds
year: z.coerce.number().int().min(1800).max(new Date().getFullYear())
```

---

## Migration Checklist

When creating or updating a validation schema:

1. [ ] Use `z.strictObject()` for base schemas (mass assignment prevention)
2. [ ] Add `.max()` to ALL string fields (DoS prevention)
3. [ ] Use `z.enum()` for constrained values (allowlist pattern)
4. [ ] Export types via `z.infer<>` (type safety)
5. [ ] Create matching CHOICES arrays for enum fields (UI dropdowns)
6. [ ] Derive create schema with `.omit()` for system fields
7. [ ] Derive update schema with `.partial().required({id: true})`
8. [ ] Add `.transform()` for sanitization on rich text fields
9. [ ] Create async validation function with React Admin error format
10. [ ] Register in appropriate schema map (RPC_SCHEMAS, etc.)
11. [ ] Use `z.coerce` for form inputs (dates, numbers, booleans)
12. [ ] Add `.refine()` or `.superRefine()` for cross-field validation
13. [ ] Import limits from `VALIDATION_LIMITS` constants
14. [ ] Verify TypeScript compiles: `npx tsc --noEmit`
