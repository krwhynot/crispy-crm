# Validation and Form Patterns

**Status:** Research Complete  
**Date:** 2025-11-16  
**Purpose:** Document validation schemas, form patterns, and state management across Atomic CRM

---

## Table of Contents

1. [Validation Schema Architecture](#validation-schema-architecture)
2. [Validation Schema Locations](#validation-schema-locations)
3. [Tabbed Form Component](#tabbed-form-component)
4. [Form State Initialization](#form-state-initialization)
5. [JSONB Array Patterns](#jsonb-array-patterns)
6. [Zod .default() Usage](#zod-default-usage)
7. [Form Dirty State Tracking](#form-dirty-state-tracking)
8. [Key Patterns Summary](#key-patterns-summary)

---

## Validation Schema Architecture

### Core Principle

**Single Source of Truth:** All validation happens at the API boundary only using Zod schemas. Forms derive their defaults from schemas via `.partial().parse({})`.

**Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/`

### Schema Structure Pattern

Each resource follows a consistent pattern:

```typescript
// 1. Base schema with all fields
const baseSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, "Name is required"),
  status: z.enum(["active", "inactive"]).default("active"),
  // ... other fields
});

// 2. Main schema (may add transforms/refinements)
export const resourceSchema = baseSchema.superRefine((data, ctx) => {
  // Cross-field validation rules
});

// 3. Create-specific schema (stricter)
export const createResourceSchema = baseSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .required({ name: true });

// 4. Update-specific schema (flexible)
export const updateResourceSchema = baseSchema
  .partial()
  .required({ id: true });

// 5. Validation functions (API boundary)
export async function validateResourceForm(data: any): Promise<void> {
  try {
    resourceSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        formattedErrors[err.path.join(".")] = err.message;
      });
      throw { message: "Validation failed", errors: formattedErrors };
    }
    throw error;
  }
}
```

---

## Validation Schema Locations

### Core Resources

| Resource | Schema File | Main Schema Export | Create Schema | Update Schema |
|----------|------------|-------------------|---------------|---------------|
| **Contacts** | `contacts.ts` | `contactSchema` | `createContactSchema` | `updateContactSchema` |
| **Organizations** | `organizations.ts` | `organizationSchema` | `createOrganizationSchema` | `updateOrganizationSchema` |
| **Opportunities** | `opportunities.ts` | `opportunitySchema` | `createOpportunitySchema` | `updateOpportunitySchema` |
| **Tasks** | `task.ts` | `taskSchema` | `taskCreateSchema` | `taskUpdateSchema` |
| **Products** | `products.ts` | `productSchema` | N/A (uses base) | N/A (uses base) |
| **Sales** | `sales.ts` | `salesSchema` | `createSalesSchema` | `updateSalesSchema` |
| **Activities** | `activities.ts` | `activitiesSchema` | N/A (uses base) | N/A (uses base) |

### Supporting Resources

| Resource | Schema File | Main Schema Export | Notes |
|----------|------------|-------------------|-------|
| **Notes** | `notes.ts` | `contactNoteSchema`, `opportunityNoteSchema` | Separate schemas for each type |
| **Tags** | `tags.ts` | `tagSchema` | Includes semantic color validation |
| **Segments** | `segments.ts` | `segmentSchema` | Industry segments |
| **Quick Add** | `quickAdd.ts` | Multiple quick-add schemas | Simplified creation forms |

### Validation Index

**File:** `src/atomic-crm/validation/index.ts`

Exports all validation schemas for centralized import:

```typescript
// Core entities
export * from "./opportunities";
export * from "./organizations";
export * from "./contacts";

// Supporting entities
export * from "./tasks";
export * from "./tags";
export * from "./notes";
export * from "./segments";
```

---

## Tabbed Form Component

### Component Location

**Path:** `/home/krwhynot/projects/crispy-crm/src/components/admin/tabbed-form/`

**Files:**
- `TabbedFormInputs.tsx` - Main container component
- `TabTriggerWithErrors.tsx` - Tab trigger with error badge
- `TabPanel.tsx` - Tab content wrapper
- `index.ts` - Public exports

### TabbedFormInputs API

```typescript
interface TabDefinition {
  key: string;           // Unique tab identifier
  label: string;         // Display label
  fields: string[];      // Form fields for error tracking
  content: React.ReactNode; // Tab content
}

interface TabbedFormInputsProps {
  tabs: TabDefinition[];
  defaultTab?: string;
  className?: string;
}
```

### Error Tracking

Automatically tracks errors per tab using React Hook Form's `useFormState()`:

```typescript
const { errors } = useFormState();
const errorKeys = Object.keys(errors || {});

// Memoized error count per tab
const errorCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const tab of tabs) {
    counts[tab.key] = errorKeys.filter((key) => tab.fields.includes(key)).length;
  }
  return counts;
}, [errorKeys, tabs]);
```

### Design Features

- **Error badges:** Display count only when > 0
- **Semantic colors:** Uses CSS variables (`--border-subtle`, `--bg-secondary`)
- **Accessibility:** Full ARIA labels, keyboard navigation
- **Styling:** Consistent rounded corners, subtle borders, 24px padding

### Usage Pattern

#### 1. Create Tab Components

```typescript
// ContactIdentityTab.tsx
export const ContactIdentityTab = () => (
  <div className="space-y-2">
    <TextInput source="first_name" label="First Name" />
    <TextInput source="last_name" label="Last Name" />
  </div>
);
```

#### 2. Define Tabs Configuration

```typescript
// ContactInputs.tsx
import { TabbedFormInputs } from "@/components/admin/tabbed-form";

