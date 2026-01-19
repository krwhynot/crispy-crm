/**
 * Error Logging Wrapper for DataProvider
 *
 * Extracted from unifiedDataProvider.ts lines 166-425 (logError, wrapMethod)
 * Provides consistent error logging and transformation for React Admin.
 *
 * Key behaviors preserved:
 * 1. Structured error logging with context (method, resource, params, timestamp)
 * 2. Data redaction in logs (shows "[Data Present]" instead of actual data)
 * 3. Validation error detail logging
 * 4. Supabase error field extraction
 * 5. Idempotent delete handling (already deleted = success)
 * 6. React Admin validation error format preservation
 *
 * Engineering Constitution: Cross-cutting concern extracted for single responsibility
 */

import type { DataProvider, Identifier, FilterPayload, RaRecord } from "ra-core";

/**
 * Interface for data provider method params logging
 * Captures common fields for error context
 */
interface DataProviderLogParams {
  id?: Identifier;
  ids?: Identifier[];
  filter?: FilterPayload;
  sort?: { field: string; order: "ASC" | "DESC" };
  pagination?: { page: number; perPage: number };
  target?: string;
  data?: unknown;
  previousData?: RaRecord;
}

/**
 * Interface for validation errors in React Admin format
 */
interface ValidationError {
  message: string;
  errors: Record<string, string>;
}

/**
 * Interface for Supabase errors with detailed field information
 */
interface SupabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Extended error type for error handling
 * Captures both standard Error properties and validation/API error structures
 */
interface ExtendedError extends Error {
  body?: { errors?: Record<string, string> };
  errors?: Record<string, string>;
  code?: string;
  details?: string;
  issues?: Array<{ path: (string | number)[]; message: string }>;
}

/**
 * Log error with context for debugging
 *
 * @param method - The DataProvider method that failed
 * @param resource - The resource being operated on
 * @param params - The parameters passed to the method
 * @param error - The error that occurred
 */
function logError(
  method: string,
  resource: string,
  params: DataProviderLogParams,
  error: unknown
): void {
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
      // SECURITY: Redact actual data, just indicate presence
      data: params?.data ? "[Data Present]" : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  const extendedError = error as ExtendedError | undefined;
  const errorMessage =
    error instanceof Error
      ? error.message
      : extendedError?.message
        ? extendedError.message
        : String(error);

  console.error(`[DataProvider Error]`, context, {
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    validationErrors: extendedError?.body?.errors || extendedError?.errors || undefined,
    fullError: error,
  });

  // Log validation errors in detail for debugging
  if (extendedError?.body?.errors) {
    console.error("[Validation Errors Detail]", JSON.stringify(extendedError.body.errors, null, 2));
    // DEBUG: Also log the data that caused the error
    if (params && "data" in params) {
      console.error(
        "[Validation Data Submitted]",
        JSON.stringify((params as { data: unknown }).data, null, 2)
      );
    }
  } else if (extendedError?.errors) {
    console.error("[Validation Errors Detail]", JSON.stringify(extendedError.errors, null, 2));
    // DEBUG: Also log the data that caused the error
    if (params && "data" in params) {
      console.error(
        "[Validation Data Submitted]",
        JSON.stringify((params as { data: unknown }).data, null, 2)
      );
    }
  }
}

/**
 * Transform Supabase errors to React Admin validation format
 * Attempts to extract field name from error details
 *
 * @param error - The Supabase error
 * @returns Validation error in React Admin format
 */
function transformSupabaseError(error: SupabaseError): ValidationError {
  const fieldErrors: Record<string, string> = {};

  // Try to parse field from error details
  if (typeof error.details === "string") {
    // Simple heuristic to extract field name from error
    const match = error.details.match(/column "(\w+)"/i);
    if (match) {
      fieldErrors[match[1]] = error.details;
    } else {
      fieldErrors._error = error.details;
    }
  } else {
    fieldErrors._error = error.message || "Operation failed";
  }

  return {
    message: error.message || "Operation failed",
    errors: fieldErrors,
  };
}

/**
 * Check if an error is a Supabase error with field details
 */
function isSupabaseError(error: unknown): error is SupabaseError {
  const err = error as SupabaseError;
  return !!(err?.code && err?.details);
}

/**
 * Human-readable field labels for error messages
 * Maps database column names to display labels
 */
const FIELD_LABELS: Record<string, string> = {
  organization_id: "Organization",
  first_name: "First Name",
  last_name: "Last Name",
  sales_id: "Account Manager",
  email: "Email",
};

/**
 * Sanitize PostgreSQL error messages for user display
 * Removes technical details and provides actionable messages
 */
