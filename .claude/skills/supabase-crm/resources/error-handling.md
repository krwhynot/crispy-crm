# Error Handling

## Purpose

Error handling patterns provide consistent error responses across the application. This resource covers custom error hierarchies, Supabase error mapping, user-friendly messages, and structured logging for debugging.

## Core Pattern

### Custom Error Hierarchy

**Create domain-specific error classes for different failure types.**

```typescript
// Base service error
export class ServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Validation errors (400)
export class ValidationError extends ServiceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

// Not found errors (404)
export class NotFoundError extends ServiceError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND', { entity, id });
    this.name = 'NotFoundError';
  }
}

// Business rule violations (422)
export class BusinessRuleError extends ServiceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'BUSINESS_RULE_VIOLATION', context);
    this.name = 'BusinessRuleError';
  }
}

// Authorization errors (403)
export class AuthorizationError extends ServiceError {
  constructor(message: string = 'Not authorized', context?: Record<string, any>) {
    super(message, 'NOT_AUTHORIZED', context);
    this.name = 'AuthorizationError';
  }
}

// Database errors (500)
export class DatabaseError extends ServiceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', context);
    this.name = 'DatabaseError';
  }
}
```

## Real-World Example: Service Layer Error Handling

**From `src/atomic-crm/.claude/skills/supabase-crm/resources/service-layer.md`:**

```typescript
export class OrganizationService {
  constructor(private dataProvider: DataProvider) {}

  async getOrganization(id: string): Promise<Organization> {
    try {
      const { data } = await this.dataProvider.getOne<Organization>('organizations', {
        id
      });

      if (!data) {
        throw new NotFoundError('Organization', id);
      }

      return data;
    } catch (error) {
      // Re-throw domain errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log unexpected errors with context
      console.error(`[OrganizationService] Unexpected error`, {
        id,
        error
      });

      // Wrap in database error
      throw new DatabaseError(
        'Failed to retrieve organization',
        { id, originalError: error }
      );
    }
  }

  async createOrganization(input: CreateOrgInput): Promise<Organization> {
    try {
      // 1. Validate at boundary
      const validated = CreateOrgSchema.parse(input);

      // 2. Business rule validation
      await this.validateBusinessRules(validated);

      // 3. Create via DataProvider
      const { data } = await this.dataProvider.create<Organization>('organizations', {
        data: validated
      });

      return data;
    } catch (error: any) {
      // Zod validation errors → ValidationError
      if (error.name === 'ZodError') {
        throw new ValidationError('Invalid organization data', {
          issues: error.issues
        });
      }

      // Business rule errors → pass through
      if (error instanceof BusinessRuleError) {
        throw error;
      }

      // Log and wrap unexpected errors
      console.error(`[OrganizationService] Failed to create organization`, {
        input,
        error
      });

      throw new DatabaseError(
        `Organization creation failed: ${error.message}`,
        { input, originalError: error }
      );
    }
  }

  private async validateBusinessRules(input: CreateOrgInput): Promise<void> {
    // Check for duplicates
    const existing = await this.dataProvider.getList<Organization>('organizations', {
      filter: { name: input.name },
      pagination: { page: 1, perPage: 1 }
    });

    if (existing.total > 0) {
      throw new BusinessRuleError(
        `Organization with name "${input.name}" already exists`,
        { existingId: existing.data[0].id }
      );
    }
  }
}
```

## Error Handling Patterns by Use Case

### Pattern 1: Edge Function Error Responses

**Use for:** Consistent HTTP error responses in Edge Functions

