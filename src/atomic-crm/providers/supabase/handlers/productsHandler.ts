/**
 * Products Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the products resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withLifecycleCallbacks → Resource-specific logic (soft delete only)
 * 3. withValidation → Zod schema validation
 * 4. withErrorLogging → Structured error handling
 * 5. Custom create interception → Atomic product + distributors via RPC
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
} from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { productsCallbacks } from "../callbacks";
import {
  validateCreateProductWithDistributors,
  transformToRpcParams,
  type ProductWithDistributors,
} from "../../../validation/productWithDistributors";
import { ProductsService, type ProductDistributorInput } from "../../../services/products.service";
import type { ExtendedDataProvider } from "../extensions/types";

/**
 * Extended DataProvider interface with RPC support
 * Mirrors the pattern from opportunitiesCallbacks.ts
 */
interface DataProviderWithRpc extends DataProvider {
  rpc?: (functionName: string, params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Create a fully composed DataProvider for products
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: withLifecycleCallbacks MUST wrap withValidation so that beforeSave
 * can strip computed fields (from views) BEFORE Zod validation runs.
 *
 * ADDITION: Wraps create method to intercept products with distributors,
 * calling create_product_with_distributors RPC for atomic creation.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all products-specific behavior
 */
export function createProductsHandler(baseProvider: DataProvider): DataProvider {
  // Create the standard composed handler
  const composedHandler = withErrorLogging(
    withLifecycleCallbacks(withValidation(baseProvider), [productsCallbacks])
  );

  // Wrap create method to intercept products with distributors
  return {
    ...composedHandler,

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
        const data = params.data as unknown as Record<string, unknown>;
        const distributors = data.distributors as unknown[] | undefined;

        // Check if we have distributors to create atomically
        if (Array.isArray(distributors) && distributors.length > 0) {
          // Validate with the combined schema (Engineering Constitution: Zod at boundary)
          await validateCreateProductWithDistributors(data);

          // Transform to RPC parameters
          const { productData, distributors: distData } = transformToRpcParams(
            data as unknown as ProductWithDistributors
          );

          // Get RPC method from composed handler
          const dpWithRpc = composedHandler as DataProviderWithRpc;
          if (!dpWithRpc.rpc) {
            throw new Error(
              "Product creation with distributors failed: DataProvider does not support RPC"
            );
          }

          // Call atomic RPC function
          const result = await dpWithRpc.rpc("create_product_with_distributors", {
            product_data: productData,
            distributors: distData,
          });

          // Return in React Admin format
          return { data: result as RecordType };
        }

        // No distributors - strip any distributor-related fields and use normal flow
        // This prevents "Unrecognized keys" error from z.strictObject()
        const {
          distributors: _distributors,
          distributor_ids: _distributorIds,
          product_distributors: _productDistributors,
          ...cleanData
        } = data;

        return composedHandler.create<RecordType>(resource, {
          ...params,
          data: cleanData as RecordType,
        } as CreateParams<RecordType>);
      }

      // Not products - delegate to composed handler
      return composedHandler.create<RecordType>(resource, params);
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
        const data = params.data as unknown as Record<string, unknown>;
        const distributors = data.distributors as unknown[] | undefined;
        const distributorIds = data.distributor_ids as number[] | undefined;

        // Check if we have distributor data to sync
        if (
          (Array.isArray(distributors) && distributors.length > 0) ||
          (Array.isArray(distributorIds) && distributorIds.length > 0)
        ) {
          // Create service instance with extended data provider
          const service = new ProductsService(baseProvider as ExtendedDataProvider);

          // Transform distributors to service format
          let distributorInputs: ProductDistributorInput[] = [];

          if (Array.isArray(distributors) && distributors.length > 0) {
            // Full distributor objects with vendor_item_number
            distributorInputs = distributors.map((d) => {
              const dist = d as Record<string, unknown>;
              return {
                distributor_id: Number(dist.distributor_id ?? dist.id),
                vendor_item_number: (dist.vendor_item_number as string) ?? null,
              };
            });
          } else if (Array.isArray(distributorIds) && distributorIds.length > 0) {
            // Just IDs - no vendor_item_number
            const productDistributors = (data.product_distributors ?? {}) as Record<
              number,
              { vendor_item_number: string | null }
            >;
            distributorInputs = distributorIds.map((id) => ({
              distributor_id: id,
              vendor_item_number: productDistributors[id]?.vendor_item_number ?? null,
            }));
          }

          // Strip distributor fields from product data
          const {
            distributors: _distributors,
            distributor_ids: _distributorIds,
            product_distributors: _productDistributors,
            ...cleanData
          } = data;

          // Call service for atomic update
          const result = await service.updateWithDistributors(
            params.id,
            cleanData,
            distributorInputs
          );

          return { data: result as RecordType };
        }

        // No distributors - strip any distributor-related fields and use normal flow
        const {
          distributors: _distributors,
          distributor_ids: _distributorIds,
          product_distributors: _productDistributors,
          ...cleanData
        } = data;

        return composedHandler.update<RecordType>(resource, {
          ...params,
          data: cleanData as Partial<RecordType>,
        } as UpdateParams<RecordType>);
      }

      // Not products - delegate to composed handler
      return composedHandler.update<RecordType>(resource, params);
    },

    /**
     * Intercept delete for products
     *
     * Uses ProductsService.softDelete() via RPC to bypass RLS SELECT policy
     * that would otherwise prevent seeing the updated row after setting deleted_at.
     */
    delete: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: DeleteParams<RecordType>
    ) => {
      // Only intercept products resource
      if (resource === "products") {
        const service = new ProductsService(baseProvider as ExtendedDataProvider);
        await service.softDelete(params.id);

        // Return in React Admin format
        return { data: params.previousData as RecordType };
      }

      // Not products - delegate to composed handler
      return composedHandler.delete<RecordType>(resource, params);
    },

    /**
     * Intercept deleteMany for products
     *
     * Uses ProductsService.softDeleteMany() via RPC to bypass RLS SELECT policy.
     */
    deleteMany: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: DeleteManyParams<RecordType>
    ) => {
      // Only intercept products resource
      if (resource === "products") {
        const service = new ProductsService(baseProvider as ExtendedDataProvider);
        await service.softDeleteMany(params.ids);

        // Return in React Admin format
        return { data: params.ids };
      }

      // Not products - delegate to composed handler
      return composedHandler.deleteMany<RecordType>(resource, params);
    },
  };
}