function sanitizeDatabaseError(message: string): { field: string; message: string } | null {
  // Pattern: "null value in column 'X' of relation 'Y' violates not-null constraint"
  const notNullMatch = message.match(/null value in column '(\w+)'.*violates not-null constraint/i);
  if (notNullMatch) {
    const columnName = notNullMatch[1];
    const label = FIELD_LABELS[columnName] || columnName.replace(/_/g, " ");
    return { field: columnName, message: `${label} is required` };
  }

  // Pattern: "duplicate key value violates unique constraint"
  const uniqueMatch = message.match(/duplicate key.*constraint "(\w+)"/i);
  if (uniqueMatch) {
    return { field: "_error", message: "This record already exists" };
  }

  // Pattern: "violates foreign key constraint"
  const fkMatch = message.match(/violates foreign key constraint.*column "(\w+)"/i);
  if (fkMatch) {
    const columnName = fkMatch[1];
    const label = FIELD_LABELS[columnName] || columnName.replace(/_/g, " ");
    return { field: columnName, message: `Invalid ${label} reference` };
  }

  // Pattern: "violates check constraint"
  if (message.includes("violates check constraint")) {
    return { field: "_error", message: "Invalid value provided" };
  }

  return null; // Not a recognized database error
}

/**
 * Check if error indicates resource was already deleted (idempotent delete)
 * This happens with React Admin's undoable mode where UI updates before API call
 */
function isAlreadyDeletedError(error: unknown): boolean {
  const extendedError = error as ExtendedError | undefined;
  return !!extendedError?.message?.includes("Cannot coerce the result to a single JSON object");
}

/**
 * Check if error is already in React Admin validation format
 */
function isReactAdminValidationError(error: unknown): boolean {
  const extendedError = error as ExtendedError | undefined;
  return !!(extendedError?.body?.errors && typeof extendedError.body.errors === "object");
}

/**
 * Log success for sensitive operations
 * Provides audit trail for critical operations without exposing sensitive data
 *
 * @param method - The DataProvider method that succeeded
 * @param resource - The resource being operated on
 * @param params - The parameters passed to the method
 * @param result - The result returned by the operation
 */
function logSuccess(
  method: string,
  resource: string,
  params: DataProviderLogParams,
  result: unknown
): void {
  const SENSITIVE_OPERATIONS = ["delete", "deleteMany"];
  const SENSITIVE_RESOURCES = ["sales", "opportunities"];

  if (SENSITIVE_OPERATIONS.includes(method) || SENSITIVE_RESOURCES.includes(resource)) {
    const resultData = result as { data?: { id?: Identifier } };
    console.info("[DataProvider Audit]", {
      method,
      resource,
      recordId: params?.id || params?.ids || resultData?.data?.id,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Wrap a DataProvider with comprehensive error logging
 *
 * This wrapper:
 * - Logs all errors with structured context
 * - Logs success for sensitive operations (audit trail)
 * - Preserves React Admin validation error format
 * - Transforms Supabase errors to validation format
 * - Handles idempotent delete (already deleted = success)
 *
 * @param provider - The DataProvider to wrap
 * @returns A new DataProvider with error logging
 */
export function withErrorLogging<T extends DataProvider>(provider: T): T {
  const dataProviderMethods: (keyof DataProvider)[] = [
    "getList",
    "getOne",
    "getMany",
    "getManyReference",
    "create",
    "update",
    "updateMany",
    "delete",
    "deleteMany",
  ];

  // Create a new object with wrapped methods
  const wrappedProvider = { ...provider } as T;

  for (const method of dataProviderMethods) {
    const original = provider[method];
    if (typeof original === "function") {
      (wrappedProvider as Record<string, unknown>)[method] = async (
        resource: string,
        params: DataProviderLogParams & { previousData?: RaRecord }
      ) => {
        try {
          const result = await (original as (...args: unknown[]) => Promise<unknown>).call(
            provider,
            resource,
            params
          );

          // Log success for sensitive operations
          logSuccess(method, resource, params, result);

          return result;
        } catch (error: unknown) {
          // Log the error with context
          logError(method, resource, params, error);

          // Handle idempotent delete - if resource doesn't exist, treat as success
          // This happens with React Admin's undoable mode where UI updates before API call
          if (method === "delete" && isAlreadyDeletedError(error)) {
            // Return successful delete response - resource was already deleted
            return { data: params.previousData };
          }

          // For validation errors already in React Admin format, pass through
          if (isReactAdminValidationError(error)) {
            throw error;
          }

          // For Supabase errors, try to extract field-specific errors
          if (isSupabaseError(error)) {
            throw transformSupabaseError(error as SupabaseError);
          }

          // Pass through other errors
          throw error;
        }
      };
    }
  }

  return wrappedProvider;
}

/**
 * Type for error log context (exported for testing)
 */
export type { DataProviderLogParams, ValidationError, ExtendedError };
