/**
 * Tags Handler - Composed DataProvider
 *
 * Composes infrastructure for the tags resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withLifecycleCallbacks → Minimal (no soft delete)
 * 3. withValidation → Zod schema validation (color normalization)
 * 4. withErrorLogging → Structured error handling + Sentry
 *
 * Tags are simple entities:
 * - Hard delete (truly removed from database)
 * - Color validation with hex-to-semantic mapping
 * - Name uniqueness enforced at database level
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { tagsCallbacks } from "../callbacks/tagsCallbacks";

/**
 * Create a fully composed DataProvider for tags
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Validation runs FIRST on raw data, THEN lifecycle callbacks execute
 * (though tags have minimal callbacks since they use hard delete).
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with validation and error handling
 */
export function createTagsHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(withLifecycleCallbacks(withValidation(baseProvider), [tagsCallbacks]));
}
