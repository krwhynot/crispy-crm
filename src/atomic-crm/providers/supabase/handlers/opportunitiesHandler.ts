/**
 * Opportunities Handler - Composed DataProvider
 * @status Feature Complete
 * @since 2025-01
 * @migration Strangler Fig Pattern (95% compliant)
 *
 * @dependencies
 * - RPC: sync_opportunity_with_products
 * - RPC: archive_opportunity_with_relations
 * - Service: OpportunitiesService
 * - Schema: opportunityProductSyncHandlerSchema (canonical)
 *
 * Composes all infrastructure pieces for the opportunities resource:
 * 1. customOpportunitiesHandler → Opportunities-specific logic (create/update with products)
 * 2. withValidation → Zod schema validation at API boundary
 * 3. withLifecycleCallbacks → Resource-specific callbacks (RPC archive, soft delete filter)
 * 4. withErrorLogging → Structured error handling (OUTERMOST)
 *
 * Composition order (innermost to outermost):
 * customOpportunitiesHandler → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL FIX (2025-01): Custom methods are now defined INSIDE the wrapper chain,
 * not outside. This ensures withErrorLogging catches and reports all errors properly.
 * Previously, create/update with products_to_sync bypassed error logging when the
 * "post-composition spread pattern" was used.
 *
 * Note: The RPC archive_opportunity_with_relations logic is encapsulated
 * in opportunitiesCallbacks. The handler composition remains identical.
 *
 * Engineering Constitution: Composition over inheritance, Service layer for business logic
 */

import {
  withLifecycleCallbacks,
  type DataProvider,
  type CreateParams,
  type UpdateParams,
  type RaRecord,
  type GetListParams,
  type GetOneParams,
  type GetManyParams,
  type GetManyReferenceParams,
  type DeleteParams,
  type DeleteManyParams,
  type UpdateManyParams,
} from "react-admin";
import { z } from "zod";
import { withErrorLogging, withValidation } from "../wrappers";
import { opportunitiesCallbacks } from "../callbacks";
import { OpportunitiesService } from "../../../services/opportunities.service";
import { assertExtendedDataProvider } from "../typeGuards";
import {
  opportunityProductSyncHandlerSchema,
  type OpportunityProductSyncHandler,
} from "../../../validation/opportunities";

/**
 * Schema for validating handler input data with products_to_sync virtual field.
 * Uses .passthrough() to preserve all opportunity fields while type-checking the products array.
 *
 * Uses canonical opportunityProductSyncHandlerSchema from validation layer.
 * This ensures consistency with API boundary validation and diffProducts.ts.
 */

const handlerInputSchema = z
  .object({
    products_to_sync: z.array(opportunityProductSyncHandlerSchema).optional(),
  })
  .passthrough();

const previousDataSchema = z
  .object({
    products: z.array(opportunityProductSyncHandlerSchema).optional(),
    version: z.number().optional(), // FIX [SF-C12]: Extract version for optimistic locking
  })
  .passthrough();

/**
 * Create a fully composed DataProvider for opportunities
 *
 * Composition order (innermost to outermost):
 * customOpportunitiesHandler → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Custom logic is defined INSIDE the wrapper chain so that:
 * - withErrorLogging catches and logs ALL errors (including from OpportunitiesService)
 * - withValidation validates data at API boundary
 * - withLifecycleCallbacks runs before/after hooks (soft delete filter, RPC archive)
 *
 * Note on products_to_sync: This virtual field is handled by the custom create/update
 * methods BEFORE lifecycle callbacks strip it. The OpportunitiesService handles the
 * atomic product sync operations.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all opportunities-specific behavior
 */
