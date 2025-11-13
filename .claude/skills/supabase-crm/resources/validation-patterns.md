# Validation Patterns

## Purpose

Validation patterns ensure data integrity at API boundaries using Zod schemas. This resource covers CRM-specific validations including email/phone arrays, hierarchy rules, URL patterns, and type-safe form integration.

## Core Pattern

### Single Source of Truth

**All validation happens at API boundary only - never in components or forms.**

```typescript
import { z } from "zod";

// 1. Define schema (single source of truth)
export const entitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  status: z.enum(["active", "inactive"]).default("active"),
});

// 2. Infer types from schema (no duplicate type definitions)
export type Entity = z.infer<typeof entitySchema>;
export type EntityInput = z.input<typeof entitySchema>;

// 3. Create operation-specific schemas
export const createEntitySchema = entitySchema.omit({ id: true });
export const updateEntitySchema = entitySchema.partial().required({ id: true });

// 4. Get default values for forms (from schema, not hardcoded)
export const getEntityDefaults = () => entitySchema.partial().parse({
  status: "active",
});
```

**Why this works:**
- Schema is single source for validation AND types AND defaults
- Form state derives from schema via `.partial().parse({})`
- No duplication between validation rules and TypeScript types
- Changes to schema automatically update types and defaults

## Real-World Example: Organizations

**From `src/atomic-crm/validation/organizations.ts`:**

```typescript
import { z } from "zod";

// Reusable validation functions
export const PARENT_ELIGIBLE_TYPES = ["distributor", "customer", "principal"] as const;
export type ParentEligibleType = (typeof PARENT_ELIGIBLE_TYPES)[number];

export function canBeParent(org: {
  organization_type: string;
  parent_organization_id?: number | string | null;
}): boolean {
  return (
    PARENT_ELIGIBLE_TYPES.includes(org.organization_type as ParentEligibleType) &&
    !org.parent_organization_id
  );
}

// Custom validators
const URL_REGEX =
  /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i;
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;

const isValidUrl = z.string().refine((url) => !url || URL_REGEX.test(url), {
  message: "Must be a valid URL",
});

const isLinkedinUrl = z.string().refine(
  (url) => {
    if (!url) return true;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
    } catch {
      return false;
    }
  },
  { message: "Must be a valid LinkedIn organization URL" }
);

// Main schema with comprehensive validation
export const organizationSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, "Organization name is required"),
  parent_id: z.union([z.string(), z.number()]).optional().nullable(),
  segment_id: z.string().uuid().optional().nullable(),
  linkedin_url: isLinkedinUrl.nullish(),
  website: isValidUrl.nullish(),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  postal_code: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  sales_id: z.union([z.string(), z.number()]).nullish(),
  description: z.string().optional().nullable(),
  organization_type: z.enum([
    "customer",
    "prospect",
    "principal",
    "distributor",
    "unknown",
  ]).default("unknown"),
  priority: z.enum(["A", "B", "C", "D"]).default("C"),
  created_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
});

// Type inference
export type Organization = z.infer<typeof organizationSchema>;

// Operation-specific schemas
export const createOrganizationSchema = organizationSchema
  .omit({
    id: true,
    created_at: true,
    deleted_at: true,
  })
  .required({
    name: true,
  });

export const updateOrganizationSchema = organizationSchema.partial().required({
  id: true,
});
```

## Validation Patterns by Use Case

### Pattern 1: JSONB Array Validation (Email/Phone)

**Use for:** Multi-value fields stored as JSONB arrays in database

```typescript
// Sub-schema for array items
export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

// Main schema uses arrays of sub-schemas
export const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
});

// Form usage (NO defaultValue prop - comes from Zod)
<ArrayInput source="email">
  <SimpleFormIterator inline>
    <TextInput source="email" />
    <SelectInput source="type" choices={[
      { id: "Work", name: "Work" },
      { id: "Home", name: "Home" },
      { id: "Other", name: "Other" },
    ]} />
  </SimpleFormIterator>
</ArrayInput>
```

**Why this works:**
- Sub-schemas enforce structure for each array item
- `.default([])` prevents undefined/null issues
- No need for `defaultValue` in forms (comes from schema)
- Database stores as JSONB, application treats as typed array

### Pattern 2: Custom URL Validation

**Use for:** Website URLs, LinkedIn profiles, context links

```typescript
// Protocol-required URL validation
const URL_REGEX =
  /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i;

const isValidUrl = z.string().refine(
  (url) => !url || URL_REGEX.test(url),
  { message: "Must be a valid URL with http:// or https://" }
);

// Domain-specific URL validation
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;

const isLinkedinUrl = z.string().refine(
  (url) => {
    if (!url) return true; // Optional field
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
    } catch {
      return false; // Invalid URL format
    }
  },
  { message: "Must be a valid LinkedIn URL" }
);

// Usage in schema
export const organizationSchema = z.object({
  website: isValidUrl.nullish(),
  linkedin_url: isLinkedinUrl.nullish(),
  context_links: z.array(isValidUrl).nullish(),
});
```

