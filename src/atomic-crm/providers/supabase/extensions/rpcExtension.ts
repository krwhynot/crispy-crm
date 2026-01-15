/**
 * RPC Extension Layer
 *
 * Provides generic RPC function execution with Zod validation.
 * Validates parameters against RPC_SCHEMAS if a schema exists.
 *
 * Methods (1 total):
 * - rpc: Execute Supabase RPC function with validation
 *
 * @module providers/supabase/extensions/rpcExtension
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RPC_SCHEMAS,
  type RPCFunctionName,
  type LogActivityWithTaskParams,
  type LogActivityWithTaskResponse,
} from "../../../validation/rpc";
import { devLog } from "@/lib/devLogger";
import { HttpError } from "react-admin";

/**
 * Error logging helper matching unifiedDataProvider pattern
 *
 * @param method - The method name (e.g., "rpc")
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
  console.error(`[DataProvider ${method}] Error in ${resource}:`, {
    params,
    error: error instanceof Error ? error.message : String(error),
  });
}

/**
 * RPC extension methods interface
 */
export interface RPCExtension {
  rpc<T = unknown>(functionName: string, params?: Record<string, unknown>): Promise<T>;
  logActivityWithTask(params: LogActivityWithTaskParams): Promise<LogActivityWithTaskResponse>;
}

/**
 * Create RPC Extension
 *
 * Returns RPC method with Zod validation for database function calls.
 *
 * @param supabaseClient - Supabase client for RPC access
 * @returns RPC extension methods
 */
export function createRPCExtension(supabaseClient: SupabaseClient): RPCExtension {
  return {
    /**
     * Execute Supabase RPC function with Zod validation
     *
     * Generic method for calling database functions. Validates parameters
     * against RPC_SCHEMAS if a schema exists for the function.
     *
     * @param functionName - Name of the RPC function to call
     * @param params - Parameters to pass to the function
     * @returns Typed result from the RPC function
     *
     * @example
     * ```typescript
     * // Call with validation (schema exists)
     * const result = await dataProvider.rpc<SegmentData>(
     *   "get_or_create_segment",
     *   { segment_name: "Enterprise" }
     * );
     *
     * // Call without validation (no schema defined)
     * const custom = await dataProvider.rpc<CustomResult>(
     *   "custom_function",
     *   { param: "value" }
     * );
     * ```
     */
    rpc: async <T = unknown>(
      functionName: string,
      params: Record<string, unknown> = {}
    ): Promise<T> => {
      let validatedParams = params;
      try {
        // Validate params if schema exists for this RPC function
        if (functionName in RPC_SCHEMAS) {
          const schema = RPC_SCHEMAS[functionName as RPCFunctionName];
          const validationResult = schema.safeParse(params);

          if (!validationResult.success) {
            throw new Error(
              `Invalid RPC parameters for ${functionName}: ${validationResult.error.message}`
            );
          }

          // Use validated params
          validatedParams = validationResult.data as Record<string, unknown>;
        }

        devLog("DataProvider RPC", `Calling ${functionName}`, validatedParams);

        const { data, error } = await supabaseClient.rpc(functionName, validatedParams);

        if (error) {
          logError("rpc", functionName, { data: validatedParams }, error);
          throw new Error(`RPC ${functionName} failed: ${error.message}`);
        }

        return data as T;
      } catch (error: unknown) {
        logError("rpc", functionName, { data: validatedParams }, error);
        throw error;
      }
    },

    /**
     * Atomically log activity with optional follow-up task
     *
     * Creates an activity and optionally a follow-up task in a single database
     * transaction. Uses the log_activity_with_task RPC function to ensure
     * data consistency.
     *
     * @param params - Activity and optional task data
     * @returns Result with activity_id and optional task_id
     * @throws HttpError if RPC fails
     *
     * @example
     * ```typescript
     * const result = await dataProvider.logActivityWithTask({
     *   p_activity: {
     *     activity_type: "engagement",
     *     type: "call",
     *     outcome: "Connected",
     *     subject: "Follow-up call with customer",
     *     description: "Discussed Q1 order...",
     *     activity_date: new Date().toISOString(),
     *     duration_minutes: 15,
     *     contact_id: 123,
     *     organization_id: 456,
     *     opportunity_id: null,
     *     follow_up_required: true,
     *     follow_up_date: "2026-01-20",
     *   },
     *   p_task: {
     *     title: "Follow-up: Discussed Q1 order...",
     *     due_date: "2026-01-20",
     *     priority: "medium",
     *     contact_id: 123,
     *     opportunity_id: null,
     *   },
     * });
     * // result: { success: true, activity_id: 789, task_id: 101 }
     * ```
     */
    logActivityWithTask: async (
      params: LogActivityWithTaskParams
    ): Promise<LogActivityWithTaskResponse> => {
      devLog("DataProvider RPC", "Calling log_activity_with_task", params);

      const { data, error } = await supabaseClient.rpc("log_activity_with_task", {
        p_activity: params.p_activity,
        p_task: params.p_task,
      });

      if (error) {
        logError("logActivityWithTask", "log_activity_with_task", params, error);
        throw new HttpError(error.message, 500);
      }

      return data as LogActivityWithTaskResponse;
    },
  };
}
