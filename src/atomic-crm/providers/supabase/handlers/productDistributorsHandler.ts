/**
 * Product Distributors Handler - Composed DataProvider
 *
 * Handles the product_distributors junction table with COMPOSITE PRIMARY KEY.
 * This table uses (product_id, distributor_id) instead of a single id column.
 *
 * Key behaviors:
 * 1. Parse composite IDs (format: "product_id-distributor_id") for getOne, update, delete
 * 2. Create composite IDs from product_id + distributor_id for getList results
 * 3. Delegate to ProductDistributorsService for all operations
 * 4. HARD DELETE (not soft delete) - junction records are truly removed
 *
 * Composition order (innermost to outermost):
 * customHandler → withValidation → withErrorLogging
 *
 * CRITICAL FIX (2024-01): Custom methods are now defined INSIDE the wrapper chain,
 * not outside. This ensures withErrorLogging catches and reports all errors properly.
 * Previously, service calls bypassed error logging causing silent failures.
 *
 * Note: No withLifecycleCallbacks needed - junction table uses hard delete.
 *
 * Engineering Constitution: Service layer for composite key orchestration
 */

import type {
  DataProvider,
  GetOneParams,
  UpdateParams,
  DeleteParams,
  CreateParams,
  GetListParams,
  GetManyParams,
  GetManyReferenceParams,
  UpdateManyParams,
  DeleteManyParams,
  RaRecord,
} from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import { assertExtendedDataProvider } from "../typeGuards";
import {
  ProductDistributorsService,
  parseCompositeId,
  createCompositeId,
  type ProductDistributor,
  type ProductDistributorUpdateInput,
} from "../../../services/productDistributors.service";
import {
  updateProductDistributorSchema,
  createProductDistributorSchema,
} from "../../../validation/productDistributors";

/**
 * Create a fully composed DataProvider for product_distributors
 *
 * Intercepts CRUD methods to handle composite primary key:
 * - getOne: Parse composite ID, delegate to service
 * - update: Parse composite ID, delegate to service
 * - delete: Parse composite ID, delegate to service (HARD DELETE)
 * - create: Extract product_id + distributor_id from data, delegate to service
 * - getList: Add composite IDs to returned records
 *
 * CRITICAL: Custom logic is defined INSIDE the wrapper chain so that:
 * - withErrorLogging catches and logs ALL errors (including from service calls)
 * - withValidation validates data at API boundary
 *
 * @param baseProvider - The raw Supabase DataProvider (must be ExtendedDataProvider)
 * @returns Composed DataProvider with composite key handling
 */
