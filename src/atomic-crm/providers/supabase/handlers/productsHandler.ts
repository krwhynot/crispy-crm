/**
 * Products Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the products resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withLifecycleCallbacks → Resource-specific logic (soft delete only)
 * 3. withValidation → Zod schema validation
 * 4. withErrorLogging → Structured error handling
 *
 * Note: productsCallbacks uses the createResourceCallbacks factory
 * with minimal configuration (soft delete only, no computed fields).
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { productsCallbacks } from "../callbacks";

/**
 * Create a fully composed DataProvider for products
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: withLifecycleCallbacks MUST wrap withValidation so that beforeSave
 * can strip computed fields (from views) BEFORE Zod validation runs.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all products-specific behavior
 */
export function createProductsHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(withValidation(baseProvider), [productsCallbacks])
  );
}
