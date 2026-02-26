/**
 * Product Distributor Filter Configuration
 *
 * Defines how product distributor filters are displayed in the FilterChipBar.
 *
 * @module productDistributors/productDistributorFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";
import { PRODUCT_DISTRIBUTOR_STATUS_CHOICES } from "./constants";

/**
 * Status choices mapped to ChipFilterConfig format.
 * PRODUCT_DISTRIBUTOR_STATUS_CHOICES uses `as const`, so we map to mutable objects.
 */
const PD_STATUS_CHOICES = PRODUCT_DISTRIBUTOR_STATUS_CHOICES.map((c) => ({
  id: c.id,
  name: c.name,
}));

/**
 * Filter configuration for Product Distributors list
 *
 * Matches filters available in ProductDistributorListFilter.tsx:
 * - status: Authorization status (pending, active, inactive)
 * - product_id: Product reference
 * - distributor_id: Distributor organization reference
 */
export const PRODUCT_DISTRIBUTOR_FILTER_CONFIG = validateFilterConfig([
  {
    key: "status",
    label: "Status",
    type: "select",
    choices: PD_STATUS_CHOICES,
  },
  {
    key: "product_id",
    label: "Product",
    type: "reference",
    reference: "products",
  },
  {
    key: "distributor_id",
    label: "Distributor",
    type: "reference",
    reference: "organizations",
  },
]);
