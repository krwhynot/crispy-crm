/**
 * Sales Handler - Composed DataProvider
 *
 * Composes infrastructure for the sales (users) resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withLifecycleCallbacks → Soft delete, computed field stripping
 * 3. withValidation → Zod schema validation
 * 4. withErrorLogging → Structured error handling + Sentry
 *
 * Sales records represent CRM users:
 * - Read operations available to all authenticated users
 * - Write operations restricted to admins via RLS
 * - Soft delete (disabled flag instead of true deletion)
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { salesCallbacks } from "../callbacks/salesCallbacks";

/**
 * Create a fully composed DataProvider for sales
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with soft delete, validation, and error handling
 */
export function createSalesHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(withValidation(withLifecycleCallbacks(baseProvider, [salesCallbacks])));
}
