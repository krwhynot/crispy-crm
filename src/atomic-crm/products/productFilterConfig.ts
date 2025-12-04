/**
 * Product Filter Configuration
 *
 * Defines how product filters are displayed in the FilterChipBar.
 *
 * @module products/productFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";

/**
 * Product status choices
 * Matches ProductListFilter.tsx status options
 */
const PRODUCT_STATUS_CHOICES = [
  { id: "active", name: "Active" },
  { id: "discontinued", name: "Discontinued" },
  { id: "coming_soon", name: "Coming Soon" },
];

/**
 * Filter configuration for Products list
 *
 * Matches filters available in ProductListFilter.tsx:
 * - status: Product availability status
 * - category: Product category (from distinct_product_categories view)
 * - principal_id: Principal organization reference
 */
export const PRODUCT_FILTER_CONFIG = validateFilterConfig([
  {
    key: "status",
    label: "Status",
    type: "select",
    choices: PRODUCT_STATUS_CHOICES,
  },
  {
    key: "category",
    label: "Category",
    type: "select",
    // Uses useCategoryNames hook to resolve names from distinct_product_categories view
    reference: "categories",
  },
  {
    key: "principal_id",
    label: "Principal",
    type: "reference",
    reference: "organizations",
  },
]);
