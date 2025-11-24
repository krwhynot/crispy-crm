/**
 * Extension Layer Exports
 *
 * Public API for the composedDataProvider extension layer.
 * This module provides types and functions for extending the base DataProvider
 * with Atomic CRM-specific custom methods.
 *
 * @module providers/supabase/extensions
 */

// Export types
export type {
  ExtendedDataProvider,
  CrmDataProvider,
  JunctionParams,
  BoothVisitorResult,
} from "./types";

// Export extension function
export { extendWithCustomMethods, type ExtensionConfig } from "./customMethodsExtension";