export const ContactInputs = () => {
  const tabs = [
    {
      key: "identity",
      label: "Identity",
      fields: ["first_name", "last_name"],  // For error tracking
      content: <ContactIdentityTab />,
    },
    {
      key: "position",
      label: "Position",
      fields: ["title", "department", "organization_id"],
      content: <ContactPositionTab />,
    },
    // ... more tabs
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="identity" />;
};
```

#### 3. Use in Form Components

```typescript
// ContactEdit.tsx or ContactCreate.tsx
<Form defaultValues={formDefaults}>
  <Card>
    <CardContent>
      <ContactInputs />  {/* Tabbed form */}
      <FormToolbar />
    </CardContent>
  </Card>
</Form>
```

### Resources Using Tabbed Forms

| Resource | Tabs | Fields per Tab |
|----------|------|----------------|
| **Contacts** | Identity, Position, Contact Info, Account | 2-4 fields each |
| **Organizations** | General, Details, Other | 6, 7, 3 fields |
| **Opportunities** | General, Classification, Relationships, Details | Varies |
| **Products** | General, Relationships, Classification | 3, 2, 2 fields |
| **Tasks** | General, Details | 4-5 fields each |
| **Sales** | General, Permissions | 5, 2 fields |

---

## Form State Initialization

### Constitution Rule #5: FORM STATE DERIVED FROM TRUTH

Forms derive default values from Zod schemas using `.partial().parse({})`:

```typescript
const defaultValues = {
  ...resourceSchema.partial().parse({}),
  // Add identity/context-specific values
  created_by: identity?.id,
};
```

### Pattern: Product Create

**File:** `src/atomic-crm/products/ProductCreate.tsx`

```typescript
const ProductCreate = () => {
  const { identity } = useGetIdentity();

  // Constitution Rule #4: Form state from schema
  const defaultValues = {
    ...productSchema.partial().parse({}),
    created_by: identity?.id,
  };

  return (
    <CreateBase redirect="show">
      <Form defaultValues={defaultValues}>
        <ProductInputs />
      </Form>
    </CreateBase>
  );
};
```

**What `.partial().parse({})` does:**
1. Makes all schema fields optional
2. Parses empty object `{}`
3. Returns object with all `.default()` values populated
4. Ignores required fields (they're optional in partial schema)

### Pattern: Opportunity Create

**File:** `src/atomic-crm/opportunities/OpportunityCreate.tsx`

```typescript
const OpportunityCreate = () => {
  const { identity } = useGetIdentity();

  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  // Use .partial() to make all fields optional during default generation
  // This extracts fields with .default() (stage, priority, estimated_close_date)
  const formDefaults = {
    ...opportunitySchema.partial().parse({}),
    opportunity_owner_id: identity?.id,
    account_manager_id: identity?.id,
    contact_ids: [], // Explicitly initialize for ReferenceArrayInput
    products_to_sync: [], // Explicitly initialize for ArrayInput
  };

  return (
    <CreateBase redirect="show">
      <Form defaultValues={formDefaults}>
        <OpportunityInputs mode="create" />
      </Form>
    </CreateBase>
  );
};
```

**Key Points:**
- Explicitly initialize array fields (`contact_ids: []`) for React Hook Form tracking
- Merge schema defaults with identity-specific values
- Do NOT set defaults in form components (violates single source of truth)

### Pattern: Task Defaults Helper

**File:** `src/atomic-crm/validation/task.ts`

```typescript
/**
 * Default values for new task form
 * Per Engineering Constitution: Form state from schema
 */
export const getTaskDefaultValues = () =>
  taskSchema.partial().parse({
    completed: false,
    priority: "medium" as const,
    type: "None" as const,
    due_date: new Date().toISOString().slice(0, 10), // Today's date
  });
```

**Usage:**
```typescript
const defaultValues = getTaskDefaultValues();
```

---

## JSONB Array Patterns

### Database Pattern

JSONB arrays store structured data (emails, phones) in PostgreSQL:

```sql
-- Database
email JSONB DEFAULT '[]'::jsonb
phone JSONB DEFAULT '[]'::jsonb
```

### Zod Sub-Schema Pattern

**File:** `src/atomic-crm/validation/contacts.ts`

```typescript
// 1. Define sub-schema for array items
export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"), // Default type
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: personalInfoTypeSchema.default("Work"),
});

