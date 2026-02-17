/**
 * Notifications Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the notifications resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withValidation → Zod schema validation
 * 3. withSkipDelete → Intercepts delete to prevent hard DELETE on soft-delete resources
 * 4. withLifecycleCallbacks → Resource-specific logic (soft delete)
 * 5. withErrorLogging → Structured error handling
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation, withSkipDelete } from "../wrappers";
import { notificationsCallbacks } from "../callbacks/notificationsCallbacks";

/**
 * Create a fully composed DataProvider for notifications
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withSkipDelete → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: withLifecycleCallbacks MUST wrap withValidation so that beforeSave
 * can strip computed fields (from views) BEFORE Zod validation runs.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all notifications-specific behavior
 */
export function createNotificationsHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(withSkipDelete(withValidation(baseProvider)), [notificationsCallbacks])
  );
}
