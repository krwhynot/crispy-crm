/**
 * Edge Functions Extension Layer
 *
 * Provides Edge Function invocation with Zod validation.
 * Validates body parameters against edgeFunctionSchemas if a schema exists.
 *
 * Methods (1 total):
 * - invoke: Invoke Supabase Edge Function with validation
 *
 * @module providers/supabase/extensions/edgeFunctionsExtension
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { edgeFunctionSchemas, type EdgeFunctionName } from "../../../validation/rpc";
import { logger } from "@/lib/logger";

/**
 * Error logging helper matching unifiedDataProvider pattern
 *
 * Uses centralized logger for Sentry integration and structured output.
 *
 * @param method - The method name (e.g., "invoke")
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
 * Edge Functions extension methods interface
 */
export interface EdgeFunctionsExtension {
  invoke<T = unknown>(
    functionName: string,
    options?: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: Record<string, unknown>;
      headers?: Record<string, string>;
    }
  ): Promise<T>;
}

/**
 * Create Edge Functions Extension
 *
 * Returns invoke method with Zod validation for Edge Function calls.
 *
 * @param supabaseClient - Supabase client for Edge Functions access
 * @returns Edge Functions extension methods
 */
export function createEdgeFunctionsExtension(
  supabaseClient: SupabaseClient
): EdgeFunctionsExtension {
  return {
    /**
     * Invoke Supabase Edge Function with Zod validation
     *
     * Generic method for calling Edge Functions. Validates body parameters
     * against edgeFunctionSchemas if a schema exists for the function.
     *
     * @param functionName - Name of the Edge Function to invoke
     * @param options - Options including HTTP method, body, and headers
     * @returns Typed result from the Edge Function
     *
     * @example
     * ```typescript
     * // POST with body validation (schema exists)
     * const result = await dataProvider.invoke<Sale>(
     *   "create-sales",
     *   {
     *     method: "POST",
     *     body: { email: "test@example.com", password: "secure123" }
     *   }
     * );
     *
     * // GET without body
     * const data = await dataProvider.invoke<SalesData>(
     *   "get-sales-data",
     *   { method: "GET" }
     * );
     * ```
     */
    invoke: async <T = unknown>(
      functionName: string,
      options: {
        method?: "GET" | "POST" | "PUT" | "DELETE";
        body?: Record<string, unknown>;
        headers?: Record<string, string>;
      } = {}
    ): Promise<T> => {
      const processedOptions = { ...options };
      try {
        // Validate body params if schema exists for this Edge Function
        // Note: edgeFunctionSchemas is currently empty, validation will be added when Edge Functions are implemented
        const edgeFunctionNames = Object.keys(edgeFunctionSchemas);
        if (
          edgeFunctionNames.length > 0 &&
          edgeFunctionNames.includes(functionName) &&
          processedOptions.body
        ) {
          // Safe to access schema since we've verified the function name exists
          const schema = edgeFunctionSchemas[functionName as EdgeFunctionName];
          const validationResult = schema.safeParse(processedOptions.body);

          if (!validationResult.success) {
            throw new Error(
              `Invalid Edge Function parameters for ${functionName}: ${validationResult.error.message}`
            );
          }

          // Use validated params
          processedOptions.body = validationResult.data as Record<string, unknown>;
        }

        const { data, error } = await supabaseClient.functions.invoke<T>(functionName, {
          method: processedOptions.method || "POST",
          body: processedOptions.body,
          headers: processedOptions.headers,
        });

        if (error) {
          logError("invoke", functionName, { data: processedOptions }, error);
          throw new Error(`Edge function ${functionName} failed: ${error.message}`);
        }

        if (!data) {
          throw new Error(`Edge function ${functionName} returned no data`);
        }

        return data;
      } catch (error: unknown) {
        logError("invoke", functionName, { data: processedOptions }, error);
        throw error;
      }
    },
  };
}
