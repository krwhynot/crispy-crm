/**
 * Organization Filter Configuration
 *
 * Defines how organization filters are displayed in the FilterChipBar.
 * Imports from existing constants to prevent label drift.
 *
 * @module organizations/organizationFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES } from "./constants";

/**
 * Filter configuration for Organizations list
 *
 * Matches filters available in OrganizationListFilter.tsx:
 * - organization_type: Organization classification (customer, prospect, etc.)
 * - priority: A-D priority scale
 * - segment_id: Playbook category reference
 * - sales_id: Owner/sales rep reference
 */
export const ORGANIZATION_FILTER_CONFIG = validateFilterConfig([
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
]);