```typescript
// Helper function for error responses
function createErrorResponse(
  status: number,
  message: string,
  corsHeaders: Record<string, string>
) {
  return new Response(
    JSON.stringify({ status, message }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status,
    }
  );
}

// Edge Function with error handling
Deno.serve(async (req: Request) => {
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse(401, "Unauthorized", corsHeaders);
    }

    const localClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await localClient.auth.getUser();
    if (!user) {
      return createErrorResponse(401, "Unauthorized", corsHeaders);
    }

    // 2. Validate request body
    const body = await req.json();
    const validated = RequestSchema.parse(body);

    // 3. Execute business logic
    const result = await processRequest(validated);

    // 4. Return success response
    return new Response(
      JSON.stringify({ data: result }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );
  } catch (error: any) {
    // Zod validation errors
    if (error.name === 'ZodError') {
      return createErrorResponse(400, "Invalid request data", corsHeaders);
    }

    // Business rule errors
    if (error instanceof BusinessRuleError) {
      return createErrorResponse(422, error.message, corsHeaders);
    }

    // Authorization errors
    if (error instanceof AuthorizationError) {
      return createErrorResponse(403, error.message, corsHeaders);
    }

    // Log unexpected errors
    console.error("Edge Function error:", error);

    // Generic error response
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }
});
```

### Pattern 2: Supabase Error Mapping

**Use for:** Converting Supabase errors to domain errors

```typescript
// Supabase error codes
const SUPABASE_ERROR_CODES = {
  PGRST116: 'Not found',
  PGRST301: 'Permission denied',
  PGRST202: 'Column does not exist',
  '23505': 'Unique constraint violation',
  '23503': 'Foreign key violation',
  '23502': 'Not null violation',
} as const;

// Map Supabase errors to domain errors
export function mapSupabaseError(error: any): ServiceError {
  const code = error.code || error.status?.toString();
  const message = error.message || 'Unknown error';

  // RLS permission denied
  if (code === 'PGRST301' || code === '401') {
    return new AuthorizationError('Access denied', { originalError: error });
  }

  // Not found
  if (code === 'PGRST116' || code === '404') {
    return new NotFoundError('Resource', 'unknown');
  }

  // Schema errors (missing column/table)
  if (code === 'PGRST202' || message.includes('does not exist')) {
    return new DatabaseError('Schema error: ' + message, { originalError: error });
  }

  // Unique constraint violation
  if (code === '23505') {
    return new BusinessRuleError('Duplicate record', { originalError: error });
  }

  // Foreign key violation
  if (code === '23503') {
    return new BusinessRuleError('Referenced record does not exist', { originalError: error });
  }

  // Not null violation
  if (code === '23502') {
    return new ValidationError('Required field missing', { originalError: error });
  }

  // Generic database error
  return new DatabaseError(message, { code, originalError: error });
}

// Usage in data provider
async function getOne<T>(resource: string, params: GetOneParams): Promise<T> {
  try {
    const { data, error } = await supabase
      .from(resource)
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      throw mapSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundError(resource, params.id.toString());
    }

    return data as T;
  } catch (error) {
    // Re-throw domain errors
    if (error instanceof ServiceError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new DatabaseError('Failed to fetch record', { error });
  }
}
```

### Pattern 3: Schema Error Detection

**Use for:** Detecting and handling database schema mismatches

**From `src/atomic-crm/tests/httpErrorPatterns.test.ts`:**

```typescript
// Detect schema errors
export function isSchemaError(error: any): boolean {
  return (
    error?.message?.includes("does not exist") ||
    error?.message?.includes("column") ||
    error?.message?.includes("relation")
  );
}

// Extract details from schema errors
export function extractSchemaErrorDetails(errorMessage: string): {
  type: "column" | "relation" | "unknown";
  table?: string;
  field?: string;
} {
  // Column error: "column contacts_summary.nb_tasks does not exist"
  const columnMatch = errorMessage.match(/column (\w+)\.(\w+) does not exist/);
  if (columnMatch) {
    return {
      type: "column",
      table: columnMatch[1],
      field: columnMatch[2],
    };
  }

  // Relation error: 'relation "public.deals" does not exist'
  const relationMatch = errorMessage.match(/relation "public\.(\w+)" does not exist/);
  if (relationMatch) {
    return {
      type: "relation",
      table: relationMatch[1],
    };
  }

  return { type: "unknown" };
}

// Usage in error handler
catch (error: any) {
  if (isSchemaError(error)) {
    const details = extractSchemaErrorDetails(error.message);

    console.error('[Schema Error]', {
      type: details.type,
      table: details.table,
      field: details.field,
      hint: details.type === 'relation'
        ? `Table "${details.table}" may have been renamed or deleted`
        : `Field "${details.field}" may not exist in view "${details.table}"`,
    });

    // Provide user-friendly error
    throw new DatabaseError(
      'Database schema mismatch. Please refresh the page.',
      details
    );
  }

  throw error;
}
```

