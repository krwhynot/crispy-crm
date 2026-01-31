/**
 * Category validation schema
 *
 * Used for product categories from the distinct_product_categories database view.
 * This view provides deduplicated category names for filtering.
 *
 * @module validation/categories
 */

import { z } from "zod";

/**
 * Category schema for distinct_product_categories view
 *
 * The database view returns category as the id/name since categories
 * are stored as strings, not as a separate reference table.
 */
export const categorySchema = z.strictObject({
  id: z.string().max(255),
  name: z.string().max(255),
});

export type Category = z.infer<typeof categorySchema>;
