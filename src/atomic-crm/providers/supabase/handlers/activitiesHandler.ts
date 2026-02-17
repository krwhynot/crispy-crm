/**
 * Activities Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the activities resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withValidation → Zod schema validation
 * 3. withSkipDelete → Intercepts delete to prevent hard DELETE on soft-delete resources
 * 4. withLifecycleCallbacks → Resource-specific logic (soft delete, computed fields)
 * 5. withErrorLogging → Structured error handling
 *
 * Note: activitiesCallbacks uses the createResourceCallbacks factory,
 * but the handler composition pattern remains identical.
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation, withSkipDelete } from "../wrappers";
import { activitiesCallbacks } from "../callbacks";

/**
 * Create a fully composed DataProvider for activities
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withSkipDelete → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Validation runs FIRST on raw data, THEN lifecycle callbacks strip
 * computed fields before DB write. This ensures Zod validates clean user input,
 * not post-processed data.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all activities-specific behavior
 */
export function createActivitiesHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(withSkipDelete(withValidation(baseProvider)), [activitiesCallbacks])
  );
}
