/**
 * Organization Filter Configuration
 *
 * Defines how organization filters are displayed in the FilterChipBar.
 * Imports from existing constants to prevent label drift.
 *
 * @module organizations/organizationFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES, US_STATES } from "./constants";

/**
 * Filter configuration for Organizations list
 *
 * Matches filters available in OrganizationListFilter.tsx and OrganizationDatagridHeader.tsx:
 * - organization_type: Organization classification (customer, prospect, etc.)
 * - priority: A-D priority scale
 * - state: US state code (IN, OH, etc.) - uses 2-letter codes, NOT full names
 * - segment_id: Playbook category reference
 * - sales_id: Owner/sales rep reference
 */
export const ORGANIZATION_FILTER_CONFIG = validateFilterConfig([
  {
    key: "id",
    label: "Starred",
    type: "multiselect",
    // Custom label for chip display - shows "Starred" instead of individual IDs
    formatLabel: () => "Starred items only",
  },
  {
    key: "organization_type",
    label: "Type",
    type: "multiselect",
    choices: [...ORGANIZATION_TYPE_CHOICES], // Spread to convert readonly to mutable
  },
  {
    key: "priority",
    label: "Priority",
    type: "multiselect",
    choices: [...PRIORITY_CHOICES],
  },
  {
    key: "state",
    label: "State",
    type: "multiselect",
    choices: [...US_STATES],
  },
  {
    key: "segment_id",
    label: "Playbook",
    type: "reference",
    reference: "segments",
  },
  {
    key: "sales_id",
    label: "Owner",
    type: "reference",
    reference: "sales",
  },
  // Hierarchy filters (sidebar toggles)
  {
    key: "child_branch_count@gt",
    label: "Has branches",
    type: "toggle",
    formatLabel: () => "Has branches",
  },
  {
    key: "parent_organization_id@not.is",
    label: "Has parent",
    type: "toggle",
    formatLabel: () => "Has parent",
  },
  {
    key: "parent_organization_id@is",
    label: "Root orgs",
    type: "toggle",
    formatLabel: () => "Root orgs (no parent)",
  },
  // Context chip filter (from inline hierarchy chips)
  {
    key: "parent_organization_id",
    label: "Parent org",
    type: "reference",
    reference: "organizations",
  },
]);
