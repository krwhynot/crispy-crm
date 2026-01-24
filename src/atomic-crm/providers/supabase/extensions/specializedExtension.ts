/**
 * Specialized Extension Layer
 *
 * Provides specialized business operations via direct RPC calls.
 * Includes atomic operations like booth visitor creation.
 *
 * Methods (1 total):
 * - createBoothVisitor: Atomically create organization, contact, and opportunity
 *
 * @module providers/supabase/extensions/specializedExtension
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BoothVisitorResult } from "./types";
import type { QuickAddInput } from "../../../validation/quickAdd";
import { logger } from "@/lib/logger";

/**
 * Error logging helper matching unifiedDataProvider pattern
 *
 * Uses centralized logger for Sentry integration and structured output.
 *
 * @param method - The method name (e.g., "createBoothVisitor")
 * @param resource - Resource or function name being accessed
 * @param params - Parameters passed to the method
 * @param error - The error that occurred
 */
function logError(
  method: string,
  resource: string,
  params: Record<string, unknown>,
  error: unknown
): void {
  logger.error(`[DataProvider ${method}] Error in ${resource}`, error, {
    method,
    resource,
    params,
  });
}

/**
 * Specialized extension methods interface
 */
export interface SpecializedExtension {
  createBoothVisitor(data: QuickAddInput): Promise<{ data: BoothVisitorResult }>;
}

/**
 * Create Specialized Extension
 *
 * Returns specialized business operation methods.
 *
 * @param supabaseClient - Supabase client for RPC access
 * @returns Specialized extension methods
 */
export function createSpecializedExtension(supabaseClient: SupabaseClient): SpecializedExtension {
  return {
    /**
     * Create Booth Visitor Opportunity (Atomic Operation)
     *
     * Atomically creates organization, contact, and opportunity records via
     * database function. Used for trade show lead capture with transaction
     * guarantees (all-or-nothing creation).
     *
     * @param data - QuickAddInput data from the quick add form
     * @returns Result containing IDs of all created records
     *
     * @example
     * ```typescript
     * const result = await dataProvider.createBoothVisitor({
     *   organization_name: "Acme Corp",
     *   contact_name: "John Doe",
     *   contact_email: "john@acme.com",
     *   opportunity_title: "Q4 Enterprise Deal",
     *   opportunity_value: 50000
     * });
     *
     * // Result: { data: { organization_id, contact_id, opportunity_id } }
     * ```
     */
    createBoothVisitor: async (data: QuickAddInput): Promise<{ data: BoothVisitorResult }> => {
      try {
        const { data: result, error } = await supabaseClient.rpc(
          "create_booth_visitor_opportunity",
          {
            _data: data,
          }
        );

        if (error) {
          logError("createBoothVisitor", "booth_visitor", { data }, error);
          throw new Error(`Create booth visitor failed: ${error.message}`);
        }

        return { data: result as BoothVisitorResult };
      } catch (error: unknown) {
        logError("createBoothVisitor", "booth_visitor", { data }, error);
        throw error;
      }
    },
  };
}
