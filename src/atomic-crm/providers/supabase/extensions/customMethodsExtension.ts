/**
 * Custom Methods Extension Layer
 *
 * Decorator function that extends the composedDataProvider with all 30 custom methods
 * from the original unifiedDataProvider. Breaks circular dependency by receiving
 * pre-initialized services from the ServiceContainer factory.
 *
 * Architecture:
 * - Delegates business logic methods (19) to service layer via category extensions
 * - Implements infrastructure methods (11) with direct Supabase client access
 * - Preserves exact API compatibility with unifiedDataProvider
 * - Maintains Zod validation for RPC and Edge Function parameters
 *
 * Category Extensions:
 * - Sales (3 methods): salesCreate, salesUpdate, updatePassword
 * - Opportunities (2 methods): archiveOpportunity, unarchiveOpportunity
 * - Junctions (13 methods): contact-orgs, opp-participants, opp-contacts
 * - RPC (1 method): rpc (generic RPC execution)
 * - Storage (4 methods): upload, getPublicUrl, remove, list
 * - Edge Functions (1 method): invoke
 * - Specialized (1 method): createBoothVisitor
 *
 * Engineering Constitution:
 * - Service layer orchestration (business logic delegated to services)
 * - Single composable entry point (all methods accessible via provider)
 * - Fail-fast error handling (Zod validation, explicit error logging)
 *
 * @module providers/supabase/extensions/customMethodsExtension
 */

import type { DataProvider } from "ra-core";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceContainer } from "../services";
import type { ExtendedDataProvider } from "./types";

// Import category extension creators
import { createSalesExtension } from "./salesExtension";
import { createOpportunitiesExtension } from "./opportunitiesExtension";
import { createJunctionsExtension } from "./junctionsExtension";
import { createRPCExtension } from "./rpcExtension";
import { createStorageExtension } from "./storageExtension";
import { createEdgeFunctionsExtension } from "./edgeFunctionsExtension";
import { createSpecializedExtension } from "./specializedExtension";

/**
 * Configuration for extending DataProvider with custom methods
 */
export interface ExtensionConfig {
  /** Base DataProvider (CRUD only) - MUST be mutated with RPC methods for runtime service instances */
  baseProvider: DataProvider;

  /** Composed DataProvider with handler routing */
  composedProvider: DataProvider;

  /** Pre-initialized service container with all business logic services */
  services: ServiceContainer;

  /** Supabase client for direct RPC/Storage/Edge Function access */
  supabaseClient: SupabaseClient;
}

/**
 * Extend DataProvider with custom methods
 *
 * Decorator function that adds all 30 custom methods from unifiedDataProvider
 * to the composedDataProvider. Breaks circular dependency by receiving
 * services as a dependency rather than initializing them inline.
 *
 * @param config - Configuration with provider, services, and Supabase client
 * @returns Extended DataProvider with all CRUD + custom methods
 *
 * @example
 * ```typescript
 * // Stage 1: Create base provider (CRUD only)
 * const baseProvider = supabaseDataProvider({
 *   instanceUrl: import.meta.env.VITE_SUPABASE_URL,
 *   apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
 *   supabaseClient: supabase,
 * });
 *
 * // Stage 2: Initialize services (breaks circular dependency)
 * const services = createServiceContainer(baseProvider);
 *
 * // Stage 3: Create composed provider with handler routing
 * const composedProvider = createComposedDataProvider(baseProvider);
 *
 * // Stage 4: Extend with custom methods
 * export const dataProvider = extendWithCustomMethods({
 *   composedProvider,
 *   services,
 *   supabaseClient: supabase,
 * });
 * ```
 *
 * @remarks
 * **Method Delegation Strategy:**
 * - **Service Methods (18 total):**
 *   - Sales: 3 methods → SalesService
 *   - Opportunities: 2 methods → OpportunitiesService
 *   - Junctions: 13 methods → JunctionsService
 *
 * - **Infrastructure Methods (11 total):**
 *   - RPC: 1 method → Direct Supabase with Zod validation
 *   - Storage: 4 methods → Direct Supabase storage API
 *   - Edge Functions: 1 method → Direct Supabase functions API with Zod validation
 *   - Specialized: 1 method → Direct Supabase RPC (createBoothVisitor)
 *
 * **Validation:**
 * - RPC calls validate against RPC_SCHEMAS
 * - Edge Functions validate against edgeFunctionSchemas
 * - All errors logged with context for debugging
 *
 * **Error Handling:**
 * - Fail-fast approach (no circuit breakers)
 * - Explicit error logging before throwing
 * - Type-safe error messages
 */
export function extendWithCustomMethods(config: ExtensionConfig): ExtendedDataProvider {
  const { baseProvider, composedProvider, services, supabaseClient } = config;

  // Create category extensions
  const salesExt = createSalesExtension(services);
  const opportunitiesExt = createOpportunitiesExtension(services);
  const junctionsExt = createJunctionsExtension(services);
  const rpcExt = createRPCExtension(supabaseClient);
  const storageExt = createStorageExtension(supabaseClient);
  const edgeFunctionsExt = createEdgeFunctionsExtension(supabaseClient);
  const specializedExt = createSpecializedExtension(supabaseClient);

  // CRITICAL: Mutate baseProvider so it can be mutated with RPC methods.
  // Handlers create NEW service instances with baseProvider at runtime,
  // so baseProvider MUST have RPC methods added to it.
  Object.assign(
    baseProvider,
    salesExt,
    opportunitiesExt,
    junctionsExt,
    rpcExt,
    storageExt,
    edgeFunctionsExt,
    specializedExt
  );

  // Also mutate composedProvider to preserve reference held by services
  // This allows services to access RPC/storage/invoke methods through their baseProvider reference
  Object.assign(
    composedProvider,
    salesExt,
    opportunitiesExt,
    junctionsExt,
    rpcExt,
    storageExt,
    edgeFunctionsExt,
    specializedExt
  );

  return composedProvider as ExtendedDataProvider;
}
