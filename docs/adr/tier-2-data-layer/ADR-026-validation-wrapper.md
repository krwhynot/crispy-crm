# ADR-026: Validation Wrapper Pattern (Zod → React Admin)

## Status

**Accepted**

## Date

Original: 2024-12 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

[ADR-002](./ADR-002-zod-api-boundary.md) established that Zod validation happens at the API boundary in the data provider, not in forms. However, two challenges emerged:

1. **Error Format Mismatch**: Zod errors use `{ issues: [{ path: ["field"], message: "..." }] }` but React Admin expects `{ body: { errors: { field: "message" } } }` for inline field error display.

2. **Stale Filter Caching**: When database schema changes (e.g., removing a column), cached filters from localStorage reference non-existent columns, causing PostgREST 400 errors.

3. **Handler Composition Order**: The composed provider ([ADR-009](./ADR-009-composed-data-provider.md)) uses wrapper functions. Validation must run BEFORE lifecycle callbacks but AFTER the base provider call returns.

### Error Format Example

```typescript
// Zod error format:
{
  name: "ZodError",
  issues: [
    { path: ["email", 0, "address"], message: "Invalid email format" },
    { path: ["first_name"], message: "Name too long" },
    { path: [], message: "At least one contact method required" }
  ]
}

// React Admin expected format:
{
  message: "Validation failed",
  body: {
    errors: {
      "email.0.address": "Invalid email format",
      "first_name": "Name too long",
      "_error": "At least one contact method required"
    }
  }
}
```

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Transform in ValidationService** | Centralized | Service becomes framework-coupled |
| **Transform in each handler** | Explicit | Duplicated in 11 handlers |
| **Dedicated wrapper function** | Single responsibility, reusable | One more composition layer |
| **Custom Zod error map** | Native Zod feature | Limited format control |

---

## Decision

**Create a `withValidation()` wrapper function** that sits in the composition chain and handles:
1. Zod error transformation to React Admin format
2. Filter field cleaning on getList to prevent stale cache errors

### Implementation

```typescript
// src/atomic-crm/providers/supabase/wrappers/withValidation.ts:70-85

function transformZodToReactAdmin(zodError: ZodError): ReactAdminValidationError {
  const errors: Record<string, string> = {};

  for (const issue of zodError.issues) {
    // Join nested paths with dots (e.g., ["address", "city"] -> "address.city")
    const fieldPath = issue.path.join(".");
    // Use the field path as key, or "_error" for root-level errors
    const key = fieldPath || "_error";
    errors[key] = issue.message;
  }

  return {
    message: "Validation failed",
    body: { errors },
  };
}
```

### Wrapper Structure

```typescript
// src/atomic-crm/providers/supabase/wrappers/withValidation.ts:100-171

export function withValidation<T extends DataProvider>(
  provider: T,
  validationService: ValidationService = new ValidationService()
): T {
  const wrappedProvider = { ...provider } as T;

  // Wrap create with validation
  wrappedProvider.create = async (resource, params) => {
    try {
      await validationService.validate(resource, "create", params.data);
    } catch (error) {
      if (isZodError(error)) {
        throw transformZodToReactAdmin(error);
      }
      throw error;
    }
    return provider.create(resource, params);
  };

  // Wrap update with validation
  wrappedProvider.update = async (resource, params) => {
    try {
      const dataWithId = { ...params.data, id: params.id };
      await validationService.validate(resource, "update", dataWithId);
    } catch (error) {
      if (isZodError(error)) {
        throw transformZodToReactAdmin(error);
      }
      throw error;
    }
    return provider.update(resource, params);
  };

  // Wrap getList with filter cleaning
  wrappedProvider.getList = async (resource, params) => {
    const processedParams = { ...params };
    if (processedParams.filter && Object.keys(processedParams.filter).length > 0) {
      processedParams.filter = validationService.validateFilters(
        resource,
        processedParams.filter
      );
    }
    return provider.getList(resource, processedParams);
  };

  return wrappedProvider;
}
```

### Composition Order

