/**
 * Products Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the products resource:
 * 1. customProductsHandler → Products-specific logic (create, update, delete)
 * 2. withValidation → Zod schema validation
 * 3. withLifecycleCallbacks → Resource-specific callbacks
 * 4. withErrorLogging → Structured error handling (OUTERMOST)
 *
 * CRITICAL FIX (2024-01): Custom methods are now defined INSIDE the wrapper chain,
 * not outside. This ensures withErrorLogging catches and reports all errors properly.
 * Previously, delete/deleteMany bypassed error logging causing "zombie delete" bugs.
 *
 * Note: productsCallbacks uses the createResourceCallbacks factory
 * with minimal configuration (soft delete only, no computed fields).
 *
 * Engineering Constitution: Composition over inheritance
 */

import {
  withLifecycleCallbacks,
  type DataProvider,
  type CreateParams,
  type UpdateParams,
  type DeleteParams,
  type DeleteManyParams,
  type RaRecord,
  type GetListParams,
  type GetOneParams,
  type GetManyParams,
  type GetManyReferenceParams,
  type UpdateManyParams,
} from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { productsCallbacks } from "../callbacks";
import {
  productWithDistributorsSchema,
  distributorAssociationSchema,
  transformToRpcParams,
} from "../../../validation/productWithDistributors";
import { z } from "zod";
import { ProductsService, type ProductDistributorInput } from "../../../services/products.service";
import { hasRpcMethod, assertExtendedDataProvider } from "../typeGuards";

/**
 * Schema for product update data with optional distributor associations
 * Uses .passthrough() to allow additional fields from the form that we strip later
 */
const productUpdateWithDistributorsSchema = z
  .object({
    distributors: z.array(distributorAssociationSchema).optional(),
    distributor_ids: z.array(z.coerce.number().int().positive()).optional(),
    product_distributors: z
      .record(z.coerce.number(), z.object({ vendor_item_number: z.string().nullable() }))
      .optional(),
  })
  .passthrough();

/**
 * Schema for stripping distributor fields from product data
 * Used when productWithDistributorsSchema validation fails (no distributors case)
 */
const productFieldStripSchema = z
  .object({
    distributors: z.unknown().optional(),
    distributor_ids: z.unknown().optional(),
    product_distributors: z.unknown().optional(),
  })
  .passthrough();

/**
 * Create a fully composed DataProvider for products
 *
 * Composition order (innermost to outermost):
 * customProductsHandler → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: Custom logic is defined INSIDE the wrapper chain so that:
 * - withErrorLogging catches and logs ALL errors (including from delete)
 * - withValidation validates data at API boundary
 * - withLifecycleCallbacks runs before/after hooks
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all products-specific behavior
 */
