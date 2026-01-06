# Error Handling & Validation Patterns

## Table of Contents
1. [React Admin Error Format](#react-admin-error-format)
2. [Zod to React Admin Mapping](#zod-to-react-admin-mapping)
3. [Supabase Error Handling](#supabase-error-handling)
4. [HTTP Status Codes](#http-status-codes)
5. [Complete Error Handler](#complete-error-handler)

---

## React Admin Error Format

React Admin expects validation errors in a specific JSON structure for form field highlighting.

### Required Structure

```typescript
// For form validation errors
throw new HttpError('Validation Error', 400, {
  errors: {
    field_name: 'Error message for this field',
    'nested.field': 'Error message for nested field',
  }
});
```

### How React Admin Uses This

```tsx
// React Admin automatically maps errors to form fields
<TextInput source="email" />  // Shows error if errors.email exists
<TextInput source="contact.phone" />  // Shows error if errors['contact.phone'] exists
```

---

## Zod to React Admin Mapping

### The Problem

Zod errors have a different structure than React Admin expects:

```typescript
// Zod Error Structure
{
  issues: [
    { path: ['email'], message: 'Invalid email' },
    { path: ['contact', 'phone'], message: 'Required' },
  ]
}

// React Admin Expects
{
  errors: {
    'email': 'Invalid email',
    'contact.phone': 'Required',
  }
}
```

### The Solution

```typescript
import { ZodError } from 'zod';
import { HttpError } from 'react-admin';

export const mapZodErrorToReactAdmin = (error: ZodError): never => {
  const fieldErrors = error.issues.reduce((acc, issue) => {
    // Join path array with dots for nested fields
    const fieldName = issue.path.join('.');
    acc[fieldName] = issue.message;
    return acc;
  }, {} as Record<string, string>);

  throw new HttpError('Validation Error', 400, {
    errors: fieldErrors
  });
};
```

### Usage in Handler

```typescript
const create = async (params: any) => {
  try {
    const validated = contactSchema.parse(params.data);
    // ... create logic
  } catch (error) {
    if (error instanceof ZodError) {
      mapZodErrorToReactAdmin(error);
    }
    throw error;
  }
};
```

---

## Supabase Error Handling

### Common Supabase Errors

```typescript
// RLS Policy Violation
{
  code: '42501',
  message: 'new row violates row-level security policy',
  hint: null
}

// Foreign Key Violation
{
  code: '23503',
  message: 'insert or update on table "contacts" violates foreign key constraint',
  details: 'Key (organization_id)=(123) is not present in table "organizations".'
}

// Unique Constraint Violation
{
  code: '23505',
  message: 'duplicate key value violates unique constraint',
  details: 'Key (email)=(test@example.com) already exists.'
}

// Not Found
{
  code: 'PGRST116',
  message: 'JSON object requested, multiple (or no) rows returned'
}
```

### Mapping to React Admin

```typescript
import { HttpError } from 'react-admin';

export const mapSupabaseError = (error: any): never => {
  const code = error.code;

  // RLS Policy Violation → 403 Forbidden
  if (code === '42501') {
    throw new HttpError(
      'Permission denied',
      403,
      { message: 'You do not have permission to perform this action.' }
    );
  }

  // Foreign Key Violation → 400 with field error
  if (code === '23503') {
    const match = error.details?.match(/Key \((\w+)\)/);
    const field = match ? match[1] : 'id';
    throw new HttpError('Invalid reference', 400, {
      errors: { [field]: 'Referenced record does not exist' }
    });
  }

  // Unique Constraint → 409 Conflict with field error
  if (code === '23505') {
    const match = error.details?.match(/Key \((\w+)\)/);
    const field = match ? match[1] : 'id';
    throw new HttpError('Duplicate value', 409, {
      errors: { [field]: 'This value already exists' }
    });
  }

  // Not Found → 404
  if (code === 'PGRST116') {
    throw new HttpError('Not found', 404, {
      message: 'The requested record was not found.'
    });
  }

  // Generic error
  throw new HttpError(
    error.message || 'Database error',
    500,
    { message: error.message }
  );
};
```

---

## HTTP Status Codes

### Standard Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| **400** | Bad Request | Validation errors (Zod), malformed input |
| **401** | Unauthorized | Missing or invalid auth token |
| **403** | Forbidden | RLS policy violation, insufficient permissions |
| **404** | Not Found | Record doesn't exist |
| **409** | Conflict | Unique constraint violation, FK violation |
| **422** | Unprocessable | Valid syntax but semantic error |
| **500** | Server Error | Unexpected errors, database down |

### Mapping Table

| Supabase Code | HTTP Status | React Admin Behavior |
|---------------|-------------|---------------------|
| `42501` (RLS) | 403 | Shows notification |
| `23503` (FK) | 400 | Highlights field |
| `23505` (Unique) | 409 | Highlights field |
| `PGRST116` (Not found) | 404 | Redirects to list |
| Zod validation | 400 | Highlights fields |

---

## Complete Error Handler

### Full Implementation

```typescript
// src/providers/supabase/utils/errorHandler.ts

import { HttpError } from 'react-admin';
import { ZodError } from 'zod';

interface SupabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

export class DataProviderError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: Record<string, any>
  ) {
    super(message);
    this.name = 'DataProviderError';
  }
}

/**
 * Maps any error to React Admin's expected HttpError format
 */
export const handleError = (error: unknown): never => {
  // Already an HttpError - re-throw
  if (error instanceof HttpError) {
    throw error;
  }

  // Zod validation error
  if (error instanceof ZodError) {
    const fieldErrors = error.issues.reduce((acc, issue) => {
      const fieldName = issue.path.join('.');
      acc[fieldName] = issue.message;
      return acc;
    }, {} as Record<string, string>);

    throw new HttpError('Validation Error', 400, { errors: fieldErrors });
  }

  // Supabase error (has code property)
  if (isSupabaseError(error)) {
    handleSupabaseError(error);
  }

  // Generic error
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new HttpError(message, 500, { message });
};

function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string'
  );
}

function handleSupabaseError(error: SupabaseError): never {
  const { code, message, details } = error;

  // RLS Policy Violation
  if (code === '42501') {
    throw new HttpError('Permission denied', 403, {
      message: 'You do not have permission to perform this action.',
    });
  }

  // Foreign Key Violation
  if (code === '23503') {
    const match = details?.match(/Key \((\w+)\)/);
    const field = match ? match[1] : 'reference';
    throw new HttpError('Invalid reference', 400, {
      errors: { [field]: 'Referenced record does not exist' },
    });
  }

  // Unique Constraint Violation
  if (code === '23505') {
    const match = details?.match(/Key \((\w+)\)/);
    const field = match ? match[1] : 'value';
    throw new HttpError('Duplicate value', 409, {
      errors: { [field]: 'This value already exists' },
    });
  }

  // Not Null Violation
  if (code === '23502') {
    const match = details?.match(/column "(\w+)"/);
    const field = match ? match[1] : 'field';
    throw new HttpError('Missing required field', 400, {
      errors: { [field]: 'This field is required' },
    });
  }

  // Record Not Found
  if (code === 'PGRST116') {
    throw new HttpError('Not found', 404, {
      message: 'The requested record was not found.',
    });
  }

  // Generic database error
  throw new HttpError(message || 'Database error', 500, { message });
}
```

### Using in Handlers

```typescript
import { handleError } from '../utils/errorHandler';

const create = async (params: any) => {
  try {
    const validated = contactSchema.parse(params.data);
    const { data, error } = await supabase
      .from('contacts')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    handleError(error); // Never returns, always throws HttpError
  }
};
```

---

## Testing Error Handling

### Unit Test Examples

```typescript
import { handleError } from './errorHandler';
import { ZodError } from 'zod';
import { HttpError } from 'react-admin';

describe('handleError', () => {
  it('maps Zod errors to field errors', () => {
    const zodError = new ZodError([
      { path: ['email'], message: 'Invalid email', code: 'custom' },
    ]);

    expect(() => handleError(zodError)).toThrow(HttpError);
    try {
      handleError(zodError);
    } catch (e) {
      expect(e.status).toBe(400);
      expect(e.body.errors.email).toBe('Invalid email');
    }
  });

  it('maps RLS violations to 403', () => {
    const rlsError = { code: '42501', message: 'RLS violation' };

    expect(() => handleError(rlsError)).toThrow(HttpError);
    try {
      handleError(rlsError);
    } catch (e) {
      expect(e.status).toBe(403);
    }
  });
});
```
