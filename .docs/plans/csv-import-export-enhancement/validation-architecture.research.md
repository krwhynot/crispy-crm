# Validation Architecture Research

Comprehensive analysis of Zod validation, transformation, and error handling patterns in Atomic CRM for CSV import/export enhancement.

## Overview

The Atomic CRM validation architecture follows Engineering Constitution Principle #3: "Single Source of Truth - Zod at API boundary only." Validation occurs exclusively in the data provider layer before database operations, with a registry-based service pattern that separates validation concerns from transformation logic.

## Relevant Files

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/index.ts`: Central export point for all validation schemas
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/contacts.ts`: Contact validation with email/phone array schemas (332 lines)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/organizations.ts`: Organization validation with URL validation (170 lines)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/tags.ts`: Tag validation with semantic color transformation (194 lines)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/opportunities.ts`: Opportunity validation with enum schemas
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/tasks.ts`: Task validation with type enums and priority
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/notes.ts`: Contact/opportunity note validation with attachments
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/services/ValidationService.ts`: Registry-based validation orchestrator (236 lines)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/services/TransformService.ts`: Registry-based transformation orchestrator (154 lines)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Integration point for validation/transformation (main data flow)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/filterRegistry.ts`: Valid filterable fields registry (273 lines)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/utils/avatar.utils.ts`: Avatar/logo transformation utilities (247 lines)

## Architectural Patterns

### 1. Validation Schema Pattern (Zod)

Each resource defines three schema variants:
- **Base Schema**: Complete field definitions with common validation rules
- **Create Schema**: Stricter requirements, omits system fields (`id`, `created_at`, etc.)
- **Update Schema**: Partial variant allowing field subsets, requires `id`

**Example from contacts.ts:**
```typescript
// Base schema with all fields
const contactBaseSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().optional(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
  // ... other fields
});

// Create: stricter requirements
export const createContactSchema = contactBaseSchema
  .omit({ id: true, created_at: true, /* ... */ })
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    // Require first_name AND last_name for creation
    if (!data.name && (!data.first_name || !data.last_name)) {
      ctx.addIssue({ /* ... */ });
    }
  });

// Update: partial, flexible
export const updateContactSchema = contactBaseSchema
  .partial()
  .transform(transformContactData);
```

### 2. JSONB Array Field Validation

Email and phone stored as JSONB arrays in PostgreSQL require nested validation:

**Schema Definition:**
```typescript
export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"),
});