// 2. Use in main schema with array + default
const contactBaseSchema = z.object({
  // ... other fields
  email: z.array(emailAndTypeSchema).default([]), // Empty array default
  phone: z.array(phoneNumberAndTypeSchema).default([]),
});
```

### Form Pattern: ArrayInput + SimpleFormIterator

**File:** `src/atomic-crm/contacts/ContactInfoTab.tsx`

```typescript
export const ContactInfoTab = () => (
  <div className="space-y-2">
    {/* Email array */}
    <ArrayInput source="email" label="Email addresses" helperText={false}>
      <SimpleFormIterator
        inline
        disableReordering
        disableClear
        className="[&>ul>li]:border-b-0 [&>ul>li]:pb-0"
      >
        <TextInput
          source="email"
          className="w-full"
          helperText={false}
          label={false}
          placeholder="Email (valid email required)"
        />
        <SelectInput
          source="type"
          helperText={false}
          label={false}
          optionText="id"
          choices={personalInfoTypes}
          className="w-24 min-w-24"
        />
      </SimpleFormIterator>
    </ArrayInput>

    {/* Phone array */}
    <ArrayInput source="phone" label="Phone numbers" helperText={false}>
      <SimpleFormIterator inline disableReordering disableClear>
        <TextInput source="number" placeholder="Phone number" />
        <SelectInput source="type" choices={personalInfoTypes} />
      </SimpleFormIterator>
    </ArrayInput>
  </div>
);
```

### Key Points

1. **NO defaultValue in form components** - Comes from Zod `.default([])`
2. **Sub-schemas validate array items** - `emailAndTypeSchema`, `phoneNumberAndTypeSchema`
3. **Type defaults in sub-schema** - `.default("Work")` ensures each item has a type
4. **ArrayInput source matches schema field** - `source="email"` → `email: z.array(...)`
5. **SimpleFormIterator renders each item** - Inline layout for compact display

### Other JSONB Array Examples

**Organizations:** `context_links` field
```typescript
// Schema
context_links: z.array(isValidUrl).nullish(),

// Form (not implemented yet, but pattern would be):
<ArrayInput source="context_links">
  <SimpleFormIterator>
    <TextInput source="." placeholder="https://..." />
  </SimpleFormIterator>
</ArrayInput>
```

**Products:** `certifications`, `allergens`
```typescript
// Schema
certifications: z.array(z.string()).nullish(),
allergens: z.array(z.string()).nullish(),
```

---

## Zod .default() Usage

### Where Defaults Are Set

`.default()` is used in Zod schemas for:
1. **Enum fields with business logic defaults**
2. **Boolean flags with standard initial states**
3. **Array fields that should initialize empty**
4. **Date fields with computed defaults**

### Examples from Codebase

#### Enum Defaults

**File:** `src/atomic-crm/validation/opportunities.ts`
```typescript
export const opportunitySchema = z.object({
  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),
  lead_source: leadSourceSchema.optional().nullable(),
  estimated_close_date: z
    .string()
    .min(1, "Expected closing date is required")
    .default(() => {
      // Default to 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split("T")[0];
    }),
  contact_ids: z
    .array(z.union([z.string(), z.number()]))
    .optional()
    .default([]),
  tags: z.array(z.string()).optional().default([]),
});
```

**File:** `src/atomic-crm/validation/organizations.ts`
```typescript
export const organizationSchema = z.object({
  organization_type: organizationTypeSchema.default("unknown"), // Default matches database
  priority: organizationPrioritySchema.default("C"), // Default matches database
});
```

**File:** `src/atomic-crm/validation/products.ts`
```typescript
export const productSchema = z.object({
  category: productCategorySchema.default("beverages"),
  status: productStatusSchema.default("active"),
});
```

#### Boolean Defaults

**File:** `src/atomic-crm/validation/task.ts`
```typescript
export const taskSchema = z.object({
  completed: z.boolean().default(false),
  priority: priorityLevelSchema.default("medium"),
  type: taskTypeSchema.default("None"),
});
```

**File:** `src/atomic-crm/validation/sales.ts`
```typescript
export const salesSchema = z.object({
  role: z.enum(['admin', 'manager', 'rep']).default('rep'),
  disabled: z.boolean().default(false),
});
```

**File:** `src/atomic-crm/validation/activities.ts`
```typescript
export const activitiesSchema = z.object({
  activity_type: activityTypeSchema.default("interaction"),
  type: interactionTypeSchema.default("call"),
  activity_date: z
    .string()
    .default(() => new Date().toISOString().split("T")[0]), // Today's date
  follow_up_required: z.boolean().default(false),
});
```

#### Array Defaults

**File:** `src/atomic-crm/validation/contacts.ts`
```typescript
export const contactBaseSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
});
```

**File:** `src/atomic-crm/validation/rpc.ts`
```typescript
export const syncOpportunityProductsSchema = z.object({
  products_to_create: z.array(opportunityProductItemSchema).default([]),
  products_to_update: z.array(opportunityProductItemSchema).default([]),
  product_ids_to_delete: z.array(z.number().int().positive()).default([]),
});
```

#### Sub-Schema Defaults

**File:** `src/atomic-crm/validation/contacts.ts`
```typescript
// Type enum with default in sub-schema
export const personalInfoTypeSchema = z.enum(["Work", "Home", "Other"]);

