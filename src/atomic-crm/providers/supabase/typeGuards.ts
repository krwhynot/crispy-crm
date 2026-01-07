/**
 * Type Guards for DataProvider Layer
 *
 * These guards enable type-safe provider operations without unsafe `as` casting.
 * Used by handlers to validate provider capabilities at runtime.
 *
 * @see PROVIDER_RULES.md - Rule 7 (No Magic, Just Handlers)
 */

import type { DataProvider, RaRecord, Identifier } from "ra-core";
import type { ExtendedDataProvider } from "./extensions/types";

/**
 * Type guard to check if DataProvider has RPC capability
 */
export function hasRpcMethod(
  provider: DataProvider
): provider is DataProvider & { rpc: ExtendedDataProvider["rpc"] } {
  return "rpc" in provider && typeof (provider as { rpc?: unknown }).rpc === "function";
}

/**
 * Type guard to check if DataProvider is ExtendedDataProvider
 * Checks for all custom methods added by extendWithCustomMethods
 */
export function isExtendedDataProvider(
  provider: DataProvider
): provider is ExtendedDataProvider {
  return (
    hasRpcMethod(provider) &&
    "storage" in provider &&
    "invoke" in provider
  );
}

/**
 * Assert and return ExtendedDataProvider with runtime check
 * Use this instead of `as ExtendedDataProvider` casting
 *
 * @throws Error if provider doesn't have required methods
 *
 * @example
 * // BEFORE (unsafe)
 * const service = new Service(baseProvider as ExtendedDataProvider);
 *
 * // AFTER (type-safe)
 * const extendedProvider = assertExtendedDataProvider(baseProvider);
 * const service = new Service(extendedProvider);
 */
export function assertExtendedDataProvider(
  provider: DataProvider
): ExtendedDataProvider {
  if (!isExtendedDataProvider(provider)) {
    throw new Error(
      "DataProvider is not an ExtendedDataProvider. Missing required custom methods (rpc, storage, invoke)."
    );
  }
  return provider;
}

/**
 * Type guard for validating RaRecord shape
 * Use instead of `as RecordType` when the shape is uncertain
 */
export function isRaRecord(value: unknown): value is RaRecord {
  if (typeof value !== "object" || value === null) return false;
  return "id" in value;
}

/**
 * Type guard for validating RaRecord with specific required fields
 */
export function isRaRecordWith<K extends string>(
  value: unknown,
  requiredFields: K[]
): value is RaRecord & Record<K, unknown> {
  if (!isRaRecord(value)) return false;
  return requiredFields.every((field) => field in value);
}

/**
 * Type guard for error objects with extended properties
 * Use instead of `as ExtendedError` casting in error handlers
 */
export interface ExtendedErrorShape {
  message?: string;
  body?: { errors?: Record<string, string> };
  code?: string | number;
  status?: number;
}

export function isExtendedError(error: unknown): error is ExtendedErrorShape {
  if (typeof error !== "object" || error === null) return false;
  return "message" in error || "body" in error || "code" in error;
}

/**
 * Type guard for Supabase-specific errors
 */
export interface SupabaseErrorShape {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export function isSupabaseError(error: unknown): error is SupabaseErrorShape {
  if (typeof error !== "object" || error === null) return false;
  // Supabase errors typically have a code property
  return "code" in error && typeof (error as { code?: unknown }).code === "string";
}
