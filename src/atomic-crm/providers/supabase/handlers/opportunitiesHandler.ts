/**
 * Opportunities Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the opportunities resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withLifecycleCallbacks → Resource-specific logic (RPC archive, soft delete filter)
 * 3. withValidation → Zod schema validation
 * 4. withErrorLogging → Structured error handling
 *
 * Note: The RPC archive_opportunity_with_relations logic is encapsulated
 * in opportunitiesCallbacks. The handler composition remains identical.
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { opportunitiesCallbacks } from "../callbacks";

/**
 * Create a fully composed DataProvider for opportunities
 *
 * Composition order (innermost to outermost):
 * baseProvider → withLifecycleCallbacks → withValidation → withErrorLogging
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all opportunities-specific behavior
 */
export function createOpportunitiesHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withValidation(
      withLifecycleCallbacks(baseProvider, [opportunitiesCallbacks])
    )
  );
}