// Used in contact schema
email: z.array(emailAndTypeSchema).default([]),
```

**Custom Array Validation (contacts.ts:153-166):**
```typescript
contactSchema.superRefine((data, ctx) => {
  if (data.email && Array.isArray(data.email)) {
    const emailValidator = z.string().email("Invalid email address");
    data.email.forEach((entry: any, index: number) => {
      if (entry.email && !emailValidator.safeParse(entry.email).success) {
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

### 3. Registry-Based ValidationService

**Architecture:** Single service class with resource-specific validator lookup

**Registry Structure (ValidationService.ts:71-146):**
```typescript
private validationRegistry: Record<string, ValidationHandlers<unknown>> = {
  contacts: {
    create: async (data: unknown) => validateContactForm(data),
    update: async (data: unknown) => validateUpdateContact(data),
  },
  organizations: {
    create: async (data: unknown) => validateOrganizationForSubmission(data),
    update: async (data: unknown) => validateOrganizationForSubmission(data),
  },
  tags: {
    create: async (data: unknown) => { validateCreateTag(data); },
    update: async (data: unknown) => { validateUpdateTag(data); },
  },
  // ... 10 total resources
};
```

**Key Methods:**

1. **`validate(resource, method, data)`** - Primary validation entry point
   - Looks up validator in registry
   - Calls create/update specific validator
   - Returns void or throws ZodError

2. **`validateFilters(resource, filters)`** - Filter field cleanup
   - Prevents 400 errors from stale cached filters
   - Checks against `filterRegistry.ts` allowed fields
   - Logs warnings for invalid fields (console.warn)
   - Returns cleaned filter object

### 4. Registry-Based TransformService

**Architecture:** Single service class for data mutations before DB operations

**Registry Structure (TransformService.ts:33-123):**
```typescript
private transformerRegistry: Record<string, {
  transform?: TransformerFunction<TransformableData>;
}> = {
  contacts: {
    transform: async (data: TransformableData) => {
      const contactData = data as Partial<Contact>;

      // 1. Process avatar (upload if needed)
      const processedData = await processContactAvatar(contactData);

      // 2. Extract junction table data
      const { organizations, ...cleanedData } = processedData as any;

      // 3. Compute name field from first_name + last_name
      if (cleanedData.first_name || cleanedData.last_name) {
        cleanedData.name = `${cleanedData.first_name || ''} ${cleanedData.last_name || ''}`.trim();
      }

      // 4. Add created_at timestamp for creates
      if (!cleanedData.id) {
        (cleanedData as Record<string, unknown>).created_at = new Date().toISOString();
      }

      // 5. Rename junction data to avoid column errors
      if (organizations) {
        (cleanedData as any).organizations_to_sync = organizations;
      }

      return cleanedData;
    }
  },
  organizations: { /* logo processing */ },
  contactNotes: { /* attachment uploads */ },
  opportunityNotes: { /* attachment uploads */ },
  sales: { /* avatar upload */ },
};
```

**Common Transformation Patterns:**

1. **Avatar/Logo Processing:**
   - `processContactAvatar()` - Gravatar → Favicon → LinkedIn
   - `processOrganizationLogo()` - Website favicon generation
   - File upload handling via StorageService

2. **Name Composition:**
   - Contacts: `first_name + last_name → name` (required for DB)
   - Format: `[first] [last]`.trim() or fallback to 'Unknown'

3. **Junction Table Extraction:**
   - Remove `organizations` field from contact data
   - Rename to `organizations_to_sync` for data provider processing
   - Prevents "organizations does not exist" column errors

4. **Timestamp Injection:**
   - Add `created_at` for create operations (`!data.id`)
   - Format: ISO 8601 string (`new Date().toISOString()`)

5. **Attachment Uploads:**
   - Notes: Upload all attachments in parallel (`Promise.all()`)
   - Filter out invalid attachment objects before upload

### 5. Validation-Then-Transform Flow

**Critical Ordering (unifiedDataProvider.ts:166-183):**
```typescript
async function processForDatabase<T>(
  resource: string,
  data: Partial<T>,
  operation: "create" | "update" = "create",
): Promise<Partial<T>> {
  // STEP 1: Validate FIRST (original field names)
  await validateData(resource, data, operation);

  // STEP 2: Transform SECOND (field renames, uploads, etc.)
  const processedData = await transformData(resource, data, operation);

  return processedData;
}
```

**Why This Order Matters:**
- Validation sees original field names (e.g., `products`, `organizations`)
- Transformation can rename fields safely after validation (e.g., `products_to_sync`)
- Referenced in Issue 0.4 as critical fix

## ZEN GAP FIX - Preview Validation Strategy

### Respecting "Zod at API Boundary Only" Principle

**Problem:** Preview validation seems to violate the "single source of truth" principle by validating before the API boundary.

**Solution:** Use data provider with dry-run flag to maintain architectural consistency:

```typescript
// CORRECT: Preview validation through data provider
async function validatePreview(rows: ContactImportSchema[]) {
  const validationResults = await Promise.all(
    rows.map(row =>
      dataProvider.create("contacts", {
        data: row,
        meta: { dryRun: true }  // New meta flag prevents DB writes
      }).then(
        () => ({ valid: true, row }),
        (error) => ({ valid: false, row, error })
      )
    )
  );
  return validationResults;
}

// WRONG: Duplicating validation logic
async function validatePreview(rows: ContactImportSchema[]) {
  // DON'T duplicate Zod schemas outside data provider
  const results = rows.map(row => contactSchema.parse(row));
  return results;
}
```

**Benefits:**
- Single source of truth for validation logic
- Preview validation exactly matches actual import validation
- No risk of validation drift between preview and import
- Respects fail-fast principle (validation errors are surfaced immediately)

## Edge Cases & Gotchas

### 1. Name Field Computation (Contacts)

**Issue:** Database requires `name` field, but UI splits into `first_name`/`last_name`

**Solution (contacts.ts:116-136):**
```typescript
function transformContactData(data: any) {
  // Compute name from first + last if not provided
  if (!data.name && (data.first_name || data.last_name)) {
    data.name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unknown';
  }

  // Reverse: split name into first/last if they aren't set
  if (data.name && !data.first_name && !data.last_name) {
    const parts = data.name.split(' ');
    if (parts.length >= 2) {
      data.first_name = parts[0];
      data.last_name = parts.slice(1).join(' ');
    } else {
      data.first_name = data.name;
      data.last_name = '';
    }
  }

  return data;
}
```

**CSV Import Consideration:**
- Must handle both `name` column AND separate `first_name`/`last_name` columns
- Fallback to 'Unknown' if all three are empty

### 2. Email Array Validation Complexity

**Issue:** createContactSchema requires at least one email, but array could be empty or have invalid entries

**Solution (contacts.ts:265-293):**
```typescript
export async function validateCreateContact(data: any): Promise<void> {
  try {
    // Ensure at least one email is provided for new contacts
    if (!data.email || !Array.isArray(data.email) || data.email.length === 0) {
      throw new z.ZodError([{
        code: z.ZodIssueCode.custom,
        message: "At least one email address is required",
        path: ["email"],
      }]);
    }

    createContactSchema.parse(data);
  } catch (error) {
    // Format errors for React Admin
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });
      throw { message: "Validation failed", errors: formattedErrors };
    }
    throw error;
  }
}
```

**CSV Import Consideration:**
- Email field may be comma-separated string or single value
- Must parse into array format: `[{ email: "...", type: "Work" }]`
- Default type to "Work" if not specified

### 3. LinkedIn URL Validation

**Gotcha:** URL must start with `http://` or `https://` and match `linkedin.com` domain

**Regex Pattern (contacts.ts:12):**
```typescript
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;
```

**CSV Import Consideration:**
- Reject LinkedIn URLs without protocol (e.g., "linkedin.com/in/johndoe")
- Must prepend `https://` or mark as invalid

### 4. Semantic Color Transformation (Tags)

**Issue:** Legacy tags use hex colors, but system requires semantic color names

**Solution (tags.ts:17-50):**
```typescript
const semanticColorSchema = z
  .string()
  .refine((value) => {
    // Check if valid semantic color name
    if (VALID_TAG_COLORS.includes(value as TagColorName)) return true;

    // Check if legacy hex value that can be mapped
    const normalizedHex = value.toLowerCase();
    if (HEX_TO_SEMANTIC_MAP[normalizedHex]) return true;

    return false;
  })
  .transform((value) => {
    // Already semantic? Return as-is
    if (VALID_TAG_COLORS.includes(value as TagColorName)) return value;

    // Map hex to semantic or default to gray
    const normalizedHex = value.toLowerCase();
    return HEX_TO_SEMANTIC_MAP[normalizedHex] || "gray";
  });
```

**CSV Import Consideration:**
- Accept both semantic names ("blue", "green") AND hex codes ("#FF5733")
- Auto-transform hex to nearest semantic color
- Default to "gray" for unmapped values

### 5. Filter Validation Warning Pattern

**Issue:** Stale browser cache can send invalid filter fields after schema migrations

**Solution (ValidationService.ts:195-235):**
```typescript
validateFilters(resource: string, filters: Record<string, any>): Record<string, any> {
  const allowedFields = filterableFields[resource];

  if (!allowedFields) {
    console.warn(
      `[ValidationService] No filterable fields defined for resource: "${resource}". ` +
      `Skipping filter validation. Consider adding this resource to filterRegistry.ts`
    );
    return filters; // No validation possible, return as-is
  }

  const cleanedFilters: Record<string, any> = {};
  let modified = false;

  for (const filterKey in filters) {
    if (isValidFilterField(resource, filterKey)) {
      cleanedFilters[filterKey] = filters[filterKey];
    } else {
      console.warn(
        `[ValidationService] Resource "${resource}" received invalid filter field: "${filterKey}". ` +
        `This field does not exist in the database schema. Removing it to prevent API errors.`
      );
      modified = true;
    }
  }

  if (modified) {
    console.info(
      `[ValidationService] Filters cleaned for resource "${resource}".`,
      `\nOriginal:`, filters,
      `\nCleaned:`, cleanedFilters
    );
  }

  return cleanedFilters;
}
```

**Pattern:** Console warnings (not thrown errors) with detailed context

### 6. React Admin Filter Operators

**Gotcha:** PostgREST uses `@` suffix operators (`@gte`, `@lte`, `@like`) that need special handling

**Solution (filterRegistry.ts:254-272):**
```typescript
export function isValidFilterField(resource: string, filterKey: string): boolean {
  const allowedFields = filterableFields[resource];
  if (!allowedFields) return false;

  // PostgREST logical operators have no field prefix - whitelist them
  const POSTGREST_LOGICAL_OPERATORS = ['@or', '@and', '@not'];
  if (POSTGREST_LOGICAL_OPERATORS.includes(filterKey)) return true;

  // Extract base field name, handling React Admin's filter operators
  // Examples: "last_seen@gte" -> "last_seen", "name@like" -> "name"
  const baseField = filterKey.split('@')[0];

  return allowedFields.includes(baseField) || allowedFields.includes(filterKey);
}
```

**CSV Import Consideration:**
- Not directly applicable, but good pattern for query building

### 7. Avatar Generation Cascade

**Gotcha:** Multiple fallback strategies for missing avatars (contacts.ts)

**Strategy (avatar.utils.ts:74-104):**
```typescript
export async function getContactAvatar(record: Partial<Contact>): Promise<string | null> {
  if (!record.email || !record.email.length) return null;

  for (const { email } of record.email) {
    // Step 1: Try Gravatar
    const gravatarUrl = await getGravatarUrl(email);
    try {
      const gravatarResponse = await fetch(gravatarUrl);
      if (gravatarResponse.ok) return gravatarUrl;
    } catch { /* continue */ }

    // Step 2: Try favicon from email domain
    const domain = email.split("@")[1];
    const faviconUrl = await getFaviconUrl(domain);
    if (faviconUrl) return faviconUrl;

    // TODO: Step 3: Try LinkedIn profile image
  }

  return null;
}
```

**CSV Import Consideration:**
- May want to skip avatar generation during bulk import (performance)
- Or add `skip_avatar_generation` flag for import mode

### 8. UI as Source of Truth Principle

**Pattern:** Only validate fields that have UI inputs (contacts.ts:108-113)

**Example Comment:**
```typescript
// Note: The following fields exist in database but are NOT validated
// because they have no UI input fields in ContactInputs.tsx (per "UI as truth" principle):
// - address, city, state, postal_code, country
// - birthday, gender
// - twitter_handle
// - notes, tags
```

**ZEN GAP FIX - CSV Import Exception:**
- CSV import uses `ContactImportSchema` interface, NOT database Contact type
- Maps to existing UI-visible fields only (respecting UI as truth)
- Column aliases map to ContactImportSchema fields, not DB fields
- Example: "Email" → `email_work` (not `email` JSONB array)
- This maintains the principle while allowing CSV flexibility

## Error Handling

### 1. Field-Level vs Record-Level Validation

**Field-Level (inline form errors):**
```typescript
// ZodError with path to specific field
ctx.addIssue({
  code: z.ZodIssueCode.custom,
  path: ["email", 0, "email"], // Nested path: data.email[0].email
  message: "Must be a valid email address",
});
```

**Record-Level (form-wide errors):**
```typescript
// Error without specific path
throw {
  message: "Validation failed",
  errors: { _error: "Overall validation failed" }
};
```

### 2. React Admin Error Format

**Required Format:**
```typescript
{
  message: string,           // Top-level error message
  errors: {                  // Field-specific errors
    [fieldName]: string,     // e.g., "email": "Invalid email address"
    _error?: string          // Form-level error fallback
  }
}
```

**Conversion from ZodError (contacts.ts:196-212):**
```typescript
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
```

### 3. Console Warnings vs Thrown Errors

**Console Warnings (non-blocking):**
- Filter validation warnings (ValidationService.validateFilters)
- Missing filterable field definitions
- Informational cleanup messages

**Thrown Errors (blocking):**
- Schema validation failures (ZodError)
- Required field violations
- Business rule violations (e.g., unique tag name)

**Pattern (ValidationService.ts:199-203):**
```typescript
if (!allowedFields) {
  console.warn(
    `[ValidationService] No filterable fields defined for resource: "${resource}". ` +
    `Skipping filter validation. Consider adding this resource to filterRegistry.ts`
  );
  return filters; // WARNING, not error
}
```

### 4. Pre-Operation Validation Pattern

**Location:** unifiedDataProvider.ts:120-151

**Process:**
1. ValidationService.validate() is called BEFORE transformation
2. If ZodError thrown, catch and reformat for React Admin
3. If generic Error, wrap in React Admin format
4. Unknown errors get generic fallback

**Code:**
```typescript
async function validateData(
  resource: string,
  data: any,
  operation: "create" | "update" = "create",
): Promise<void> {
  try {
    await validationService.validate(resource, operation, data);
  } catch (error: any) {
    // Ensure errors are properly formatted for React Admin
    if (error.errors && typeof error.errors === 'object') {
      throw error; // Already properly formatted
    }

    if (error instanceof Error) {
      throw {
        message: error.message || "Validation failed",
        errors: { _error: error.message },
      };
    }

    throw {
      message: "Validation failed",
      errors: { _error: String(error) },
    };
  }
}
```

### 5. Idempotent Delete Pattern

**Gotcha:** React Admin's undoable mode updates UI before API call completes

**Solution (unifiedDataProvider.ts:201-206):**
```typescript
// Handle idempotent delete - if resource doesn't exist, treat as success
if (method === 'delete' && error.message?.includes('Cannot coerce the result to a single JSON object')) {
  // Return successful delete response - resource was already deleted
  return { data: params.previousData } as T;
}
```

**CSV Import Consideration:**
- Not directly applicable, but shows error recovery pattern

### 6. Supabase Error Extraction

**Pattern:** Convert Supabase-specific errors to React Admin format

**Code (unifiedDataProvider.ts:216-234):**
```typescript
// For Supabase errors, try to extract field-specific errors
if (error.code && error.details) {
  const fieldErrors: Record<string, string> = {};

  // Try to parse field from error details
  if (typeof error.details === 'string') {
    // Simple heuristic to extract field name from error
    const match = error.details.match(/column "(\w+)"/i);
    if (match) {
      fieldErrors[match[1]] = error.details;
    } else {
      fieldErrors._error = error.details;
    }
  }

  throw {
    message: error.message || "Operation failed",
    errors: fieldErrors,
  };
}
```

**CSV Import Consideration:**
- Batch import errors should collect all row errors, not fail-fast
- Consider error accumulation pattern instead of throwing immediately

## Relevant Docs

### Internal Documentation
- [Engineering Constitution](/home/krwhynot/projects/crispy-crm/docs/claude/engineering-constitution.md) - Principle #3: Single Source of Truth
- [Architecture Essentials](/home/krwhynot/projects/crispy-crm/docs/claude/architecture-essentials.md) - Data Layer section
- [Supabase Workflow](/home/krwhynot/projects/crispy-crm/docs/supabase/WORKFLOW.md) - Database migration patterns

### External References
- Zod Documentation: https://zod.dev/
- React Admin Validation: https://marmelab.com/react-admin/Validation.html
- PostgREST Operators: https://postgrest.org/en/stable/references/api/tables_views.html#operators

### Test Examples
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/__tests__/contacts/validation.test.ts` - Contact validation patterns
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/__tests__/tags/edge-cases.test.ts` - Color transformation edge cases
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/__tests__/organizations/integration.test.ts` - Organization validation integration