export function createProductDistributorsHandler(baseProvider: DataProvider): DataProvider {
  /**
   * Custom product_distributors handler with composite key logic
   *
   * This handler is defined FIRST, then wrapped with the standard wrapper chain.
   * This ensures all custom logic is INSIDE the "safety bubble" of withErrorLogging.
   */
  const extendedProvider = assertExtendedDataProvider(baseProvider);
  const service = new ProductDistributorsService(extendedProvider);

  const customHandler: DataProvider = {
    getList: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: GetListParams
    ) => {
      if (resource !== "product_distributors") {
        return baseProvider.getList<RecordType>(resource, params);
      }

      const result = await baseProvider.getList<ProductDistributor>(resource, params);

      const dataWithIds = result.data.map((record) => ({
        ...record,
        id: createCompositeId(record.product_id, record.distributor_id),
      }));

      // ProductDistributor satisfies RaRecord (has id field)
      // Type assertion is safe: dataWithIds elements extend RaRecord
      return {
        data: dataWithIds,
        total: result.total,
        pageInfo: result.pageInfo,
      } as { data: RecordType[]; total?: number; pageInfo?: { hasNextPage?: boolean; hasPreviousPage?: boolean } };
    },

    /**
     * Get a single product_distributor by composite ID
     *
     * Parses "product_id-distributor_id" format and delegates to service.
     */
    getOne: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: GetOneParams
    ) => {
      if (resource !== "product_distributors") {
        return baseProvider.getOne<RecordType>(resource, params);
      }

      const { product_id, distributor_id } = parseCompositeId(String(params.id));
      const data = await service.getOne(product_id, distributor_id);

      // ProductDistributor satisfies RaRecord (has id field)
      return { data } as { data: RecordType };
    },

    getMany: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: GetManyParams<RecordType>
    ) => {
      if (resource !== "product_distributors") {
        return baseProvider.getMany<RecordType>(resource, params);
      }

      const { ids } = params;

      // Parse composite IDs and fetch each record via service
      const results = await Promise.all(
        ids.map(async (id) => {
          const { product_id, distributor_id } = parseCompositeId(String(id));
          return service.getOne(product_id, distributor_id);
        })
      );

      // Re-attach composite IDs
      const dataWithIds = results.map((record) => ({
        ...record,
        id: createCompositeId(record.product_id, record.distributor_id),
      }));

      // ProductDistributor satisfies RaRecord (has id field)
      return { data: dataWithIds } as { data: RecordType[] };
    },

    getManyReference: <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: GetManyReferenceParams
    ) => baseProvider.getManyReference<RecordType>(resource, params),

    /**
     * Create a product_distributor
     *
     * Extracts product_id and distributor_id from data and delegates to service.
     */
    create: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: CreateParams<RecordType>
    ) => {
      if (resource !== "product_distributors") {
        return baseProvider.create<RecordType>(resource, params);
      }

      const validatedData = createProductDistributorSchema.passthrough().parse(params.data);

      const productId = validatedData.product_id;
      const distributorId = validatedData.distributor_id;

      const createData: Partial<ProductDistributorUpdateInput> = {};
      if (validatedData.vendor_item_number !== undefined) {
        createData.vendor_item_number = validatedData.vendor_item_number;
      }
      if (validatedData.status !== undefined) {
        createData.status = validatedData.status;
      }
      if (validatedData.valid_from !== undefined) {
        createData.valid_from = validatedData.valid_from instanceof Date
          ? validatedData.valid_from.toISOString()
          : String(validatedData.valid_from);
      }
      if (validatedData.valid_to !== undefined) {
        createData.valid_to = validatedData.valid_to instanceof Date
          ? validatedData.valid_to.toISOString()
          : validatedData.valid_to === null
            ? null
            : String(validatedData.valid_to);
      }

      const createdData = await service.create(productId, distributorId, createData);

      // ProductDistributor satisfies RaRecord (has id field)
      return { data: createdData } as { data: RecordType };
    },

    /**
     * Update a product_distributor by composite ID
     *
     * Parses composite ID and delegates to service.
     */
    update: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: UpdateParams<RecordType>
    ) => {
      if (resource !== "product_distributors") {
        return baseProvider.update<RecordType>(resource, params);
      }

      const { product_id, distributor_id } = parseCompositeId(String(params.id));

      const validatedData = updateProductDistributorSchema.passthrough().parse(params.data);

      const updateData: ProductDistributorUpdateInput = {};
      if (validatedData.vendor_item_number !== undefined) {
        updateData.vendor_item_number = validatedData.vendor_item_number;
      }
      if (validatedData.status !== undefined) {
        updateData.status = validatedData.status;
      }
      if (validatedData.valid_from !== undefined) {
        updateData.valid_from = validatedData.valid_from instanceof Date
          ? validatedData.valid_from.toISOString()
          : String(validatedData.valid_from);
      }
      if (validatedData.valid_to !== undefined) {
        updateData.valid_to = validatedData.valid_to instanceof Date
          ? validatedData.valid_to.toISOString()
          : validatedData.valid_to === null
            ? null
            : String(validatedData.valid_to);
      }

      const updatedData = await service.update(product_id, distributor_id, updateData);

      // ProductDistributor satisfies RaRecord (has id field)
      return { data: updatedData } as { data: RecordType };
    },

    updateMany: <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: UpdateManyParams<RecordType>
    ) => baseProvider.updateMany<RecordType>(resource, params),

    /**
     * Delete a product_distributor by composite ID (HARD DELETE)
     *
     * Parses composite ID and delegates to service.
     * Note: This is a hard delete, not soft delete.
     */
    delete: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: DeleteParams<RecordType>
    ) => {
      if (resource !== "product_distributors") {
        return baseProvider.delete<RecordType>(resource, params);
      }

      const { product_id, distributor_id } = parseCompositeId(String(params.id));
      await service.delete(product_id, distributor_id);

      const deletedData = params.previousData ?? {
        id: params.id,
        product_id,
        distributor_id,
      };

      // deletedData satisfies RaRecord (has id field)
      return { data: deletedData } as { data: RecordType };
    },

    deleteMany: <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: DeleteManyParams<RecordType>
    ) => baseProvider.deleteMany<RecordType>(resource, params),
  };

  /**
   * Wrap the custom handler with the standard wrapper chain
   *
   * Order (innermost to outermost):
   * 1. customHandler - Our product_distributors-specific logic
   * 2. withValidation - Zod schema validation at API boundary
   * 3. withErrorLogging - Structured error logging (catches ALL errors)
   *
   * No withLifecycleCallbacks needed - junction table uses hard delete.
   *
   * This ensures ALL custom logic is protected by error logging.
   */
  return withErrorLogging(withValidation(customHandler));
}
