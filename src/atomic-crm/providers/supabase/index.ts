/**
 * Supabase Provider Module
 *
 * Main entry point for Supabase authentication and data providers.
 * Uses the composed handler-based architecture with extension layer.
 *
 * Architecture:
 * - Handler routing layer with lifecycle callbacks
 * - Service container for business logic
 * - Extension decorator for custom methods (RPC calls, etc.)
 *
 * @module providers/supabase
 */

import { supabaseDataProvider } from "ra-supabase-core";
import type { DataProvider } from "ra-core";
import { devLog } from "@/lib/devLogger";

// Auth provider
export { authProvider } from "./authProvider";

// Supabase client for direct access
import { supabase } from "./supabase";

// Composed provider architecture (handler-based implementation)
import { createComposedDataProvider } from "./composedDataProvider";
import { createServiceContainer } from "./services";
import { extendWithCustomMethods } from "./extensions";

/**
 * Create composed data provider with 4-stage initialization
 *
 * Breaks circular dependency between services and provider:
 * 1. **Base Provider**: Raw Supabase DataProvider (CRUD only, no custom methods)
 * 2. **Services**: Business logic layer initialized with base provider
 * 3. **Composed Provider**: Handler routing layer with lifecycle callbacks
 * 4. **Extended Provider**: Custom methods added via extension decorator
 *
 * @returns ExtendedDataProvider with all CRUD + custom methods
 */
function createExtendedDataProvider(): DataProvider {
  // Stage 1: Create base provider (CRUD only)
  const baseProvider = supabaseDataProvider({
    instanceUrl: import.meta.env.VITE_SUPABASE_URL,
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseClient: supabase,
  });

  // Stage 2: Initialize services (breaks circular dependency)
  const services = createServiceContainer(baseProvider);

  // Stage 3: Create composed provider with handler routing
  const composedProvider = createComposedDataProvider(baseProvider);

  // Stage 4: Extend with custom methods
  // CRITICAL: Pass baseProvider so it can be mutated with RPC methods.
  // Handlers create NEW service instances with baseProvider at runtime,
  // so baseProvider MUST have RPC methods added to it.
  return extendWithCustomMethods({
    baseProvider,
    composedProvider,
    services,
    supabaseClient: supabase,
  });
}

/**
 * Data provider instance
 *
 * Uses the composed handler-based architecture.
 * Logs startup for debugging and monitoring.
 */
export const dataProvider: DataProvider = (() => {
  devLog("DataProvider", "🚀 Using COMPOSED provider architecture (handler-based with extensions)");
  return createExtendedDataProvider();
})();

/**
 * Export provider creation utilities for testing
 *
 * Allows tests to create isolated provider instances without relying
 * on the singleton export above.
 */
export { createExtendedDataProvider, supabase };
