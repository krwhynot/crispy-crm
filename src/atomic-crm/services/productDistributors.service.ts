import type { Identifier } from "ra-core";
import type { ExtendedDataProvider } from "../providers/supabase/extensions/types";
import { devLog, devError } from "@/lib/devLogger";

/**
 * Product distributor junction record
 */
export interface ProductDistributor {
  id: string; // Composite ID: `${product_id}-${distributor_id}`
  product_id: number;
  distributor_id: number;
  vendor_item_number?: string | null;
  status: string;
  valid_from: string;
  valid_to?: string | null;
  created_at: string;
  updated_at: string;
  product?: { id: number; name: string };
  distributor?: { id: number; name: string };
}

/**
 * Product distributor update data
 */
export interface ProductDistributorUpdateInput {
  vendor_item_number?: string | null;
  status?: string;
  valid_from?: string;
  valid_to?: string | null;
}

/**
 * Parse a composite ID into product_id and distributor_id
 * Format: `${product_id}-${distributor_id}`
 */
export function parseCompositeId(compositeId: string): {
  product_id: number;
  distributor_id: number;
} {
  const parts = String(compositeId).split("-");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid composite ID format: ${compositeId}. Expected format: product_id-distributor_id`
    );
  }

  const product_id = parseInt(parts[0], 10);
  const distributor_id = parseInt(parts[1], 10);

  if (isNaN(product_id) || isNaN(distributor_id)) {
    throw new Error(`Invalid composite ID: ${compositeId}. Both parts must be valid numbers.`);
  }

  return { product_id, distributor_id };
}

/**
 * Create a composite ID from product_id and distributor_id
 */
export function createCompositeId(product_id: number, distributor_id: number): string {
  return `${product_id}-${distributor_id}`;
}

/**
 * Product Distributors service handles the composite key junction table
 *
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 *
 * This service encapsulates:
 * - Composite key parsing and creation
 * - CRUD operations using (product_id, distributor_id) instead of single ID
 * - Proper JOIN fetching with related product and distributor data
 */
export class ProductDistributorsService {
  constructor(private dataProvider: ExtendedDataProvider) {}

  /**
   * Get a product distributor by composite key
   *
   * @param productId Product ID
   * @param distributorId Distributor ID
   * @returns Product distributor with related product and distributor data
   */
  async getOne(productId: Identifier, distributorId: Identifier): Promise<ProductDistributor> {
    try {
      devLog("ProductDistributorsService", "getOne", { productId, distributorId });

      // Use composite ID for data provider
      const compositeId = createCompositeId(Number(productId), Number(distributorId));
      const { data } = await this.dataProvider.getOne<ProductDistributor>("product_distributors", {
        id: compositeId,
      });

      return {
        ...data,
        id: compositeId,
      };
    } catch (error: unknown) {
      devError("ProductDistributorsService", "Failed to get product distributor", {
        productId,
        distributorId,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Get product distributor failed: ${errorMessage}`);
    }
  }

  /**
   * Update a product distributor by composite key
   *
   * @param productId Product ID
   * @param distributorId Distributor ID
   * @param data Update data
   * @returns Updated product distributor
   */
  async update(
    productId: Identifier,
    distributorId: Identifier,
    data: ProductDistributorUpdateInput
  ): Promise<ProductDistributor> {
    try {
      devLog("ProductDistributorsService", "update", { productId, distributorId, data });

      const compositeId = createCompositeId(Number(productId), Number(distributorId));

      // Get previous data for the update
      const previousData = await this.getOne(productId, distributorId);

      const { data: updatedData } = await this.dataProvider.update<ProductDistributor>(
        "product_distributors",
        {
          id: compositeId,
          data: {
            ...data,
            updated_at: new Date().toISOString(),
          },
          previousData,
        }
      );

      return {
        ...updatedData,
        id: compositeId,
      };
    } catch (error: unknown) {
      devError("ProductDistributorsService", "Failed to update product distributor", {
        productId,
        distributorId,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Update product distributor failed: ${errorMessage}`);
    }
  }

  /**
   * Delete a product distributor by composite key (hard delete)
   *
   * Note: product_distributors uses hard delete, not soft delete
   *
   * @param productId Product ID
   * @param distributorId Distributor ID
   */
  async delete(productId: Identifier, distributorId: Identifier): Promise<void> {
    try {
      devLog("ProductDistributorsService", "delete", { productId, distributorId });

      const compositeId = createCompositeId(Number(productId), Number(distributorId));

      // Get previous data for the delete
      const previousData = await this.getOne(productId, distributorId);

      await this.dataProvider.delete("product_distributors", {
        id: compositeId,
        previousData,
      });

      devLog("ProductDistributorsService", "Product distributor deleted", {
        productId,
        distributorId,
      });
    } catch (error: unknown) {
      devError("ProductDistributorsService", "Failed to delete product distributor", {
        productId,
        distributorId,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Delete product distributor failed: ${errorMessage}`);
    }
  }

  /**
   * Create a product distributor relationship
   *
   * @param productId Product ID
   * @param distributorId Distributor ID
   * @param data Optional additional data
   * @returns Created product distributor
   */
  async create(
    productId: Identifier,
    distributorId: Identifier,
    data?: Partial<ProductDistributorUpdateInput>
  ): Promise<ProductDistributor> {
    try {
      devLog("ProductDistributorsService", "create", { productId, distributorId });

      const { data: createdData } = await this.dataProvider.create<ProductDistributor>(
        "product_distributors",
        {
          data: {
            product_id: Number(productId),
            distributor_id: Number(distributorId),
            vendor_item_number: data?.vendor_item_number || null,
            status: data?.status,
            valid_from: data?.valid_from || new Date().toISOString(),
            valid_to: data?.valid_to || null,
          },
        }
      );

      return {
        ...createdData,
        id: createCompositeId(Number(productId), Number(distributorId)),
      };
    } catch (error: unknown) {
      devError("ProductDistributorsService", "Failed to create product distributor", {
        productId,
        distributorId,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Create product distributor failed: ${errorMessage}`);
    }
  }

  /**
   * Get all distributors for a product
   *
   * @param productId Product ID
   * @returns Array of product distributors
   */
  async getDistributorsForProduct(productId: Identifier): Promise<ProductDistributor[]> {
    try {
      devLog("ProductDistributorsService", "getDistributorsForProduct", { productId });

      const { data } = await this.dataProvider.getList<ProductDistributor>("product_distributors", {
        filter: { product_id: productId },
        pagination: { page: 1, perPage: 100 },
        sort: { field: "created_at", order: "DESC" },
      });

      // Add composite IDs
      return data.map((record) => ({
        ...record,
        id: createCompositeId(record.product_id, record.distributor_id),
      }));
    } catch (error: unknown) {
      devError("ProductDistributorsService", "Failed to get distributors for product", {
        productId,
        error,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Get distributors for product failed: ${errorMessage}`);
    }
  }
}
