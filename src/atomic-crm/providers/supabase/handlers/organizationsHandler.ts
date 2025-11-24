/**
 * Organizations Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the organizations resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withLifecycleCallbacks → Resource-specific logic (soft delete)
 * 3. withValidation → Zod schema validation
 * 4. withErrorLogging → Structured error handling
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { organizationsCallbacks } from "../callbacks";

/**
 * Create a fully composed DataProvider for organizations
 *
 * Composition order (innermost to outermost):
 * baseProvider → withLifecycleCallbacks → withValidation → withErrorLogging
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all organizations-specific behavior
 */
export function createOrganizationsHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withValidation(
      withLifecycleCallbacks(baseProvider, [organizationsCallbacks])
    )
  );
}
