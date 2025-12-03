# Error Handling: Validation Errors

## Purpose

Document structured error logging and validation error formatting for React Admin integration.

## Pattern: Structured Error Logging

### Comprehensive Error Context

**From `src/atomic-crm/providers/supabase/unifiedDataProvider.ts:85`:**

```typescript
/**
 * Log error with context for debugging
 */
function logError(method: string, resource: string, params: any, error: unknown): void {
  const context = {
    method,
    resource,
    params: {
      id: params?.id,
      ids: params?.ids,
      filter: params?.filter,
      sort: params?.sort,
      pagination: params?.pagination,
      target: params?.target,
      data: params?.data ? "[Data Present]" : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  console.error(`[DataProvider Error]`, context, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    validationErrors: error?.body?.errors || error?.errors || undefined,
    fullError: error,
  });

  // Log validation errors in detail for debugging
  if (error?.body?.errors) {
    console.error("[Validation Errors Detail]", JSON.stringify(error.body.errors, null, 2));
  } else if (error?.errors) {
    console.error("[Validation Errors Detail]", JSON.stringify(error.errors, null, 2));
  }
}
```

**What gets logged:**
- Method and resource (getOne, create, update, etc.)
- Parameters (id, filter, sort, pagination)
- Error message and stack trace
- Validation errors (if present)
- Timestamp

**Usage in data provider:**
```typescript
async getOne<RecordType extends RaRecord>(
  resource: string,
  params: GetOneParams
): Promise<GetOneResult<RecordType>> {
  try {
    const result = await baseDataProvider.getOne<RecordType>(resource, params);
    return normalizeResponseData(result);
  } catch (error) {
    logError("getOne", resource, params, error);
    throw error; // Re-throw after logging
  }
}
```

## Pattern: Zod to React Admin Error Format

**From `src/atomic-crm/providers/supabase/unifiedDataProvider.ts:136`:**

```typescript
async function validateData(
  resource: string,
  data: any,
  operation: "create" | "update" = "create"
): Promise<void> {
  try {
    await validationService.validate(resource, operation, data);
  } catch (error: any) {
    // Parse Zod validation errors into React Admin format
    if (error.issues && Array.isArray(error.issues)) {
      const fieldErrors: Record<string, string> = {};

      // Convert Zod issues to field-error map
      for (const issue of error.issues) {
        const fieldPath = issue.path.join(".");
        const fieldName = fieldPath || "_error";
        fieldErrors[fieldName] = issue.message;
      }

      throw {
        message: "Validation failed",
        errors: fieldErrors,
      };
    }

    // If already in expected format
    if (error.errors && typeof error.errors === "object") {
      throw {
        message: error.message || "Validation failed",
        errors: error.errors,
      };
    }

    // Wrap unknown error format
    throw {
      message: "Validation failed",
      errors: { _error: String(error) },
    };
  }
}
```

### Error Format Transformation

```typescript
// Zod validation error (input)
{
  issues: [
    {
      path: ["first_name"],
      message: "First name is required"
    },
    {
      path: ["email", 0, "email"],
      message: "Invalid email address"
    }
  ]
}

// React Admin error format (output)
{
  message: "Validation failed",
  errors: {
    "first_name": "First name is required",
    "email.0.email": "Invalid email address"
  }
}
```

**Why this matters:**
- React Admin displays field-level errors next to inputs
- Dot notation for nested fields (JSONB arrays)
- `_error` for form-level errors

### Form Error Display

```typescript
// React Admin automatically displays errors
<TextInput
  source="first_name"
  label="First Name"
/>
// Error shows inline below input: "First name is required"

// For JSONB arrays
<ArrayInput source="email">
  <SimpleFormIterator>
    <TextInput source="email" label="Email" />
    <SelectInput source="type" choices={emailTypes} />
  </SimpleFormIterator>
</ArrayInput>
// Error shows inline: "email.0.email: Invalid email address"
```

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Error logging | Include method, resource, params, timestamp | Just `console.error(error)` |
| Validation errors | Format as `{ message, errors: {} }` | Throw raw Zod error |
| Field paths | Use dot notation for nested (`email.0.email`) | Lose nested path info |
| Form-level errors | Use `_error` key | Use arbitrary key names |

## Related Resources

- [error-handling-basics.md](error-handling-basics.md) - Fail-fast core patterns
- [error-handling-bulk.md](error-handling-bulk.md) - Promise.allSettled patterns
- [validation-patterns.md](validation-patterns.md) - Zod schema patterns

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
