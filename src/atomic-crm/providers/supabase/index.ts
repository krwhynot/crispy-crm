/**
 * Supabase Provider Module
 *
 * Main entry point for Supabase authentication and data providers.
 * Supports feature-flagged migration from unifiedDataProvider (monolithic)
 * to composedDataProvider (handler-based architecture with extension layer).
 *
 * @module providers/supabase
 */

import { supabaseDataProvider } from "ra-supabase-core";
import type { DataProvider } from "ra-core";
import { devLog } from "@/lib/devLogger";

// Auth provider (same for both architectures)
export { authProvider } from "./authProvider";

// Supabase client for direct access
import { supabase } from "./supabase";

// Unified provider (existing monolithic implementation)
import { unifiedDataProvider } from "./unifiedDataProvider";

// Composed provider architecture (new handler-based implementation)
import { createComposedDataProvider } from "./composedDataProvider";
import { createServiceContainer } from "./services";
import { extendWithCustomMethods } from "./extensions";

/**
 * Feature flag for composed provider architecture
 *
 * Set VITE_USE_COMPOSED_PROVIDER=true in .env to enable the new architecture.
 * Default: false (uses unifiedDataProvider for backward compatibility)
 *
 * Architecture comparison:
 * - **Unified (default)**: Single monolithic provider with inline services (1090 LOC)
 * - **Composed (new)**: Handler-based routing with service container (174 LOC + extensions)
 *
 * Migration strategy:
 * 1. Deploy with flag disabled (production uses unified)
 * 2. Enable for testing environments
 * 3. Gradual rollout: 10% → 50% → 100%
 * 4. Remove unified after 1 week stable
 */
const USE_COMPOSED_PROVIDER = import.meta.env.VITE_USE_COMPOSED_PROVIDER === "true";

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
  return extendWithCustomMethods({
    composedProvider,
    services,
    supabaseClient: supabase,
  });
}

/**
 * Data provider instance
 *
 * Conditionally creates either unified or composed provider based on feature flag.
 * Logs active provider to console for debugging and monitoring.
 */
export const dataProvider: DataProvider = (() => {
  if (USE_COMPOSED_PROVIDER) {
    console.log(
      "[DataProvider] 🚀 Using COMPOSED provider architecture (handler-based with extensions)"
    );
    return createExtendedDataProvider();
  } else {
    console.log("[DataProvider] 📦 Using UNIFIED provider architecture (monolithic, default)");
    return unifiedDataProvider;
  }
})();

/**
 * Export provider creation utilities for testing
 *
 * Allows tests to create isolated provider instances without relying
 * on the singleton export above.
 */
export { createExtendedDataProvider, supabase };