### Pattern 4: Structured Logging

**Use for:** Debugging with context-rich logs

**From `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`:**

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
    error: error instanceof Error ? error.message : error?.message ? error.message : String(error),
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

// Usage in data provider methods
async create<T>(resource: string, params: CreateParams): Promise<T> {
  try {
    // Validate
    await validateData(resource, params.data, 'create');

    // Transform
    const transformed = await transformData(resource, params.data, 'create');

    // Create
    const { data } = await baseDataProvider.create(resource, {
      ...params,
      data: transformed,
    });

    return data;
  } catch (error) {
    // Log with context
    logError('create', resource, params, error);

    // Re-throw
    throw error;
  }
}
```

### Pattern 5: React Admin Error Format

**Use for:** Converting errors to React Admin's expected format

```typescript
// Convert domain errors to React Admin format
export function toReactAdminError(error: ServiceError): {
  message: string;
  errors?: Record<string, string>;
  status?: number;
} {
  // Validation errors have field-level details
  if (error instanceof ValidationError) {
    return {
      message: error.message,
      errors: error.context?.fields || {},
      status: 400,
    };
  }

  // Not found errors
  if (error instanceof NotFoundError) {
    return {
      message: error.message,
      status: 404,
    };
  }

  // Authorization errors
  if (error instanceof AuthorizationError) {
    return {
      message: error.message,
      status: 403,
    };
  }

  // Business rule errors
  if (error instanceof BusinessRuleError) {
    return {
      message: error.message,
      status: 422,
    };
  }

  // Database errors
  return {
    message: error.message,
    status: 500,
  };
}

// Usage in data provider wrapper
catch (error) {
  if (error instanceof ServiceError) {
    throw toReactAdminError(error);
  }

  // Unknown error
  throw {
    message: 'An unexpected error occurred',
    status: 500,
  };
}
```

### Pattern 6: Promise.allSettled for Bulk Operations

**Use for:** Graceful handling of partial failures in bulk operations

**From CLAUDE.md Error Handling Patterns:**

```typescript
// ❌ BAD: Promise.all() fails completely if one operation fails
const results = await Promise.all(
  items.map(item => update("resource", { id: item.id, data: { status: "active" } }))
);

// ✅ GOOD: Promise.allSettled() handles partial failures
const results = await Promise.allSettled(
  items.map(item => update("resource", { id: item.id, data: { status: "active" } }))
);

// Count successes and failures
const successes = results.filter(r => r.status === "fulfilled").length;
const failures = results.filter(r => r.status === "rejected").length;

// Provide informative user feedback
if (failures === 0) {
  notify(`${successes} items updated`, { type: "success" });
} else if (successes > 0) {
  notify(`${successes} succeeded, ${failures} failed`, { type: "warning" });
} else {
  notify("All updates failed", { type: "error" });
}

// Get details of failures
const failedResults = results
  .filter((r): r is PromiseRejectedResult => r.status === "rejected")
  .map(r => r.reason);

console.error('[Bulk Operation Failures]', failedResults);
```

## User-Friendly Error Messages

### Error Message Guidelines

```typescript
// ✅ GOOD: Clear, actionable, user-friendly
throw new NotFoundError('Organization', id);
// → "Organization not found: 123"

throw new ValidationError('Email address is required');
// → "Email address is required"

throw new BusinessRuleError('Maximum hierarchy depth (2 levels) exceeded');
// → "Maximum hierarchy depth (2 levels) exceeded"

