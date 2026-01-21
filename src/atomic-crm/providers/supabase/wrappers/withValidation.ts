/**
 * Validation Wrapper for DataProvider
 *
 * Integrates ValidationService into the DataProvider chain.
 * Validates create/update data before passing to base provider.
 * Cleans filter fields on getList to prevent stale cache errors.
 *
 * Key behaviors:
 * 1. Validate create data before calling provider
 * 2. Validate update data before calling provider
 * 3. Clean filter fields on getList using ValidationService
 * 4. Transform Zod errors to React Admin validation format
 * 5. Pass through requests for resources without validation
 *
 * Engineering Constitution: Cross-cutting concern extracted for single responsibility
 */

import type { DataProvider, RaRecord, CreateParams, UpdateParams, GetListParams } from "ra-core";
import { ValidationService } from "../services";
import { getFriendlyErrorMessage } from "../../../validation/utils";

/**
 * Interface for Zod validation errors
 */
interface ZodIssue {
  path: (string | number)[];
  message: string;
  code: string; // Error type (e.g., "unrecognized_keys")
  keys?: string[]; // Unknown field names for strictObject errors
}

interface ZodError {
  name: "ZodError";
  issues: ZodIssue[];
}

/**
 * Interface for React Admin validation errors
 */
interface ReactAdminValidationError {
  message: string;
  body: {
    errors: Record<string, string>;
  };
}

/**
 * Check if error is a Zod validation error
 */
function isZodError(error: unknown): error is ZodError {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ZodError" &&
    "issues" in error &&
    Array.isArray(error.issues)
  );
}

/**
 * Transform Zod error to React Admin validation error format
 *
 * React Admin expects validation errors in the format:
 * { body: { errors: { fieldName: "error message" } } }
 *
 * Zod provides errors as:
 * { issues: [{ path: ["fieldName"], message: "error message" }] }
 *
 * @param zodError - The Zod error object
 * @returns React Admin formatted validation error
 */
function transformZodToReactAdmin(zodError: ZodError): ReactAdminValidationError {
  const errors: Record<string, string> = {};

  for (const issue of zodError.issues) {
    // Handle strictObject unknown key errors - extract field names from keys array
    if (issue.code === "unrecognized_keys" && issue.keys && issue.keys.length > 0) {
      for (const unknownKey of issue.keys) {
        errors[unknownKey] = `Unknown field '${unknownKey}' is not allowed`;
      }
      continue;
    }

    // Standard path-based error handling (existing logic)
    const fieldPath = issue.path.join(".");
    // Use the field path as key, or "_error" for root-level errors
    const key = fieldPath || "_error";
    errors[key] = getFriendlyErrorMessage(issue);
  }

  return {
    message: "Validation failed",
    body: { errors },
  };
}

/**
 * Wrap a DataProvider with validation
 *
 * This wrapper:
 * - Validates create/update data before calling the base provider
 * - Cleans filter fields on getList to prevent stale cache errors
 * - Transforms Zod errors to React Admin validation format
 * - Passes through all other methods unchanged
 *
 * @param provider - The DataProvider to wrap
 * @param validationService - Optional ValidationService instance (creates new if not provided)
 * @returns A new DataProvider with validation
 */
export function withValidation<T extends DataProvider>(
  provider: T,
  validationService: ValidationService = new ValidationService()
): T {
  // Create a new object preserving all original methods
  const wrappedProvider = { ...provider } as T;

  // Wrap create with validation
  wrappedProvider.create = async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: CreateParams<RecordType>
  ) => {
    try {
      // Validate before create
      await validationService.validate(resource, "create", params.data);
    } catch (error: unknown) {
      if (isZodError(error)) {
        throw transformZodToReactAdmin(error);
      }
      throw error;
    }

    return provider.create<RecordType>(resource, params);
  };

  // Wrap update with validation
  wrappedProvider.update = async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: UpdateParams<RecordType>
  ) => {
    try {
      // Validate before update
      // Include params.id in data since some schemas (e.g., taskUpdateSchema) require id
      // This matches what unifiedDataProvider.update() does before processing
      const dataWithId = { ...params.data, id: params.id };
      await validationService.validate(resource, "update", dataWithId);
    } catch (error: unknown) {
      if (isZodError(error)) {
        throw transformZodToReactAdmin(error);
      }
      throw error;
    }

    return provider.update<RecordType>(resource, params);
  };

  // Wrap getList with filter validation
  wrappedProvider.getList = async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: GetListParams
  ) => {
    // Clean filter fields to prevent stale cache errors
    const processedParams = { ...params };
    if (processedParams.filter && Object.keys(processedParams.filter).length > 0) {
      processedParams.filter = validationService.validateFilters(resource, processedParams.filter);
    }

    return provider.getList<RecordType>(resource, processedParams);
  };

  return wrappedProvider;
}

/**
 * Type for validation error (exported for testing)
 */
export type { ZodError, ReactAdminValidationError };
