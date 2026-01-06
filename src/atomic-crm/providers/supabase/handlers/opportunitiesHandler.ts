/**
 * Opportunities Handler - Composed DataProvider
 *
 * Composes all infrastructure pieces for the opportunities resource:
 * 1. Base provider → Raw Supabase operations
 * 2. withLifecycleCallbacks → Resource-specific logic (RPC archive, soft delete filter)
 * 3. withValidation → Zod schema validation
 * 4. withErrorLogging → Structured error handling
 * 5. Service delegation → OpportunitiesService for product sync
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
} from "react-admin";
import { z } from "zod";
import { withErrorLogging, withValidation } from "../wrappers";
import { opportunitiesCallbacks } from "../callbacks";
import { OpportunitiesService } from "../../../services/opportunities.service";
import type { ExtendedDataProvider } from "../extensions/types";
import type { Product } from "../../../opportunities/utils/diffProducts";

/**
 * Schema for validating handler input data with products_to_sync virtual field.
 * Uses .passthrough() to preserve all opportunity fields while type-checking the products array.
 */
const productSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  product_id_reference: z.union([z.string(), z.number()]),
  product_name: z.string().optional(),
  product_category: z.string().optional(),
  notes: z.string().optional(),
});

const handlerInputSchema = z
  .object({
    products_to_sync: z.array(productSchema).optional(),
  })
  .passthrough();

const previousDataSchema = z
  .object({
    products: z.array(productSchema).optional(),
  })
  .passthrough();

/**
 * Create a fully composed DataProvider for opportunities
 *
 * Composition order (innermost to outermost):
 * baseProvider → withValidation → withLifecycleCallbacks → withErrorLogging
 *
 * CRITICAL: withLifecycleCallbacks MUST wrap withValidation so that beforeSave
 * can strip computed fields (from views/triggers) BEFORE Zod validation runs.
 * Otherwise validation fails with "Unrecognized keys" for view-computed fields.
 *
 * ADDITION: Wraps create/update methods to intercept opportunities with products,
 * delegating to OpportunitiesService for atomic product synchronization.
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns Composed DataProvider with all opportunities-specific behavior
 */
export function createOpportunitiesHandler(baseProvider: DataProvider): DataProvider {
  const composedHandler = withErrorLogging(
    withLifecycleCallbacks(withValidation(baseProvider), [opportunitiesCallbacks])
  );

  const service = new OpportunitiesService(baseProvider as ExtendedDataProvider);

  return {
    ...composedHandler,

    /**
     * Intercept create for opportunities with products
     *
     * If products_to_sync field is present:
     * 1. Delegate to OpportunitiesService.createWithProducts
     * 2. Return created opportunity in React Admin format
     *
     * Otherwise, delegate to composed handler
     */
    create: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: CreateParams<RecordType>
    ) => {
      if (resource === "opportunities") {
        const validatedData = handlerInputSchema.parse(params.data);
        const productsToSync = validatedData.products_to_sync as Product[] | undefined;

        if (Array.isArray(productsToSync)) {
          const result = await service.createWithProducts(validatedData);
          return { data: result as RecordType };
        }
      }

      return composedHandler.create<RecordType>(resource, params);
    },

    /**
     * Intercept update for opportunities with products
     *
     * If products_to_sync field is present:
     * 1. Extract previousData.products for diffing
     * 2. Delegate to OpportunitiesService.updateWithProducts
     * 3. Return updated opportunity in React Admin format
     *
     * Otherwise, delegate to composed handler
     */
    update: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: UpdateParams<RecordType>
    ) => {
      if (resource === "opportunities") {
        const validatedData = handlerInputSchema.parse(params.data);
        const productsToSync = validatedData.products_to_sync as Product[] | undefined;

        if (Array.isArray(productsToSync)) {
          const validatedPreviousData = previousDataSchema.parse(params.previousData);
          const previousProducts = (validatedPreviousData.products as Product[]) ?? [];

          const result = await service.updateWithProducts(params.id, validatedData, previousProducts);
          return { data: result as RecordType };
        }
      }

      return composedHandler.update<RecordType>(resource, params);
    },
  };
}
