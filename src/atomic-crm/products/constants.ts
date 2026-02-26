/**
 * Product constants derived from validation schemas
 * Single source of truth: Zod enum → UI choices (DOM-006)
 */

import { PRODUCT_STATUSES } from "../validation/products";
import { formatFieldLabel } from "../utils/formatters";

export const PRODUCT_STATUS_CHOICES = PRODUCT_STATUSES.map((s) => ({
  id: s,
  name: formatFieldLabel(s),
}));