// ❌ BAD: Technical, unclear, unhelpful
throw new Error('PGRST116');
throw new Error('null reference');
throw new Error('Failed');
```

### Converting Technical Errors to User Messages

```typescript
export function getUserFriendlyMessage(error: ServiceError): string {
  // Map error codes to user messages
  const messageMap: Record<string, string> = {
    'VALIDATION_ERROR': 'Please check your input and try again',
    'NOT_FOUND': 'The requested item could not be found',
    'NOT_AUTHORIZED': 'You do not have permission to perform this action',
    'BUSINESS_RULE_VIOLATION': error.message, // Use specific message
    'DATABASE_ERROR': 'A system error occurred. Please try again later',
  };

  return messageMap[error.code] || 'An unexpected error occurred';
}

// Usage in UI
catch (error) {
  if (error instanceof ServiceError) {
    const userMessage = getUserFriendlyMessage(error);
    notify(userMessage, { type: 'error' });

    // Log technical details for debugging
    console.error('[Error Details]', {
      code: error.code,
      message: error.message,
      context: error.context,
    });
  }
}
```

## Testing Error Handling

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import {
  NotFoundError,
  ValidationError,
  BusinessRuleError,
  mapSupabaseError,
} from './errors';

describe('Error Handling', () => {
  describe('Custom Errors', () => {
    it('should create NotFoundError with entity and id', () => {
      const error = new NotFoundError('Organization', '123');

      expect(error.name).toBe('NotFoundError');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Organization not found: 123');
      expect(error.context).toEqual({ entity: 'Organization', id: '123' });
    });

    it('should create ValidationError with context', () => {
      const error = new ValidationError('Invalid email', {
        field: 'email',
        value: 'not-an-email',
      });

      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context?.field).toBe('email');
    });
  });

  describe('Supabase Error Mapping', () => {
    it('should map RLS error to AuthorizationError', () => {
      const supabaseError = {
        code: 'PGRST301',
        message: 'permission denied',
      };

      const mapped = mapSupabaseError(supabaseError);

      expect(mapped).toBeInstanceOf(AuthorizationError);
      expect(mapped.code).toBe('NOT_AUTHORIZED');
    });

    it('should map unique constraint to BusinessRuleError', () => {
      const supabaseError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      };

      const mapped = mapSupabaseError(supabaseError);

      expect(mapped).toBeInstanceOf(BusinessRuleError);
      expect(mapped.message).toContain('Duplicate');
    });
  });

  describe('Schema Error Detection', () => {
    it('should detect column errors', () => {
      const error = new Error('column contacts_summary.nb_tasks does not exist');

      expect(isSchemaError(error)).toBe(true);

      const details = extractSchemaErrorDetails(error.message);
      expect(details.type).toBe('column');
      expect(details.table).toBe('contacts_summary');
      expect(details.field).toBe('nb_tasks');
    });

    it('should detect relation errors', () => {
      const error = new Error('relation "public.deals" does not exist');

      expect(isSchemaError(error)).toBe(true);

      const details = extractSchemaErrorDetails(error.message);
      expect(details.type).toBe('relation');
      expect(details.table).toBe('deals');
    });
  });
});
```

## Best Practices

### DO
✅ Use custom error classes for different failure types
✅ Include context in errors for debugging
✅ Log errors with structured context
✅ Map database errors to domain errors
✅ Provide user-friendly error messages
✅ Use Promise.allSettled for bulk operations
✅ Test error handling paths
✅ Re-throw domain errors (don't wrap twice)

### DON'T
❌ Swallow errors silently
❌ Use generic `Error` class everywhere
❌ Show technical error messages to users
❌ Skip logging context information
❌ Use `Promise.all` for bulk operations
❌ Catch errors without re-throwing or handling
❌ Mix error handling concerns (separation of concerns)

## Related Resources

- [Service Layer](service-layer.md) - Error handling in services
- [Validation Patterns](validation-patterns.md) - Validation error creation
- [Edge Functions](edge-functions.md) - Edge Function error responses
- [Query Optimization](query-optimization.md) - Database error handling
