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
 * baseProvider → withValidation → withErrorLogging → method interceptions
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
  RaRecord,
} from "react-admin";
import { withErrorLogging, withValidation } from "../wrappers";
import type { ExtendedDataProvider } from "../extensions/types";
import {
  ProductDistributorsService,
  parseCompositeId,
  createCompositeId,
  type ProductDistributor,
  type ProductDistributorUpdateInput,
} from "../../../services/productDistributors.service";

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
 * @param baseProvider - The raw Supabase DataProvider (must be ExtendedDataProvider)
 * @returns Composed DataProvider with composite key handling
 */
export function createProductDistributorsHandler(baseProvider: DataProvider): DataProvider {
  // Create the standard composed handler with validation and error logging
  const composedHandler = withErrorLogging(withValidation(baseProvider));

  // Create service instance for composite key operations
  const service = new ProductDistributorsService(baseProvider as ExtendedDataProvider);

  // Return handler with method interceptions for composite key handling
  return {
    ...composedHandler,

    /**
     * Get a single product_distributor by composite ID
     *
     * Parses "product_id-distributor_id" format and delegates to service.
     */
    getOne: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: GetOneParams
    ) => {
      // Only intercept product_distributors resource
      if (resource !== "product_distributors") {
        return composedHandler.getOne<RecordType>(resource, params);
      }

      const { product_id, distributor_id } = parseCompositeId(String(params.id));
      const data = await service.getOne(product_id, distributor_id);

      return { data: data as unknown as RecordType };
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
      // Only intercept product_distributors resource
      if (resource !== "product_distributors") {
        return composedHandler.update<RecordType>(resource, params);
      }

      const { product_id, distributor_id } = parseCompositeId(String(params.id));

      // Extract update fields from params.data
      const updateData: ProductDistributorUpdateInput = {};
      const data = params.data as Record<string, unknown>;

      if ("vendor_item_number" in data) {
        updateData.vendor_item_number = data.vendor_item_number as string | null;
      }
      if ("status" in data) {
        updateData.status = data.status as string;
      }
      if ("valid_from" in data) {
        updateData.valid_from = data.valid_from as string;
      }
      if ("valid_to" in data) {
        updateData.valid_to = data.valid_to as string | null;
      }

      const updatedData = await service.update(product_id, distributor_id, updateData);

      return { data: updatedData as unknown as RecordType };
    },

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
      // Only intercept product_distributors resource
      if (resource !== "product_distributors") {
        return composedHandler.delete<RecordType>(resource, params);
      }

      const { product_id, distributor_id } = parseCompositeId(String(params.id));
      await service.delete(product_id, distributor_id);

      // Return the deleted record data (or previousData if available)
      const deletedData = params.previousData || {
        id: params.id,
        product_id,
        distributor_id,
      };

      return { data: deletedData as RecordType };
    },

    /**
     * Create a product_distributor
     *
     * Extracts product_id and distributor_id from data and delegates to service.
     */
    create: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: CreateParams<RecordType>
    ) => {
      // Only intercept product_distributors resource
      if (resource !== "product_distributors") {
        return composedHandler.create<RecordType>(resource, params);
      }

      const data = params.data as Record<string, unknown>;
      const productId = data.product_id as number;
      const distributorId = data.distributor_id as number;

      if (!productId || !distributorId) {
        throw new Error(
          "Create product_distributor requires both product_id and distributor_id"
        );
      }

      // Extract optional fields for create
      const createData: Partial<ProductDistributorUpdateInput> = {};

      if ("vendor_item_number" in data) {
        createData.vendor_item_number = data.vendor_item_number as string | null;
      }
      if ("status" in data) {
        createData.status = data.status as string;
      }
      if ("valid_from" in data) {
        createData.valid_from = data.valid_from as string;
      }
      if ("valid_to" in data) {
        createData.valid_to = data.valid_to as string | null;
      }

      const createdData = await service.create(productId, distributorId, createData);

      return { data: createdData as unknown as RecordType };
    },

    /**
     * Get list of product_distributors with composite IDs
     *
     * Delegates to base provider and adds composite IDs to each record.
     */
    getList: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: GetListParams
    ) => {
      // Only intercept product_distributors resource
      if (resource !== "product_distributors") {
        return composedHandler.getList<RecordType>(resource, params);
      }

      // Use composed handler for the actual query
      const result = await composedHandler.getList<ProductDistributor>(resource, params);

      // Add composite IDs to each record
      const dataWithIds = result.data.map((record) => ({
        ...record,
        id: createCompositeId(record.product_id, record.distributor_id),
      }));

      return {
        data: dataWithIds as unknown as RecordType[],
        total: result.total,
        pageInfo: result.pageInfo,
      };
    },
  };
}
