/**
 * Sales Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the sales resource:
 * 1. customHandler → Sales-specific logic (update via Edge Function)
 * 2. withValidation → Zod schema validation
 * 3. withLifecycleCallbacks → Soft delete, computed field stripping
 * 4. withErrorLogging → Structured error handling + Sentry (OUTERMOST)
 *
 * CRITICAL FIX (2025-01): Custom update method is now defined INSIDE the wrapper
 * chain, not outside. This ensures withErrorLogging catches and reports all errors
 * from SalesService.salesUpdate() properly.
 *
 * Sales records represent CRM users:
 * - Read operations available to all authenticated users
 * - Write operations restricted to admins via RLS bypass (Edge Function)
 * - Soft delete (disabled flag instead of true deletion)
 *
 * Engineering Constitution: Composition over inheritance
 */

import { withLifecycleCallbacks, type DataProvider } from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { salesCallbacks } from "../callbacks/salesCallbacks";
import { SalesService } from "../../../services/sales.service";

/**
 * Extended DataProvider type with Edge Function invoke capability
 * Matches the signature expected by SalesService
 */
type DataProviderWithInvoke = DataProvider & {
  invoke?: <T = unknown>(
    functionName: string,
    options?: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: Record<string, unknown>;
      headers?: Record<string, string>;
    }
  ) => Promise<T>;
};

/**
 * Create a fully composed DataProvider for sales
 *
 * Composition order (innermost to outermost):
 * customHandler → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Custom logic is defined INSIDE the wrapper chain so that:
 * - withErrorLogging catches and logs ALL errors (including from SalesService)
 * - withValidation validates data at API boundary
 * - withLifecycleCallbacks runs before/after hooks
 *
 * The update method is intercepted to route through SalesService,
 * which calls an Edge Function to bypass RLS restrictions.
 *
 * @param baseProvider - The raw Supabase DataProvider (must have invoke capability)
 * @returns Composed DataProvider with soft delete, validation, and error handling
 */
export function createSalesHandler(baseProvider: DataProviderWithInvoke): DataProvider {
  const salesService = new SalesService(baseProvider);

  /**
   * Custom sales handler with sales-specific logic
   *
   * This handler is defined FIRST, then wrapped with the standard wrapper chain.
   * This ensures all custom logic is INSIDE the "safety bubble" of withErrorLogging.
   */
  const customHandler: DataProvider = {
    ...baseProvider,

    /**
     * Intercept update for sales resource
     *
     * Routes through SalesService.salesUpdate() which calls an Edge Function
     * to bypass RLS restrictions on the sales table.
     */
    update: async (resource, params) => {
      if (resource === "sales") {
        await salesService.salesUpdate(params.id, params.data);
        return { data: { ...params.previousData, ...params.data, id: params.id } };
      }
      return baseProvider.update(resource, params);
    },
  };

  /**
   * Wrap the custom handler with the standard wrapper chain
   *
   * Order (innermost to outermost):
   * 1. customHandler - Our sales-specific logic
   * 2. withValidation - Zod schema validation at API boundary
   * 3. withLifecycleCallbacks - Before/after hooks for soft delete
   * 4. withErrorLogging - Structured error logging (catches ALL errors)
   *
   * This ensures ALL custom logic is protected by error logging.
   */
  return withErrorLogging(withLifecycleCallbacks(withValidation(customHandler), [salesCallbacks]));
}
