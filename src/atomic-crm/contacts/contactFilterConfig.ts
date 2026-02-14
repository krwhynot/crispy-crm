/**
 * Contact Filter Configuration
 *
 * Defines how contact filters are displayed in the FilterChipBar.
 *
 * @module contacts/contactFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";

/**
 * Filter configuration for Contacts list
 *
 * Matches filters available in ContactListFilter.tsx:
 * - tags: Contact tags (multiselect reference)
 * - last_seen@gte/lte: Activity date range
 * - sales_id: Owner/sales rep reference
 */
export const CONTACT_FILTER_CONFIG = validateFilterConfig([
  {
    key: "id",
    label: "Starred",
    type: "multiselect",
    // Custom label for chip display - shows "Starred" instead of individual IDs
    formatLabel: () => "Starred items only",
  },
  {
    key: "first_name",
    label: "Name",
    type: "search",
  },
  {
    key: "status",
    label: "Status",
    type: "multiselect",
    choices: [
      { id: "cold", name: "Cold" },
      { id: "warm", name: "Warm" },
      { id: "hot", name: "Hot" },
      { id: "in-contract", name: "Contract" },
    ],
  },
  {
    key: "tags",
    label: "Tag",
    type: "multiselect",
    reference: "tags",
  },
  {
    key: "last_seen@gte",
    label: "Activity after",
    type: "date-range",
    // Group with @lte so removing either clears both
    removalGroup: "last_seen_range",
  },
  {
    key: "last_seen@lte",
    label: "Activity before",
    type: "date-range",
    removalGroup: "last_seen_range",
  },
  {
    key: "sales_id",
    label: "Owner",
    type: "reference",
    reference: "sales",
  },
  {
    key: "secondary_sales_id",
    label: "Secondary Manager",
    type: "reference",
    reference: "sales",
  },
]);
