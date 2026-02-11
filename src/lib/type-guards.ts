/**
 * Type Guards for Error Handling
 *
 * Provides type-safe narrowing for error handling in catch blocks.
 * Use `catch (error: unknown)` with these guards instead of `catch (error: any)`.
 *
 * @example
 * ```typescript
 * try {
 *   await dataProvider.create('contacts', { data });
 * } catch (error: unknown) {
 *   if (isHttpError(error)) {
 *     logger.error('HTTP error occurred', error, {
 *       status: error.status,
 *       feature: 'DataProvider'
 *     });
 *   } else if (isError(error)) {
 *     logger.error('Operation failed', error, { feature: 'DataProvider' });
 *   }
 * }
 * ```
 */

import type { HttpError } from "react-admin";

/**
 * Type guard for React Admin HttpError
 * Safely narrows unknown error to HttpError type
 *
 * @param error - Unknown error value from catch block
 * @returns true if error is an HttpError with status property
 */
export function isHttpError(error: unknown): error is HttpError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as HttpError).status === "number"
  );
}

/**
 * Type guard for standard JavaScript Error
 * Safely narrows unknown error to Error type
 *
 * @param error - Unknown error value from catch block
 * @returns true if error is an instance of Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard for error objects with a message property
 * Useful when error is not a proper Error instance but has a message
 *
 * @param error - Unknown error value from catch block
 * @returns true if error has a message property that is a string
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Extract error message from any error type
 * Safely extracts message from Error, HttpError, or objects with message property
 *
 * @param error - Unknown error value from catch block
 * @returns The error message or a default message if extraction fails
 */
export function getErrorMessage(error: unknown): string {
  if (isHttpError(error)) {
    return error.message;
  }
  if (isError(error)) {
    return error.message;
  }
  if (hasMessage(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}