```
┌─────────────────────────────────────────────────────────────┐
│                    Handler Composition                        │
│                                                               │
│  withErrorLogging(                    ← Outermost: Catches all│
│    withLifecycleCallbacks(            ← Middle: Resource logic │
│      withValidation(baseProvider)     ← Innermost: Validates  │
│    )                                                          │
│  )                                                            │
│                                                               │
│  Execution order (left to right):                             │
│  1. Validation runs first (validates input)                   │
│  2. Lifecycle callbacks transform data                        │
│  3. Error logging catches any failures                        │
└─────────────────────────────────────────────────────────────┘
```

### Filter Cleaning for Stale Cache

```typescript
// ValidationService.validateFilters() removes unknown fields
// Example: User cached filter has "company_id" but column was renamed

// Input (from localStorage cache):
{ company_id: 5, first_name: "John" }

// After validateFilters():
{ first_name: "John" }  // company_id silently removed

// Without this: PostgREST returns 400 "column company_id does not exist"
```

---

## Consequences

### Positive

- **Seamless Error Display**: React Admin shows field-level errors inline without custom form logic
- **Single Transformation Point**: Zod→RA format conversion in one place
- **Stale Cache Resilience**: Old filters don't break queries after schema changes
- **Composition Compatible**: Works with `withLifecycleCallbacks` and `withErrorLogging`

### Negative

- **Silent Filter Removal**: Invalid filter fields are removed silently, which might hide bugs
- **Wrapper Overhead**: One more function in the composition chain
- **Validation Happens Before Transform**: Raw form data validated, not transformed data

### Neutral

- **ValidationService Dependency**: Wrapper depends on ValidationService, but this is already centralized
- **Pass-Through for Unknown Resources**: Resources without schemas skip validation automatically

---

## Code Examples

### Correct Pattern - Handler Using Wrapper

```typescript
// src/atomic-crm/providers/supabase/handlers/contactsHandler.ts

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { contactsCallbacks } from "../callbacks";

export function createContactsHandler(baseProvider: DataProvider): DataProvider {
  // Critical order: base → validation → lifecycle → logging
  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseProvider),  // Validation wraps base
      [contactsCallbacks]
    )
  );
}
```

### Correct Pattern - Nested Path Handling

```typescript
// Input: Zod error for JSONB array field
{
  issues: [
    { path: ["email", 0, "address"], message: "Invalid email" },
    { path: ["email", 1, "type"], message: "Unknown type" }
  ]
}

// Output: React Admin format with dot-notation
{
  body: {
    errors: {
      "email.0.address": "Invalid email",
      "email.1.type": "Unknown type"
    }
  }
}

// React Admin displays these under the ArrayInput component
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Transform in form component
function ContactCreate() {
  const handleError = (error) => {
    // NEVER: Transformation should happen in provider layer
    if (error.issues) {
      const transformed = transformZodToReactAdmin(error);
      setErrors(transformed.body.errors);
    }
  };
}
```

```typescript
// WRONG: Wrong composition order
export function createBrokenHandler(base: DataProvider): DataProvider {
  return withErrorLogging(
    withValidation(  // WRONG: Validation after lifecycle
      withLifecycleCallbacks(base, [callbacks])
    )
  );
  // Bug: Lifecycle transforms data BEFORE validation,
  // so validation sees transformed field names
}
```

```typescript
// WRONG: Throwing raw Zod errors
async create(resource, params) {
  const result = schema.safeParse(params.data);
  if (!result.success) {
    throw result.error;  // NEVER: React Admin can't display this
  }
}
```

---

## Related ADRs

- **[ADR-002: Zod Validation at API Boundary](./ADR-002-zod-api-boundary.md)** - Why validation lives in provider, not forms
- **[ADR-009: Composed Data Provider Pattern](./ADR-009-composed-data-provider.md)** - How this wrapper fits in composition chain
- **[ADR-001: Unified Data Provider Entry Point](./ADR-001-unified-data-provider.md)** - The entry point that uses this wrapper

---

## References

- Wrapper Implementation: `src/atomic-crm/providers/supabase/wrappers/withValidation.ts`
- ValidationService: `src/atomic-crm/providers/supabase/services/ValidationService.ts`
- React Admin Error Format: https://marmelab.com/react-admin/CreateEdit.html#server-side-validation
- Zod Error Handling: https://zod.dev/ERROR_HANDLING
