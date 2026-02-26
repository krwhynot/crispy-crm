/**
 * Tags Handler - Composed DataProvider
 *
 * Composes infrastructure for the tags resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withValidation → Zod schema validation (color normalization)
 * 3. withSkipDelete → Intercepts delete to prevent hard DELETE on soft-delete resources
 * 4. withLifecycleCallbacks → Soft delete callbacks
 * 5. withErrorLogging → Structured error handling + Sentry
 *
 * Tags are simple entities:
 * - Soft delete (deleted_at timestamp)
 * - Color validation with hex-to-semantic mapping
 * - Name uniqueness enforced at database level
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation, withSkipDelete } from "../wrappers";
import { tagsCallbacks } from "../callbacks/tagsCallbacks";

/**
 * Create a fully composed DataProvider for tags
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withSkipDelete → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Validation runs FIRST on raw data, THEN withSkipDelete intercepts
 * hard deletes, THEN lifecycle callbacks execute.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with validation and error handling
 */
export function createTagsHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(withSkipDelete(withValidation(baseProvider)), [tagsCallbacks])
  );
}