export function createOpportunitiesHandler(baseProvider: DataProvider): DataProvider {
  /**
   * Custom opportunities handler with product sync logic
   *
   * This handler is defined FIRST, then wrapped with the standard wrapper chain.
   * This ensures all custom logic is INSIDE the "safety bubble" of withErrorLogging.
   */
  const customOpportunitiesHandler: DataProvider = {
    // Pass through read operations directly to baseProvider
    getList: <RecordType extends RaRecord = RaRecord>(resource: string, params: GetListParams) =>
      baseProvider.getList<RecordType>(resource, params),

    getOne: <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: GetOneParams<RecordType>
    ) => baseProvider.getOne<RecordType>(resource, params),

    getMany: <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: GetManyParams<RecordType>
    ) => baseProvider.getMany<RecordType>(resource, params),

    getManyReference: <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: GetManyReferenceParams
    ) => baseProvider.getManyReference<RecordType>(resource, params),

    /**
     * Intercept create for opportunities with products
     *
     * If products_to_sync field is present:
     * 1. Delegate to OpportunitiesService.createWithProducts
     * 2. Return created opportunity in React Admin format
     *
     * Otherwise, delegate to baseProvider (lifecycle callbacks will strip virtual fields)
     */
    create: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: CreateParams<RecordType>
    ) => {
      if (resource === "opportunities") {
        const validatedData = handlerInputSchema.parse(params.data);
        const productsToSync: OpportunityProductSyncHandler[] | undefined =
          validatedData.products_to_sync;

        // Only use OpportunitiesService when there are actual products to sync
        // Empty arrays should use the standard create path (avoids ExtendedDataProvider requirement)
        if (Array.isArray(productsToSync) && productsToSync.length > 0) {
          // Service is instantiated here to ensure it uses the wrapped provider
          const extendedProvider = assertExtendedDataProvider(baseProvider);
          const service = new OpportunitiesService(extendedProvider);
          const result = await service.createWithProducts(validatedData);
          return { data: result } as { data: RecordType };
        }
      }

      // Fallback: delegate to baseProvider (lifecycle callbacks will handle field stripping)
      return baseProvider.create<RecordType>(resource, params);
    },

    /**
     * Intercept update for opportunities with products
     *
     * If products_to_sync field is present:
     * 1. Extract previousData.products for diffing
     * 2. Delegate to OpportunitiesService.updateWithProducts
     * 3. Return updated opportunity in React Admin format
     *
     * Otherwise, delegate to baseProvider (lifecycle callbacks will strip virtual fields)
     */
    update: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: UpdateParams<RecordType>
    ) => {
      if (resource === "opportunities") {
        const validatedData = handlerInputSchema.parse(params.data);
        const productsToSync: OpportunityProductSyncHandler[] | undefined =
          validatedData.products_to_sync;

        // Only use OpportunitiesService when there are actual products to sync
        // Empty arrays should use the standard update path (avoids ExtendedDataProvider requirement)
        if (Array.isArray(productsToSync) && productsToSync.length > 0) {
          const validatedPreviousData = previousDataSchema.parse(params.previousData);
          const previousProducts: OpportunityProductSyncHandler[] =
            validatedPreviousData.products ?? [];
          // FIX [SF-C12]: Pass version for optimistic locking concurrency check
          const previousVersion: number | undefined = validatedPreviousData.version;

          // Service is instantiated here to ensure it uses the wrapped provider
          const extendedProvider = assertExtendedDataProvider(baseProvider);
          const service = new OpportunitiesService(extendedProvider);
          const result = await service.updateWithProducts(
            params.id,
            validatedData,
            previousProducts,
            previousVersion // FIX [SF-C12]: Enable optimistic locking
          );
          return { data: result } as { data: RecordType };
        }
      }

      // Fallback: delegate to baseProvider (lifecycle callbacks will handle field stripping)
      return baseProvider.update<RecordType>(resource, params);
    },

    /**
     * Pass through updateMany to baseProvider
     */
    updateMany: <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: UpdateManyParams<RecordType>
    ) => baseProvider.updateMany<RecordType>(resource, params),

    /**
     * Pass through delete to baseProvider (lifecycle callbacks handle RPC archive)
     */
    delete: <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: DeleteParams<RecordType>
    ) => baseProvider.delete<RecordType>(resource, params),

    /**
     * Pass through deleteMany to baseProvider
     */
    deleteMany: <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: DeleteManyParams<RecordType>
    ) => baseProvider.deleteMany<RecordType>(resource, params),
  };

  /**
   * Wrap the custom handler with the standard wrapper chain
   *
   * Order (innermost to outermost):
   * 1. customOpportunitiesHandler - Our product sync logic
   * 2. withValidation - Zod schema validation at API boundary
   * 3. withLifecycleCallbacks - Before/after hooks (soft delete filter, RPC archive)
   * 4. withErrorLogging - Structured error logging (catches ALL errors)
   *
   * This ensures ALL custom logic is protected by error logging.
   */
  return withErrorLogging(
    withLifecycleCallbacks(withValidation(customOpportunitiesHandler), [opportunitiesCallbacks])
  );
}
