/**
 * Zod Error Formatting Utilities
 *
 * Transforms Zod validation errors into formats suitable for form display.
 * Centralizes the error transformation logic that was duplicated across files.
 *
 * @example
 * ```typescript
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     const formErrors = zodErrorToFormErrors(error);
 *     // { "email": "Invalid email", "phone.0.value": "Required" }
 *   }
 * }
 * ```
 */

import type { ZodError, ZodIssue, ZodSchema } from "zod";
import type { FieldValues, FieldError, FieldErrors, Resolver } from "react-hook-form";
import { getFriendlyErrorMessage } from "@/atomic-crm/validation/utils";

/**
 * Transform a Zod error into a flat record of field paths to error messages.
 * Handles nested paths by joining with dots (e.g., "phone.0.value").
 *
 * @param error - The ZodError instance from a failed parse/safeParse
 * @returns Record mapping field paths to their error messages
 */
export function zodErrorToFormErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.issues.forEach((issue: ZodIssue) => {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = getFriendlyErrorMessage(issue);
    }
  });

  return errors;
}

/**
 * Transform a Zod error into React Admin validation error format.
 * This format is expected by React Admin's form error handling.
 *
 * @param error - The ZodError instance from a failed parse/safeParse
 * @returns Record with error messages in React Admin format
 */
export function zodErrorToReactAdminErrors(
  error: ZodError
): Record<string, string> {
  return zodErrorToFormErrors(error);
}

/**
 * Extract the first error message from a Zod error for a specific field.
 *
 * @param error - The ZodError instance
 * @param fieldPath - The field path to get the error for (e.g., "email" or "phone.0.value")
 * @returns The first error message for the field, or undefined if none
 */
export function getFieldError(
  error: ZodError,
  fieldPath: string
): string | undefined {
  const issue = error.issues.find(
    (issue) => issue.path.join(".") === fieldPath
  );
  return issue ? getFriendlyErrorMessage(issue) : undefined;
}

/**
 * Check if a Zod error contains an error for a specific field.
 *
 * @param error - The ZodError instance
 * @param fieldPath - The field path to check (e.g., "email" or "phone.0.value")
 * @returns true if the field has an error
 */
export function hasFieldError(error: ZodError, fieldPath: string): boolean {
  return error.issues.some((issue) => issue.path.join(".") === fieldPath);
}

/**
 * Get all error messages as a flat array of strings.
 * Useful for displaying a summary of all validation errors.
 *
 * @param error - The ZodError instance
 * @returns Array of all error messages
 */
export function getAllErrorMessages(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    const message = getFriendlyErrorMessage(issue);
    return path ? `${path}: ${message}` : message;
  });
}

/**
 * Create a React Admin compatible validation error
 *
 * @param error - ZodError from failed validation
 * @param message - Optional custom error message (default: "Validation failed")
 * @returns Object with message and body.errors for React Admin
 *
 * @example
 * ```typescript
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     throw createValidationError(error);
 *   }
 * }
 * ```
 */
export function createValidationError(
  error: ZodError,
  message = "Validation failed"
): { message: string; body: { errors: Record<string, string> } } {
  return {
    message,
    body: { errors: zodErrorToFormErrors(error) },
  };
}

/**
 * Helper function to set a nested error in the FieldErrors object.
 * Converts flat dot-notation paths (e.g., "contact.email") into nested objects.
 *
 * @param errors - The FieldErrors object to mutate
 * @param path - Dot-notation path to the field (e.g., "contact.email")
 * @param message - The error message to set
 *
 * @example
 * ```typescript
 * const errors: FieldErrors = {};
 * setNestedError(errors, "contact.email", "Invalid email");
 * // Result: { contact: { email: { type: "validation", message: "Invalid email" } } }
 * ```
 */
function setNestedError(errors: FieldErrors, path: string, message: string): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = errors;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = parts[parts.length - 1];
  current[lastKey] = { type: 'validation', message } as FieldError;
}

/**
 * Create a custom resolver for React Admin Form components using Zod schemas.
 *
 * This resolver applies friendly error message transformation by:
 * 1. Using schema.safeParseAsync for validation
 * 2. Transforming Zod errors using zodErrorToFormErrors for user-friendly messages
 * 3. Converting flat error paths to nested FieldErrors structure for React Hook Form
 *
 * @param schema - A Zod schema to use for form validation
 * @returns A Resolver compatible with React Admin's Form component
 *
 * @example
 * ```typescript
 * import { quickAddSchema } from "@/validation/quickAdd";
 * import { createFormResolver } from "@/lib/zodErrorFormatting";
 *
 * <Form
 *   defaultValues={defaultValues}
 *   resolver={createFormResolver(quickAddSchema)}
 * >
 *   ...
 * </Form>
 * ```
 */
export function createFormResolver<TSchema extends ZodSchema>(
  schema: TSchema
): Resolver<FieldValues> {
  return async (values: FieldValues) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    // Transform Zod errors to friendly messages
    const flatErrors = zodErrorToFormErrors(result.error);
    const fieldErrors: FieldErrors = {};

    // Convert flat paths to nested FieldErrors structure
    for (const [path, message] of Object.entries(flatErrors)) {
      setNestedError(fieldErrors, path, message);
    }

    return { values: {}, errors: fieldErrors };
  };
}
