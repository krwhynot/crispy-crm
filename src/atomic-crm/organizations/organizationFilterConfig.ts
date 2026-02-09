/**
 * Organization Filter Configuration
 *
 * Defines how organization filters are displayed in the FilterChipBar.
 * Imports from existing constants to prevent label drift.
 *
 * @module organizations/organizationFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";
import {
  ORGANIZATION_TYPE_CHOICES,
  ORG_SCOPE_CHOICES,
  PRIORITY_CHOICES,
  US_STATES,
} from "./constants";

/**
 * Filter configuration for Organizations list
 *
 * Matches filters available in OrganizationListFilter.tsx and OrganizationDatagridHeader.tsx:
 * - organization_type: Organization classification (customer, prospect, etc.)
 * - priority: A-D priority scale
 * - state: US state code (IN, OH, etc.) - uses 2-letter codes, NOT full names
 * - segment_id: Segment reference (playbook + operator)
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
    label: "Category",
    type: "reference",
    reference: "segments",
  },
  {
    key: "sales_id",
    label: "Owner",
    type: "reference",
    reference: "sales",
  },
  // Created date filter (used by OrganizationSavedQueries "Recent Prospects" preset)
  {
    key: "created_at_gte",
    label: "Created after",
    type: "date-range",
    removalGroup: "created_at_range",
  },
  // Parent organization filter (used by OrganizationHierarchyChips)
  {
    key: "parent_organization_id",
    label: "Parent",
    type: "reference",
    reference: "organizations",
  },
]);