export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"), // Each email defaults to "Work"
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: personalInfoTypeSchema.default("Work"), // Each phone defaults to "Work"
});
```

### Anti-Pattern: Update Schemas

**IMPORTANT:** Update schemas should NOT have `.default()` on required arrays!

**File:** `src/atomic-crm/validation/opportunities.ts`
```typescript
// ❌ BAD: .default([]) in base schema causes issues with partial updates
contact_ids: z.array(...).optional().default([]),

// ✅ GOOD: No .default() in update schema
export const updateOpportunitySchema = opportunityBaseSchema
  .partial()
  .extend({
    contact_ids: z.array(z.union([z.string(), z.number()])).optional(), // No .default([])!
  })
  .required({ id: true });
```

**Reason:** React Admin v5 sends ALL form fields during update, not just dirty fields. If `contact_ids` has `.default([])`, updating priority would reset contacts to empty array.

---

## Form Dirty State Tracking

### React Hook Form Integration

Forms use React Hook Form's `useFormState()` for tracking changes:

```typescript
import { useFormState } from "react-hook-form";

const { isDirty, dirtyFields, errors } = useFormState();
```

### Example: Settings Page

**File:** `src/atomic-crm/settings/SettingsPage.tsx`

```typescript
const SettingsForm = ({ isEditMode, setEditMode }) => {
  const { isDirty } = useFormState();
  
  return (
    <Form onSubmit={handleOnSubmit} record={data}>
      <TextInput source="first_name" disabled={!isEditMode} />
      <TextInput source="last_name" disabled={!isEditMode} />
      <TextInput source="email" disabled={!isEditMode} />
      
      <Button type="submit" disabled={!isDirty} variant="outline">
        Save Changes
      </Button>
    </Form>
  );
};
```

**Pattern:**
1. `isDirty` tracks if ANY field has changed from initial values
2. Disable submit button when `!isDirty` (no changes)
3. Automatically resets when form submits successfully

### Example: Activity Note Form

**File:** `src/atomic-crm/opportunities/ActivityNoteForm.tsx`

```typescript
const ActivityNoteForm = ({ opportunity }) => {
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      activity_date: new Date(),
      type: "call",
      stage: opportunity.stage,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Add Activity"}
      </Button>
    </form>
  );
};
```

**Pattern:**
1. `isSubmitting` prevents double-submit during async save
2. `errors` shows validation errors per field
3. `handleSubmit` wraps form submission with validation

### Example: Quick Add Form

**File:** `src/atomic-crm/opportunities/QuickAddForm.tsx`

```typescript
const QuickAddForm = ({ stage }) => {
  const {
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      stage: stage, // Pre-fill from Kanban column
    },
  });

  return (
    <form>
      <TextInput source="name" error={errors.name?.message} />
      {/* Hidden field pre-filled */}
      <input type="hidden" name="stage" value={stage} />
    </form>
  );
};
```

### Dirty State Use Cases

1. **Save Button State:** Enable/disable based on `isDirty`
2. **Unsaved Changes Warning:** Check `isDirty` before navigation
3. **Submit Button State:** Disable during `isSubmitting`
4. **Field-Level Tracking:** Use `dirtyFields` to show which fields changed
5. **Error Display:** Use `errors` to show validation feedback

### Current Implementation Status

**Implemented:**
- Settings page uses `isDirty` for save button
- Activity forms use `isSubmitting` for submit state
- Error tracking in tabbed forms

**Not Implemented (Opportunities):**
- Unsaved changes warning on navigation
- Field-level dirty indicators
- Form reset on cancel

---

## Key Patterns Summary

### 1. Schema Organization

```
src/atomic-crm/validation/
├── index.ts                 # Central exports
├── contacts.ts             # Contact validation
├── organizations.ts        # Organization validation
├── opportunities.ts        # Opportunity validation
├── tasks.ts / task.ts      # Task validation (2 files - cleanup pending)
├── products.ts             # Product validation
├── sales.ts                # Sales/User validation
├── activities.ts           # Activity validation
├── notes.ts                # Note validation
├── tags.ts                 # Tag validation
└── __tests__/              # Comprehensive test coverage
```

### 2. Form Component Organization

```
src/atomic-crm/<resource>/
├── <Resource>Inputs.tsx        # Tab configuration
├── <Resource>GeneralTab.tsx    # Tab 1 fields
├── <Resource>DetailsTab.tsx    # Tab 2 fields
├── <Resource>OtherTab.tsx      # Tab 3 fields
├── <Resource>Edit.tsx          # Edit form wrapper
└── <Resource>Create.tsx        # Create form wrapper
```

### 3. Validation Flow

```
User Input → Form Fields → React Hook Form
                                ↓
                    Form Submit (onSubmit)
                                ↓
          Data Provider (unifiedDataProvider.ts)
                                ↓
          Validation Function (validateResourceForm)
                                ↓
                Zod Schema Parse (resourceSchema.parse)
                                ↓
                    Success → Supabase API
                    Failure → Format Errors → Display in Form