### Pattern 3: Enum Validation with Defaults

**Use for:** Status fields, types, priorities

```typescript
// Define enum schema
export const taskTypeSchema = z.enum([
  "None",
  "Call",
  "Email",
  "Meeting",
  "Follow-up",
  "Proposal",
  "Discovery",
  "Administrative",
]);

export const priorityLevelSchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

// Type inference from enum
export type TaskType = z.infer<typeof taskTypeSchema>;
export type PriorityLevel = z.infer<typeof priorityLevelSchema>;

// Use in schema with defaults
export const taskSchema = z.object({
  type: taskTypeSchema.default("None"),
  priority: priorityLevelSchema.default("medium"),
  title: z.string().min(1, "Title is required"),
  due_date: z.string().date("Due date must be a valid date"),
});

// Default values for forms
export const getTaskDefaults = () =>
  taskSchema.partial().parse({
    type: "None",
    priority: "medium",
    completed: false,
    due_date: new Date().toISOString().slice(0, 10), // Today
  });
```

### Pattern 4: Date Validation

**Use for:** Due dates, reminder dates, timestamps

```typescript
export const taskSchema = z.object({
  // ISO date string (YYYY-MM-DD)
  due_date: z.string().date("Due date must be a valid date"),

  // ISO datetime string (ISO 8601)
  reminder_date: z.string().datetime("Invalid datetime").nullable().optional(),

  // Computed timestamps (readonly)
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().nullable().optional(),
});
```

### Pattern 5: Conditional Validation

**Use for:** Business rules that depend on other fields

```typescript
export const opportunitySchema = z.object({
  name: z.string().min(1),
  stage: z.enum(["lead", "qualified", "proposal", "closed_won", "closed_lost"]),
  estimated_close_date: z.string().date().optional(),
  actual_close_date: z.string().date().nullable().optional(),
  amount: z.number().positive().optional(),
}).refine(
  (data) => {
    // If stage is closed_won or closed_lost, actual_close_date is required
    if (["closed_won", "closed_lost"].includes(data.stage)) {
      return data.actual_close_date !== null && data.actual_close_date !== undefined;
    }
    return true;
  },
  {
    message: "Actual close date required for closed opportunities",
    path: ["actual_close_date"],
  }
).refine(
  (data) => {
    // If stage is closed_won, amount must be positive
    if (data.stage === "closed_won") {
      return data.amount && data.amount > 0;
    }
    return true;
  },
  {
    message: "Amount required for won opportunities",
    path: ["amount"],
  }
);
```

### Pattern 6: Hierarchy Validation

**Use for:** Parent-child relationships (organizations, categories)

```typescript
// Define eligible types
export const PARENT_ELIGIBLE_TYPES = ["distributor", "customer", "principal"] as const;

// Type guard function
export function canBeParent(org: {
  organization_type: string;
  parent_organization_id?: number | string | null;
}): boolean {
  return (
    PARENT_ELIGIBLE_TYPES.includes(org.organization_type as any) &&
    !org.parent_organization_id // Can't be a parent if it has a parent
  );
}

export function canHaveParent(org: {
  organization_type: string;
  parent_organization_id?: number | string | null;
  child_branch_count?: number;
}): boolean {
  return (
    PARENT_ELIGIBLE_TYPES.includes(org.organization_type as any) &&
    !org.parent_organization_id && // Can't have parent if already has one
    (org.child_branch_count === 0 || org.child_branch_count === undefined) // Can't have parent if has children
  );
}

// Use in service layer for business rule validation
export class OrganizationService {
  async validateHierarchy(parentId: string, childId?: string): Promise<void> {
    // Prevent circular references
    if (childId) {
      const ancestors = await this.getAncestors(childId);
      if (ancestors.some(a => a.id === parentId)) {
        throw new Error('Circular organization hierarchy detected');
      }
    }

    // Enforce max depth (2 levels in Crispy-CRM)
    const depth = await this.getHierarchyDepth(parentId);
    if (depth >= 2) {
      throw new Error('Maximum hierarchy depth (2 levels) exceeded');
    }
  }
}
```

## Integration with React Admin

### Form Default Values

```typescript
// ✅ GOOD: Defaults from schema
const defaults = organizationSchema.partial().parse({
  organization_type: "unknown",
  priority: "C",
});

<SimpleForm defaultValues={defaults}>
  {/* Fields derive state from defaults */}
</SimpleForm>

// ❌ BAD: Hardcoded defaults
<SimpleForm defaultValues={{ organization_type: "unknown", priority: "C" }}>
```

### Validation Integration

