# Validation: Advanced Patterns

## Purpose

Document advanced validation patterns: custom validators, transforms, and import schemas.

## Pattern: Custom Validators

### URL Validation

**From `src/atomic-crm/validation/contacts.ts:12`:**

```typescript
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;

const isLinkedinUrl = z
  .string()
  .refine(
    (url) => {
      if (!url) return true; // Optional field
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
      } catch {
        return false;
      }
    },
    { message: "URL must be from linkedin.com" }
  )
  .optional()
  .nullable();

// Use in schema
const contactBaseSchema = z.object({
  linkedin_url: isLinkedinUrl,
});
```

### Date Validation

```typescript
const isFutureDate = z
  .string()
  .refine(
    (dateString) => {
      if (!dateString) return true;
      const date = new Date(dateString);
      return date > new Date();
    },
    { message: "Date must be in the future" }
  )
  .optional()
  .nullable();
```

## Pattern: Transform Before Validate

**From `src/atomic-crm/validation/contacts.ts:119`:**

```typescript
function transformContactData(data: any) {
  // Compute name from first + last if not provided
  if (!data.name && (data.first_name || data.last_name)) {
    data.name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Unknown";
  }

  // Ensure first_name and last_name are set if name is provided
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

// Apply transform before validation
export const contactSchema = contactBaseSchema
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    // Validate AFTER transformation
    if (!data.name && !data.first_name && !data.last_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Either name or first_name/last_name must be provided",
      });
    }
  });
```

**When to Transform:**
- Normalize data (trim, lowercase)
- Compute derived fields
- Split/merge fields
- Handle legacy data formats

## Pattern: Import Schemas (Permissive)

**From `src/atomic-crm/validation/contacts.ts:172`:**

```typescript
// More permissive than main schema for real-world CSV data
export const importContactSchema = z
  .object({
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    organization_name: z
      .string({ error: "Organization name is required" })
      .trim()
      .min(1, { message: "Organization name is required" }),

    // Email - validate format but allow empty/null
    email_work: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z.string().trim().email({ message: "Invalid email address" }),
      ])
      .optional()
      .nullable(),

    // Phone - allow string or number (PapaParse converts)
    phone_work: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z.string(),
        z.number().transform(String),
      ])
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.first_name?.trim() && !data.last_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["first_name"],
        message: "Either first name or last name must be provided",
      });
    }
  });
```

**Why Permissive:**
- CSV data is messy (empty strings, nulls, wrong types)
- Allow flexible input, normalize during transformation
- Validate format when value is present

## Testing Validation

```typescript
import { describe, it, expect } from 'vitest';
import { opportunitySchema, createOpportunitySchema } from './opportunities';

describe('opportunitySchema', () => {
  it('validates valid opportunity', () => {
    const validData = {
      name: "Test Opportunity",
      customer_organization_id: 1,
      principal_organization_id: 2,
      estimated_close_date: "2025-12-31",
    };

    expect(() => opportunitySchema.parse(validData)).not.toThrow();
  });

  it('rejects missing required fields', () => {
    const invalidData = {
      name: "",
      customer_organization_id: 1,
    };

    expect(() => createOpportunitySchema.parse(invalidData)).toThrow();
  });

  it('applies defaults', () => {
    const data = { name: "Test", customer_organization_id: 1, principal_organization_id: 2 };
    const result = opportunitySchema.parse(data);

    expect(result.stage).toBe("new_lead");
    expect(result.priority).toBe("medium");
    expect(result.contact_ids).toEqual([]);
  });
});
```

## Validation Decision Tree

```
Need validation?
│
├─ Where should it go?
│  └─ ALWAYS: src/atomic-crm/validation/<resource>.ts
│
├─ What schema type?
│  ├─ Standard CRUD → Base + create/update schemas
│  ├─ CSV import → Permissive import schema
│  └─ Sub-resources → Sub-schema for JSONB arrays
│
├─ What validation rules?
│  ├─ Simple constraints → z.string().min(), z.enum()
│  ├─ Cross-field logic → .superRefine()
│  ├─ Custom validators → .refine()
│  └─ Data normalization → .transform()
│
└─ How to format errors?
   └─ { message, errors: { field: message } }
```

## Related Resources

- [validation-basics.md](validation-basics.md) - Core validation patterns
- [validation-arrays.md](validation-arrays.md) - JSONB array validation
- [validation-schemas.md](validation-schemas.md) - Create/Update schemas

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
