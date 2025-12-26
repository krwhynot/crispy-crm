/**
 * Sales (Team Member) Filter Configuration
 *
 * Defines how team member filters are displayed in the FilterChipBar.
 * Following industry standard (Google Workspace, Salesforce): defaults to Active only.
 *
 * @module sales/salesFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";

/**
 * Role choices for the role filter
 */
const ROLE_CHOICES = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "rep", name: "Rep" },
];

/**
 * Status choices for the disabled filter
 * Note: disabled=false means Active, disabled=true means Disabled
 *
 * IMPORTANT: IDs must be strings per filterChoiceSchema.
 * The FilterChipBar displays these labels when the corresponding
 * boolean filter value is active. The mapping is:
 *   disabled: false → "active" → "Active"
 *   disabled: true  → "disabled" → "Disabled"
 */
const STATUS_CHOICES = [
  { id: "active", name: "Active" },
  { id: "disabled", name: "Disabled" },
];

/**
 * Filter configuration for Sales (Team Member) list
 *
 * Matches filters available in SalesListFilter.tsx:
 * - role: User role (multiselect: admin, manager, rep)
 * - disabled: Account status (toggle: active/disabled)
 * - q: Full-text search on name/email
 */
export const SALES_FILTER_CONFIG = validateFilterConfig([
  {
    key: "q",
    label: "Search",
    type: "search",
  },
  {
    key: "role",
    label: "Role",
    type: "multiselect",
    choices: ROLE_CHOICES,
  },
  {
    key: "disabled",
    label: "Status",
    type: "boolean",
    choices: STATUS_CHOICES,
  },
]);
