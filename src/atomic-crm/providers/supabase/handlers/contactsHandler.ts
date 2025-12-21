/**
 * Contacts Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the contacts resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withLifecycleCallbacks → Resource-specific logic (soft delete, JSONB normalization)
 * 3. withValidation → Zod schema validation
 * 4. withErrorLogging → Structured error handling
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { contactsCallbacks } from "../callbacks";

/**
 * Create a fully composed DataProvider for contacts
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: withLifecycleCallbacks MUST wrap withValidation so that beforeSave
 * can strip computed fields (from views) BEFORE Zod validation runs.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all contacts-specific behavior
 */
export function createContactsHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(withValidation(baseProvider), [contactsCallbacks])
  );
}
