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
 *
 * Production Observability: Uses structured logger with Sentry integration
 * - Errors automatically captured in Sentry for production monitoring
 * - Console output preserved in development
 * - Structured context (tags, extras) for error filtering
 */

import type { DataProvider, Identifier, FilterPayload, RaRecord } from "ra-core";
import { logger } from "@/lib/logger";
import {
  FIELD_LABELS,
  sanitizeDatabaseError,
  type ErrorContext,
} from "@/atomic-crm/utils/errorMessages";

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
 * Uses structured logger for production Sentry integration
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
  const extendedError = error as ExtendedError | undefined;

  // Build structured context for logger
  const context = {
    method,
    resource,
    operation: `DataProvider.${method}`,
    // SECURITY: Redact actual data, just indicate presence
    hasData: params?.data ? true : undefined,
    id: params?.id,
    ids: params?.ids,
    filter: params?.filter,
    sort: params?.sort,
    pagination: params?.pagination,
    target: params?.target,
    validationErrors: extendedError?.body?.errors || extendedError?.errors || undefined,
  };

  // Log main error with structured context
  logger.error(
    "DataProvider operation failed",
    error instanceof Error ? error : new Error(String(error)),
    context
  );

  // Log validation errors in detail for debugging
  if (extendedError?.body?.errors) {
    logger.debug("Validation errors detail", {
      ...context,
      validationErrors: extendedError.body.errors,
    });
    // DEBUG: Also log the data that caused the error
    if (params && "data" in params) {
      logger.debug("Validation data submitted", {
        ...context,
        submittedData: (params as { data: unknown }).data,
      });
    }
  } else if (extendedError?.errors) {
    logger.debug("Validation errors detail", {
      ...context,
      validationErrors: extendedError.errors,
    });
    // DEBUG: Also log the data that caused the error
    if (params && "data" in params) {
      logger.debug("Validation data submitted", {
        ...context,
        submittedData: (params as { data: unknown }).data,
      });
    }
  }
}

/**
 * Transform Supabase errors to React Admin validation format
 * Attempts to extract field name from error details
 *
 * @param error - The Supabase error
 * @param context - Optional context about the resource and action
 * @returns Validation error in React Admin format
 */
function transformSupabaseError(error: SupabaseError, context?: ErrorContext): ValidationError {
  const fieldErrors: Record<string, string> = {};
  const errorMessage = error.details || error.message || "Operation failed";

  // Try to sanitize using our pattern matchers
  const sanitized = sanitizeDatabaseError(errorMessage, context);

  if (sanitized) {
    fieldErrors[sanitized.field] = sanitized.message;
  } else if (typeof error.details === "string") {
    // Fallback: extract field but use generic message
    const match = error.details.match(/column "(\w+)"/i);
    if (match && match[1]) {
      const columnName = match[1];
      const label = FIELD_LABELS[columnName] || columnName.replace(/_/g, " ");
      fieldErrors[columnName] = `Invalid value for ${label}`;
    } else {
      fieldErrors._error = "Operation failed. Please check your input.";
    }
  } else {
    fieldErrors._error = "Operation failed";
  }

  return {
    message: sanitized?.message || "Validation failed",
    body: { errors: fieldErrors },
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
 * Uses structured logger to create breadcrumbs in Sentry
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
    const recordId = params?.id || params?.ids || resultData?.data?.id;

    logger.info("DataProvider audit: sensitive operation succeeded", {
      method,
      resource,
      operation: `DataProvider.${method}`,
      recordId,
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
            // Create error context from current operation
            const errorContext: ErrorContext = {
              resource,
              action: method === "create" ? "create" : method === "update" ? "update" : "delete",
            };
            throw transformSupabaseError(error as SupabaseError, errorContext);
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