export function createProductsHandler(baseProvider: DataProvider): DataProvider {
  /**
   * Custom products handler with product-specific logic
   *
   * This handler is defined FIRST, then wrapped with the standard wrapper chain.
   * This ensures all custom logic is INSIDE the "safety bubble" of withErrorLogging.
   */
  const customProductsHandler: DataProvider = {
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
     * Intercept create for products with distributors
     *
     * If distributors array is present and non-empty:
     * 1. Validate with productWithDistributorsSchema
     * 2. Call create_product_with_distributors RPC atomically
     * 3. Return created product
     *
     * Otherwise, strip distributor fields and delegate to normal flow
     */
    create: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: CreateParams<RecordType>
    ) => {
      // Only intercept products resource
      if (resource === "products") {
        // Parse with Zod schema for type-safe access (Engineering Constitution: Zod at boundary)
        const parseResult = productWithDistributorsSchema.safeParse(params.data);

        // Check if we have distributors to create atomically
        if (parseResult.success && parseResult.data.distributors.length > 0) {
          const validatedData = parseResult.data;

          // Transform to RPC parameters using validated data
          const { productData, distributors: distData } = transformToRpcParams(validatedData);

          // Get RPC method from baseProvider (will be available after wrapping)
          if (!hasRpcMethod(baseProvider)) {
            throw new Error(
              "Product creation with distributors failed: DataProvider does not support RPC"
            );
          }

          // Call atomic RPC function
          const result = await baseProvider.rpc("create_product_with_distributors", {
            product_data: productData,
            distributors: distData,
          });

          // Return in React Admin format
          return { data: result } as { data: RecordType };
        }

        // No distributors or validation failed - strip any distributor-related fields and use normal flow
        // This prevents "Unrecognized keys" error from z.strictObject()
        const parsed = productFieldStripSchema.parse(params.data);
        const {
          distributors: _distributors,
          distributor_ids: _distributorIds,
          product_distributors: _productDistributors,
          ...cleanData
        } = parsed;

        return baseProvider.create<RecordType>(resource, {
          ...params,
          data: cleanData,
        } as CreateParams<RecordType>);
      }

      // Not products - delegate to base provider
      return baseProvider.create<RecordType>(resource, params);
    },

    /**
     * Intercept update for products with distributors
     *
     * If distributors or distributor_ids is present:
     * 1. Extract distributor data from params
     * 2. Call ProductsService.updateWithDistributors() for atomic update
     * 3. Return updated product
     *
     * Otherwise, strip distributor fields and delegate to normal flow
     */
    update: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: UpdateParams<RecordType>
    ) => {
      // Only intercept products resource
      if (resource === "products") {
        // Parse with Zod schema for type-safe access (Engineering Constitution: Zod at boundary)
        const validatedData = productUpdateWithDistributorsSchema.parse(params.data);
        const { distributors, distributor_ids, product_distributors, ...cleanData } = validatedData;

        // Check if we have distributor data to sync
        if (
          (Array.isArray(distributors) && distributors.length > 0) ||
          (Array.isArray(distributor_ids) && distributor_ids.length > 0)
        ) {
          // Create service instance with extended data provider
          const extendedProvider = assertExtendedDataProvider(baseProvider);
          const service = new ProductsService(extendedProvider);

          // Transform distributors to service format
          let distributorInputs: ProductDistributorInput[] = [];

          if (Array.isArray(distributors) && distributors.length > 0) {
            // Full distributor objects with vendor_item_number - already validated by Zod
            distributorInputs = distributors.map((dist) => ({
              distributor_id: Number(dist.distributor_id),
              vendor_item_number: dist.vendor_item_number ?? null,
            }));
          } else if (Array.isArray(distributor_ids) && distributor_ids.length > 0) {
            // Just IDs - use product_distributors map for vendor_item_number
            distributorInputs = distributor_ids.map((id) => ({
              distributor_id: id,
              vendor_item_number: product_distributors?.[id]?.vendor_item_number ?? null,
            }));
          }

          // Call service for atomic update
          const result = await service.updateWithDistributors(
            params.id,
            cleanData,
            distributorInputs
          );

          return { data: result } as { data: RecordType };
        }

        // No distributors - cleanData already has distributor fields stripped
        return baseProvider.update<RecordType>(resource, {
          ...params,
          data: cleanData,
        } as UpdateParams<RecordType>);
      }

      // Not products - delegate to base provider
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
     * Intercept delete for products
     *
     * Uses ProductsService.softDelete() via RPC to bypass RLS SELECT policy
     * that would otherwise prevent seeing the updated row after setting deleted_at.
     *
     * FIXED: This method is now INSIDE the wrapper chain, so errors are properly
     * caught and logged by withErrorLogging.
     */
    delete: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: DeleteParams<RecordType>
    ) => {
      // Only intercept products resource
      if (resource === "products") {
        const extendedProvider = assertExtendedDataProvider(baseProvider);
        const service = new ProductsService(extendedProvider);
        await service.softDelete(params.id);

        // Return in React Admin format
        return { data: params.previousData } as { data: RecordType };
      }

      // Not products - delegate to base provider
      return baseProvider.delete<RecordType>(resource, params);
    },

    /**
     * Intercept deleteMany for products
     *
     * Uses ProductsService.softDeleteMany() via RPC to bypass RLS SELECT policy.
     *
     * FIXED: This method is now INSIDE the wrapper chain, so errors are properly
     * caught and logged by withErrorLogging.
     */
    deleteMany: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: DeleteManyParams<RecordType>
    ) => {
      // Only intercept products resource
      if (resource === "products") {
        const extendedProvider = assertExtendedDataProvider(baseProvider);
        const service = new ProductsService(extendedProvider);
        await service.softDeleteMany(params.ids);

        // Return in React Admin format
        return { data: params.ids };
      }

      // Not products - delegate to base provider
      return baseProvider.deleteMany<RecordType>(resource, params);
    },
  };

  /**
   * Wrap the custom handler with the standard wrapper chain
   *
   * Order (innermost to outermost):
   * 1. customProductsHandler - Our product-specific logic
   * 2. withValidation - Zod schema validation at API boundary
   * 3. withLifecycleCallbacks - Before/after hooks for soft delete
   * 4. withErrorLogging - Structured error logging (catches ALL errors)
   *
   * This ensures ALL custom logic is protected by error logging.
   */
  return withErrorLogging(
    withLifecycleCallbacks(withValidation(customProductsHandler), [productsCallbacks])
  );
}
