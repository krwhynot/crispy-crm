/**
 * Tasks Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the tasks resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withLifecycleCallbacks → Resource-specific logic (soft delete, completion, snooze)
 * 3. withValidation → Zod schema validation
 * 4. withErrorLogging → Structured error handling + Sentry
 *
 * Tasks have special handling for:
 * - Soft delete (deleted_at timestamp)
 * - Completion timestamp management
 * - Snooze date normalization
 * - Creator-only RLS (tasks are visible only to their creator + admins)
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { tasksCallbacks } from "../callbacks/tasksCallbacks";

/**
 * Create a fully composed DataProvider for tasks
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Validation runs FIRST on raw data, THEN lifecycle callbacks strip
 * computed fields before DB write. This ensures Zod validates clean user input,
 * not post-processed data.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all tasks-specific behavior
 */
export function createTasksHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(withLifecycleCallbacks(withValidation(baseProvider), [tasksCallbacks]));
}
