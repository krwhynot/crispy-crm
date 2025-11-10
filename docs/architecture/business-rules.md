# Business Rules

**Status:** Living Document | **Last Updated:** 2025-11-09
**Owner:** Architecture Team | **Scope:** All Business Logic

## Overview

This document defines all business rules, validation constraints, and business logic patterns for Atomic CRM. These rules ensure data integrity, enforce workflows, and maintain consistency across the application.

**Core Principles:**
- **Single source of truth** - Validation at API boundary only (Zod schemas in `src/atomic-crm/validation/`)
- **Fail fast** - No silent degradation or fallbacks (Engineering Constitution #1)
- **UI as truth** - Validate only fields that have UI inputs
- **Form state from schema** - Defaults defined in Zod (`.default()`), not in forms

**Validation Layer:** `src/atomic-crm/validation/` - All Zod schemas and validation functions

---

## Contacts

### Validation Rules

**Required Fields:**

- **Create:** `first_name` OR `last_name` (at least one required)
- **Create:** `email` (at least one email address required)
- **Create:** `sales_id` (account manager assignment required)

**Optional Fields:**
- `title`, `department`, `linkedin_url`, `notes`, `phone`, `organization_id`

**Computed Fields:**
- `name` - Auto-computed from `first_name + last_name` if not provided
- `company_name` - Denormalized from `organization.name`

---

### Email Validation

**Pattern:** JSONB array of `{email, type}` objects

**Schema:**

```typescript
export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
});
```

**Business Rules:**
- At least one email required for new contacts
- Each email must be valid format (RFC 5322)
- Type defaults to "Work"
- Empty email addresses not allowed

**Example:**

```json
{
  "email": [
    {"email": "john@work.com", "type": "Work"},
    {"email": "john.personal@gmail.com", "type": "Home"}
  ]
}
```

---

### Phone Validation

**Pattern:** JSONB array of `{number, type}` objects

**Schema:**

```typescript
export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),  // No format validation (international support)
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

const contactSchema = z.object({
  phone: z.array(phoneNumberAndTypeSchema).default([]),
});
```

**Business Rules:**
- Phone numbers optional
- No format validation (supports international formats)
- Type defaults to "Work"

---

### LinkedIn URL Validation

**Schema:**

```typescript
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;

const isLinkedinUrl = z.string().refine(
  (url) => {
    if (!url) return true;  // Empty is valid
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
    } catch {
      return false;
    }
  },
  { message: "URL must be from linkedin.com" }
);
```

**Business Rules:**
- Must be valid URL format
- Must be from `linkedin.com` domain
- Optional field

---

### Contact-Organization Relationships

**Schema:**

```typescript
const contactOrganizationSchema = z.object({
  contact_id: z.number(),
  organization_id: z.number(),
  is_primary: z.boolean().default(false),
  is_primary_decision_maker: z.boolean().default(false),
  role: z.enum(['decision_maker', 'influencer', 'buyer', 'end_user', 'gatekeeper', 'champion', 'technical', 'executive']).optional(),
  purchase_influence: z.number().min(0).max(100).optional(),  // 0-100 scale
});
```

**Business Rules:**
- Contact can belong to multiple organizations
- One organization marked as `is_primary` per contact
- `purchase_influence` 0-100 scale (decision-making power)
- Unique constraint: `(contact_id, organization_id)`

---

## Opportunities

### Validation Rules

**Required Fields (Create):**

- `name` - Opportunity name
- `estimated_close_date` - Expected closing date
- `customer_organization_id` - Buying organization (customer/prospect)
- `principal_organization_id` - Brand/manufacturer represented
- `contact_ids` - At least one contact required

**Required Fields (Update):**
- `id` - Opportunity ID

**Optional Fields:**
- `description`, `stage`, `priority`, `lead_source`, `distributor_organization_id`, `account_manager_id`, `campaign`, `related_opportunity_id`, `notes`, `tags`, `next_action`, `next_action_date`, `decision_criteria`

---

### Stage Validation

**Schema:**

```typescript
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "awaiting_response",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]);
```

**Default:** `"new_lead"`

**Business Rules:**
- Stage changes tracked via `stage_changed_at` (updated by trigger)
- No validation on stage transitions (sales rep controls workflow)

---

### Priority Validation

**Schema:**

```typescript
export const opportunityPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
```

**Default:** `"medium"`

---

### Lead Source Validation

**Schema:**

```typescript
export const leadSourceSchema = z.enum([
  "referral",
  "trade_show",
  "website",
  "cold_call",
  "email_campaign",
  "social_media",
  "partner",
  "existing_customer",
]);
```

**Business Rules:**
- Optional field
- Used for marketing attribution

---

### Contact Association Rules

**Schema:**

```typescript
const createOpportunitySchema = z.object({
  // ... other fields
  contact_ids: z.array(z.number()).min(1, "At least one contact is required"),
});

const updateOpportunitySchema = z.object({
  // ... other fields
  contact_ids: z.array(z.number()).optional(),
}).refine(
  (data) => {
    // Only validate contact_ids if it's actually being updated
    if (data.contact_ids === undefined) {
      return true;  // Partial update of other fields
    }
    // If contact_ids IS provided, must not be empty
    return Array.isArray(data.contact_ids) && data.contact_ids.length > 0;
  },
  {
    message: "At least one contact is required",
    path: ["contact_ids"],
  }
);
```

**Business Rules:**
- **Create:** At least one contact required
- **Update:** If `contact_ids` field is updated, must not be empty
- **Update:** If `contact_ids` not in payload, partial update allowed
- Contacts must belong to opportunity's customer organization (not enforced in validation, business logic in UI)

**Why the complex update logic?** React Admin v5 sends ALL form fields during update. If you update priority, the payload contains `{id, priority, contact_ids: [], ...all fields}`. The schema must differentiate between "not updating contacts" (undefined) and "removing all contacts" (empty array).

---

### Multi-Participant Rules

**Database Constraints:**

```sql
customer_organization_id BIGINT NOT NULL,  -- Required
principal_organization_id BIGINT NOT NULL,  -- Required
distributor_organization_id BIGINT,         -- Optional
```

**Business Rules:**
- **Customer** - Required. Organization type: `customer` or `prospect`
- **Principal** - Required. Organization type: `principal`
- **Distributor** - Optional. Organization type: `distributor`

**Foreign Key Constraints:**
- `customer_organization_id` → organizations (ON DELETE RESTRICT)
- `principal_organization_id` → organizations (ON DELETE RESTRICT)
- `distributor_organization_id` → organizations (ON DELETE SET NULL)

---

### Estimated Close Date

**Schema:**

```typescript
estimated_close_date: z.string().min(1, "Expected closing date is required").default(() => {
  // Default to 30 days from now
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}),
```

**Business Rules:**
- Required field
- Format: `YYYY-MM-DD` (ISO date string)
- Default: 30 days from today

---

### Campaign Tracking

**Schema:**

```typescript
campaign: z.string().max(100, "Campaign name must be 100 characters or less").optional().nullable(),
```

**Business Rules:**
- Optional field
- Max 100 characters
- Used for marketing campaign attribution

---

## Organizations

### Validation Rules

**Required Fields:**

- `name` - Organization name
- `type` - Organization type

**Optional Fields:**
- `website`, `description`, `logo_url`, `industry`, `headquarters_location`, `employee_count`, `revenue`, `notes`, `tags`

---

### Organization Type

**Schema:**

```typescript
export const organizationTypeSchema = z.enum([
  "customer",
  "principal",
  "distributor",
  "prospect",
  "partner",
  "unknown",
]);
```

**Business Rules:**
- **customer** - Buying companies (active customers)
- **prospect** - Potential customers
- **principal** - Brands/manufacturers represented
- **distributor** - Distribution partners
- **partner** - Other partnerships
- **unknown** - Unclassified

**Usage:**
- Opportunities require `customer` or `prospect` as customer organization
- Opportunities require `principal` as principal organization
- Opportunities optionally include `distributor`

---

## Tasks

### Validation Rules

**Required Fields:**

- `title` - Task description
- `due_date` - Deadline
- `sales_id` - Assigned sales rep

**Optional Fields:**
- `description`, `type`, `contact_id`, `organization_id`, `opportunity_id`

---

### Task Type

**Schema:**

```typescript
export const taskTypeSchema = z.enum([
  "Call",
  "Email",
  "Meeting",
  "Follow-up",
  "Proposal",
  "Discovery",
  "Administrative",
  "None",
]);
```

**Default:** `"None"`

---

### Due Date Validation

**Schema:**

```typescript
due_date: z.string().min(1, "Due date is required"),  // ISO date string
```

**Business Rules:**
- Required field
- Format: `YYYY-MM-DD`
- No validation on past dates (can create overdue tasks)

---

### Task Assignment

**Schema:**

```typescript
sales_id: z.number().min(1, "Sales rep assignment is required"),
```

**Business Rules:**
- Required field
- Must reference valid `sales.id`
- RLS policy: user can only see tasks assigned to them (unless admin)

---

## Products

### Validation Rules

**Required Fields:**

- `name` - Product name

**Optional Fields:**
- `sku`, `description`, `category`, `principal_id`, `distributor`, `status`, `image_url`

**Breaking Change (2025-10-29):**
- **Pricing removed** - Products are now associations only
- No `list_price`, `cost`, or unit of measure
- Migration: `20251028040008_remove_product_pricing_and_uom.sql`

---

### Product Category

**Schema:**

```typescript
category: z.string().optional(),  // Changed from enum to TEXT (2025-10-28)
```

**Business Rules:**
- Optional field
- Free-text (previously enum with 19 food categories)
- Migration: `20251028044618_change_product_category_to_text.sql`

---

### Product Status

**Schema:**

```typescript
export const productStatusSchema = z.enum([
  "active",
  "discontinued",
  "seasonal",
  "coming_soon",
  "limited_availability",
]);
```

**Default:** `"active"`

---

## Activities

### Validation Rules

**Required Fields:**

- `activity_type` - `"engagement"` or `"interaction"`
- `type` - Interaction type (call, email, meeting, etc.)
- `subject` - Activity description
- `activity_date` - When it occurred

**At least one of:**
- `contact_id` OR `organization_id` (check constraint enforced)

**Optional Fields:**
- `description`, `duration_minutes`, `opportunity_id`, `follow_up_required`, `follow_up_date`, `outcome`

---

### Activity Type

**Schema:**

```typescript
export const activityTypeSchema = z.enum(["engagement", "interaction"]);
```

**Business Rules:**
- **engagement** - General customer interaction
- **interaction** - Specific tracked event

---

### Interaction Type

**Schema:**

```typescript
export const interactionTypeSchema = z.enum([
  "call",
  "email",
  "meeting",
  "demo",
  "proposal",
  "follow_up",
  "trade_show",
  "site_visit",
  "contract_review",
  "check_in",
  "social",
]);
```

---

### Contact/Organization Requirement

**Database Constraint:**

```sql
CONSTRAINT require_entity CHECK (
  contact_id IS NOT NULL OR organization_id IS NOT NULL
)
```

**Business Logic (log_engagement RPC):**

```sql
-- If contact_id provided without organization_id, auto-populate from contact's primary org
IF p_contact_id IS NOT NULL AND p_organization_id IS NULL THEN
  SELECT organization_id INTO p_organization_id
  FROM contact_organizations
  WHERE contact_id = p_contact_id AND is_primary = true
  LIMIT 1;
END IF;
```

---

## Security & Access Control

### Role-Based Access

**Roles:**

- **Admin** - Full access (based on `sales.is_admin = true`)
- **User** - Standard sales rep

**Permission Matrix:**

| Resource | SELECT | INSERT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|
| **Contacts** | Team | Team | Admin | Admin |
| **Organizations** | Team | Team | Admin | Admin |
| **Opportunities** | Team | Team | Admin | Admin |
| **Tasks** | Own | Team | Own | Admin |
| **Products** | Team | Team | Admin | Admin |
| **Notes** | Team | Team | Admin | Admin |
| **Activities** | Team | Team | Own | Admin |

**Legend:**
- **Team** - All authenticated users
- **Own** - Only records where `sales_id = current_sales_id`
- **Admin** - Only users with `is_admin = true`

---

### RLS Policy Patterns

**Team-wide read access:**

```sql
CREATE POLICY select_contacts ON contacts
FOR SELECT TO authenticated
USING (true);
```

**Personal data access:**

```sql
CREATE POLICY select_tasks ON tasks
FOR SELECT TO authenticated
USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));
```

**Admin-only update:**

```sql
CREATE POLICY update_contacts ON contacts
FOR UPDATE TO authenticated
USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true);
```

---

## Data Integrity Rules

### Soft Deletes

**Pattern:** All tables use `deleted_at TIMESTAMPTZ` for soft deletes (not hard deletes).

**Business Rules:**
- Deleted records kept for audit trail
- Excluded from views via `WHERE deleted_at IS NULL`
- Cascading soft deletes handled by triggers

**Example:**

```sql
UPDATE contacts SET deleted_at = NOW() WHERE id = 123;
```

---

### Optimistic Locking (Opportunities)

**Pattern:** `version` field incremented on each update.

**SQL:**

```sql
UPDATE opportunities
SET stage = 'closed_won',
    version = version + 1,
    updated_at = NOW()
WHERE id = 456 AND version = 3  -- Check current version
RETURNING *;
```

**Business Rules:**
- Prevents concurrent update conflicts
- If version mismatch, update fails
- UI re-fetches and user retries

---

### Audit Trail

**Pattern:** All tables include:

```sql
created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
created_by BIGINT REFERENCES sales(id),
```

**Business Rules:**
- `created_at` - Auto-populated on INSERT
- `updated_at` - Auto-updated via trigger
- `created_by` - Sales rep who created record

---

## Validation at API Boundary

### Validation Layer Architecture

**Location:** `src/atomic-crm/validation/`

**Pattern:**

```typescript
// 1. Define Zod schema
export const contactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.array(emailAndTypeSchema).min(1),
});

// 2. Export validation function
export async function validateContactForm(data: any): Promise<void> {
  try {
    contactSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw {
        message: "Validation failed",
        errors: formattedErrors,
      };
    }
    throw error;
  }
}

// 3. Register in data provider
const resourceConfigs = {
  contacts: {
    table: 'contacts',
    validate: validateContactForm,  // Called before INSERT/UPDATE
  },
};
```

---

### Create vs Update Validation

**Create Schema (stricter):**

```typescript
export const createContactSchema = contactBaseSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .extend({
    email: z.array(emailAndTypeSchema).min(1, "At least one email required"),
    sales_id: z.number().min(1, "Account manager is required"),
  });
```

**Update Schema (more flexible):**

```typescript
export const updateContactSchema = contactBaseSchema.partial();
```

**Why separate schemas?**
- Create enforces all required fields
- Update allows partial updates (React Admin PATCH pattern)

---

### Form State from Schema

**Engineering Constitution #5:**

```typescript
// ✅ CORRECT - Extract defaults from Zod
const schemaDefaults = contactSchema.partial().parse({});
const defaultValues = {
  ...schemaDefaults,
  sales_id: currentUserId,  // Runtime values merged
};

const form = useForm({
  resolver: zodResolver(contactSchema),
  defaultValues,
});

// ❌ WRONG - Hardcode defaults in component
const form = useForm({
  defaultValues: {
    stage: 'new_lead',  // Now out of sync with schema!
  }
});
```

**Rationale:**
- Prevents drift between validation and UI
- Schema is single source of truth for defaults
- Forms never start in invalid state

---

## Business Logic Patterns

### Name Computation (Contacts)

**Pattern:** Auto-compute `name` from `first_name + last_name` if not provided.

**Schema:**

```typescript
.transform((data) => {
  if (!data.name && (data.first_name || data.last_name)) {
    data.name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unknown';
  }
  return data;
})
```

---

### Default Values in Schema

**Pattern:** Use `.default()` method in Zod, NOT in form components.

**Schema:**

```typescript
export const opportunitySchema = z.object({
  stage: z.enum([...]).default("new_lead"),
  priority: z.enum([...]).default("medium"),
  estimated_close_date: z.string().default(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }),
});
```

**Form:**

```tsx
{/* NO defaultValue prop - comes from Zod */}
<SelectInput source="stage" choices={stageChoices} />
<DateInput source="estimated_close_date" />
```

---

### JSONB Array Defaults

**Pattern:** Array fields default to `[]`, NOT `null` or `undefined`.

**Schema:**

```typescript
email: z.array(emailAndTypeSchema).default([]),
phone: z.array(phoneNumberAndTypeSchema).default([]),
tags: z.array(z.string()).default([]),
```

**Database:**

```sql
email JSONB DEFAULT '[]'::jsonb,
phone JSONB DEFAULT '[]'::jsonb,
tags TEXT[] DEFAULT '{}',
```

---

## Related Documentation

- [Database Schema](./database-schema.md) - Tables, relationships, constraints
- [API Design](./api-design.md) - Data provider, validation integration
- [Engineering Constitution](../claude/engineering-constitution.md) - Core principles
- Validation Schemas: `src/atomic-crm/validation/` - All Zod schemas
