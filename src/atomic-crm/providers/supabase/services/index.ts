/**
 * Service Container Factory
 *
 * Centralizes service initialization to break circular dependency between
 * DataProvider and Service layer.
 *
 * Architecture:
 * - Services are initialized with base DataProvider (CRUD only)
 * - Custom methods are added via extension layer after services exist
 * - This breaks the circular dependency: Services ← Base → Handlers → Extension → Services
 *
 * Engineering Constitution:
 * - Single composable entry point (DataProvider abstraction)
 * - Service layer orchestration (business logic in services, not components)
 * - Dependency injection (services receive provider in constructor)
 *
 * @module providers/supabase/services
 */

import type { DataProvider } from "ra-core";
import {
  SalesService,
  OpportunitiesService,
  JunctionsService,
  SegmentsService,
} from "../../../services";

/**
 * Service container with all business logic services
 *
 * Each service receives the DataProvider for CRUD operations.
 * Services handle complex business logic that goes beyond simple CRUD:
 * - SalesService: Account manager creation via Edge Functions
 * - OpportunitiesService: Product sync, archive/unarchive workflows
 * - JunctionsService: Many-to-many relationship management
 * - SegmentsService: Get-or-create pattern for segment tagging
 */
export interface ServiceContainer {
  sales: SalesService;
  opportunities: OpportunitiesService;
  junctions: JunctionsService;
  segments: SegmentsService;
}

/**
 * Create service container with base DataProvider
 *
 * Initializes all service instances for delegation from extended provider.
 * Services use the base DataProvider for standard CRUD operations only.
 * Custom methods (rpc, storage, invoke) are added later via extension layer.
 *
 * @param baseProvider - Raw Supabase DataProvider (no handlers, no custom methods)
 * @returns Container with all 4 service instances ready for delegation
 *
 * @example
 * ```typescript
 * // Stage 1: Create base provider
 * const baseProvider = supabaseDataProvider({
 *   instanceUrl: import.meta.env.VITE_SUPABASE_URL,
 *   apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
 *   supabaseClient: supabase,
 * });
 *
 * // Stage 2: Initialize services (breaks circular dependency)
 * const services = createServiceContainer(baseProvider);
 *
 * // Stage 3: Create composed provider with handlers
 * const composedProvider = createComposedDataProvider(baseProvider);
 *
 * // Stage 4: Extend with custom methods using services
 * const extendedProvider = extendWithCustomMethods({
 *   composedProvider,
 *   services, // Services initialized here
 *   supabaseClient: supabase,
 * });
 * ```
 *
 * @remarks
 * Services are stateless and thread-safe. They can be reused across requests.
 * Each service instance is a singleton within the container lifecycle.
 */
export function createServiceContainer(baseProvider: DataProvider): ServiceContainer {
  return {
    // Sales service - Account manager CRUD via Edge Functions
    // Used by: salesCreate, salesUpdate, updatePassword custom methods
    sales: new SalesService(baseProvider),

    // Opportunities service - Product sync, archive/unarchive workflows
    // Used by: archiveOpportunity, unarchiveOpportunity custom methods
    opportunities: new OpportunitiesService(baseProvider),

    // Junctions service - Many-to-many relationship management
    // Used by: 13 junction custom methods (contacts-orgs, opportunity participants/contacts)
    junctions: new JunctionsService(baseProvider),

    // Segments service - Get-or-create pattern for segment tagging
    // Used by: segment creation in unifiedDataProvider.create
    segments: new SegmentsService(baseProvider),
  };
}

/**
 * Export types for type-safe service access
 */
export type { ServiceContainer };

/**
 * Re-export utility services for backward compatibility
 *
 * These are internal provider services used by unifiedDataProvider:
 * - ValidationService: Zod schema validation for resources
 * - TransformService: Data transformation (JSONB arrays, file uploads)
 * - StorageService: File storage operations
 */
export { ValidationService } from "./ValidationService";
export { TransformService } from "./TransformService";
export { StorageService } from "./StorageService";