```typescript
// In unifiedDataProvider.ts
async function validateData(
  resource: string,
  data: any,
  operation: "create" | "update" = "create"
): Promise<void> {
  try {
    // Get schema for resource
    const schema = operation === "create"
      ? createOrganizationSchema
      : updateOrganizationSchema;

    // Parse and validate
    schema.parse(data);
  } catch (error: any) {
    // Convert Zod errors to React Admin format
    if (error.issues && Array.isArray(error.issues)) {
      const fieldErrors: Record<string, string> = {};

      for (const issue of error.issues) {
        const fieldPath = issue.path.join(".");
        fieldErrors[fieldPath] = issue.message;
      }

      throw {
        message: "Validation failed",
        errors: fieldErrors,
      };
    }

    throw error;
  }
}
```

## Error Message Best Practices

### Clear, Actionable Messages

```typescript
// ✅ GOOD: Specific, actionable
z.string().min(1, "Organization name is required")
z.string().email("Invalid email address")
z.string().url("Must be a valid URL with http:// or https://")
z.array(z.object({})).min(1, "At least one contact is required")

// ❌ BAD: Vague, unhelpful
z.string().min(1, "Required")
z.string().email("Invalid")
z.string().url("Bad URL")
z.array(z.object({})).min(1, "Need more")
```

### Custom Error Messages

```typescript
z.string().refine(
  (value) => value.length >= 8,
  {
    message: "Password must be at least 8 characters long",
    path: ["password"], // Field name in error object
  }
);
```

## Testing Validation

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { organizationSchema, canBeParent } from "./organizations";

describe("Organization Validation", () => {
  it("should validate valid organization", () => {
    const validOrg = {
      name: "Test Corp",
      organization_type: "customer",
      priority: "A",
    };

    expect(() => organizationSchema.parse(validOrg)).not.toThrow();
  });

  it("should reject organization without name", () => {
    const invalidOrg = {
      organization_type: "customer",
    };

    expect(() => organizationSchema.parse(invalidOrg)).toThrow(
      "Organization name is required"
    );
  });

  it("should validate LinkedIn URL", () => {
    const validLinkedIn = {
      name: "Test Corp",
      linkedin_url: "https://www.linkedin.com/company/test-corp",
    };

    expect(() => organizationSchema.parse(validLinkedIn)).not.toThrow();
  });

  it("should reject non-LinkedIn URL", () => {
    const invalidLinkedIn = {
      name: "Test Corp",
      linkedin_url: "https://twitter.com/test-corp",
    };

    expect(() => organizationSchema.parse(invalidLinkedIn)).toThrow(
      "Must be a valid LinkedIn"
    );
  });

  it("should check if organization can be parent", () => {
    expect(canBeParent({
      organization_type: "distributor",
      parent_organization_id: null,
    })).toBe(true);

    expect(canBeParent({
      organization_type: "distributor",
      parent_organization_id: 123,
    })).toBe(false);

    expect(canBeParent({
      organization_type: "prospect", // Not eligible type
      parent_organization_id: null,
    })).toBe(false);
  });
});
```

## Common Issues & Solutions

### Issue: Form shows validation errors on load

**Cause:** Form tries to validate before user interaction

**Solution:** Use `.partial()` and `.optional()` for form schemas
```typescript
// For forms (all fields optional until submit)
const formSchema = entitySchema.partial();

// For API validation (strict requirements)
const apiSchema = entitySchema.required({ name: true, email: true });
```

### Issue: Zod errors don't display in React Admin

**Cause:** Error format doesn't match React Admin expectations

**Solution:** Convert Zod errors in data provider
```typescript
catch (error: any) {
  if (error.issues && Array.isArray(error.issues)) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    throw { message: "Validation failed", errors: fieldErrors };
  }
  throw error;
}
```

### Issue: `.nullish()` vs `.nullable()` vs `.optional()`

**Explanation:**
- `.optional()`: Field can be `undefined` (not present in object)
- `.nullable()`: Field can be `null` (present but null)
- `.nullish()`: Field can be `undefined` OR `null` (most flexible)

**Usage:**
```typescript
// Database allows NULL → use .nullable()
deleted_at: z.string().nullable()

// Form field optional → use .optional()
description: z.string().optional()

// Both scenarios → use .nullish()
website: z.string().url().nullish()
```

## Best Practices

### DO
✅ Define schema once, infer types (no duplicate type definitions)
✅ Use `.default()` for required fields with sensible defaults
✅ Create operation-specific schemas (`createSchema`, `updateSchema`)
✅ Validate at API boundary only (unifiedDataProvider)
✅ Use custom validators for complex rules (`.refine()`)
✅ Write clear, actionable error messages
✅ Test validation with unit tests
✅ Use sub-schemas for JSONB arrays

### DON'T
❌ Define separate TypeScript types (infer from Zod)
❌ Validate in components or forms (API boundary only)
❌ Hardcode default values in forms (get from schema)
❌ Use vague error messages ("Required", "Invalid")
❌ Skip testing validation rules
❌ Mix validation logic across multiple files
❌ Use `any` type for validated data (use inferred types)

## Related Resources

- [Service Layer](service-layer.md) - Using validation in services
- [Error Handling](error-handling.md) - Error types and patterns
- [Edge Functions](edge-functions.md) - RPC validation patterns
- [Organizations](organizations.md) - Hierarchy validation examples