```

### 4. Error Handling Pattern

```typescript
export async function validateResourceForm(data: any): Promise<void> {
  try {
    resourceSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format for React Admin
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        formattedErrors[err.path.join(".")] = err.message;
      });
      throw { message: "Validation failed", errors: formattedErrors };
    }
    throw error;
  }
}
```

### 5. Best Practices

✅ **DO:**
- Define validation in Zod schemas only (single source of truth)
- Use `.partial().parse({})` to extract defaults
- Set `.default()` for business logic defaults in schemas
- Use sub-schemas for JSONB arrays
- Explicitly initialize array fields in form defaults
- Track errors per tab using `fields` array in tab definition
- Use semantic colors in form components

❌ **DON'T:**
- Set `defaultValue` props in form components
- Duplicate validation logic in forms
- Use inline validation functions
- Set `.default([])` on arrays in update schemas
- Hardcode hex colors in forms
- Mix validation with business logic

### 6. Constitution Compliance

| Rule | Implementation |
|------|----------------|
| **#1: NO OVER-ENGINEERING** | Simple Zod schemas, no circuit breakers |
| **#2: SINGLE SOURCE OF TRUTH** | Zod schemas at API boundary only |
| **#3: BOY SCOUT RULE** | Fix validation inconsistencies when touching files |
| **#4: FORM STATE FROM SCHEMA** | `zodSchema.partial().parse({})` for defaults |
| **#5: SEMANTIC COLORS ONLY** | CSS vars in forms, no hex values |

---

## Next Steps

### Immediate Actions

1. **Consolidate task validation files:**
   - `task.ts` (current) vs `tasks.ts` (legacy with 28 tests)
   - Merge into single file per Boy Scout Rule

2. **Document missing patterns:**
   - Context links array input (organizations)
   - Product certifications/allergens arrays
   - Tag color validation flow

3. **Add validation tests:**
   - JSONB array edge cases
   - Cross-field validation (activities: opportunity_id required for interactions)
   - Update schema partial update behavior

### Design System Integration

When rolling out unified design system:

1. **Forms:** Already use semantic colors via CSS variables
2. **Tabbed forms:** Use `--border-subtle`, `--bg-secondary`
3. **Error badges:** Use `variant="destructive"` (semantic)
4. **Touch targets:** 44px minimum on all inputs/buttons

### Performance Considerations

1. **Memoize error counts:** `useMemo` in TabbedFormInputs ✅
2. **Lazy load tab content:** Not implemented (could optimize)
3. **Schema caching:** Zod schemas are stateless (no caching needed)
4. **Form resets:** Use `key={record.id}` to force remount on record change ✅

---

**Research completed:** 2025-11-16  
**Files analyzed:** 25+  
**Patterns documented:** 8 major patterns  
**Next review:** When implementing unified design system rollout
