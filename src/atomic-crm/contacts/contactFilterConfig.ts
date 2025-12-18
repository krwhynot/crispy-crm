/**
 * Contact Filter Configuration
 *
 * Defines how contact filters are displayed in the FilterChipBar.
 *
 * @module contacts/contactFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";

/**
 * Format date values for chip display
 * Shows human-readable labels for recent dates
 */
function formatDateLabel(value: unknown): string {
  if (!value || typeof value !== "string") return String(value);

  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);

  if (isToday(date)) return "Today";
  if (isThisWeek(date)) return "This week";
  if (isThisMonth(date)) return "This month";
  return format(date, "MMM d, yyyy");
}

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
    formatLabel: formatDateLabel,
    // Group with @lte so removing either clears both
    removalGroup: "last_seen_range",
  },
  {
    key: "last_seen@lte",
    label: "Activity before",
    type: "date-range",
    formatLabel: formatDateLabel,
    removalGroup: "last_seen_range",
  },
  {
    key: "sales_id",
    label: "Owner",
    type: "reference",
    reference: "sales",
  },
]);
