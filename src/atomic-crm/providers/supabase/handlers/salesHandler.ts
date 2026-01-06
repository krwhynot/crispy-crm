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
 * - Write operations restricted to admins via RLS bypass (Edge Function)
 * - Soft delete (disabled flag instead of true deletion)
 *
 * UPDATE: Sales updates are routed through SalesService.salesUpdate() which
 * calls an Edge Function to bypass RLS restrictions on the sales table.
 *
 * Engineering Constitution: Composition over inheritance, ~20 lines
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
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Validation runs FIRST on raw data, THEN lifecycle callbacks strip
 * computed fields before DB write. This ensures Zod validates clean user input,
 * not post-processed data.
 *
 * UPDATE: The update method is intercepted to route through SalesService,
 * which calls an Edge Function to bypass RLS restrictions.
 *
 * @param baseProvider - The raw Supabase DataProvider (must have invoke capability)
 * @returns Composed DataProvider with soft delete, validation, and error handling
 */
export function createSalesHandler(baseProvider: DataProviderWithInvoke): DataProvider {
  const composedHandler = withErrorLogging(
    withLifecycleCallbacks(withValidation(baseProvider), [salesCallbacks])
  );

  const salesService = new SalesService(baseProvider);

  return {
    ...composedHandler,

    update: async (resource, params) => {
      if (resource === "sales") {
        await salesService.salesUpdate(params.id, params.data);
        return { data: { ...params.previousData, ...params.data, id: params.id } };
      }
      return composedHandler.update(resource, params);
    },
  };
}
