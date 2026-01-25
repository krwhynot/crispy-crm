/**
 * Products Domain - Filter Registry
 *
 * Filterable fields for products and product categories.
 */

import type { FilterRegistry } from "./types";

export const productsFilters = {
  // Products resource
  // Note: Many fields removed 2025-01-05 - these don't exist in the products table:
  // sku, distributor_id, certifications, allergens, ingredients, marketing_description, minimum_order_quantity
  products: [
    "id",
    "principal_id",
    "name",
    "description",
    "category",
    "status",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "deleted_at", // Soft delete timestamp
    "manufacturer_part_number",
    "q", // Special: full-text search parameter
  ],

  // Distinct Product Categories view (for filter dropdowns)
  distinct_product_categories: ["id", "name"],
} as const satisfies Partial<FilterRegistry>;
