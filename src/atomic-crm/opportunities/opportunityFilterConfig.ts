/**
 * Opportunity Filter Configuration
 *
 * Defines how opportunity filters are displayed in the FilterChipBar.
 * Imports from existing constants to prevent label drift.
 *
 * @module opportunities/opportunityFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";
// Import from existing constants - note camelCase exports
import { stageChoices, priorityChoices } from "./constants";

/**
 * Filter configuration for Opportunities list
 *
 * Matches filters available in OpportunityListFilter.tsx:
 * - stage: Pipeline stage (multiselect)
 * - principal_organization_id: Principal reference
 * - customer_organization_id: Customer reference
 * - campaign: Campaign name
 * - opportunity_owner_id: Owner reference
 * - priority: Priority level
 * - estimated_close_date_*: Close date range
 * - next_action_date_*: Action date range
 * - updated_at_gte: Recent wins filter
 *
 * ⚠️ NOTE: Opportunities use UNDERSCORE format (_gte/_lte) for date filters,
 * unlike Activities/Tasks which use @gte/@lte
 */
export const OPPORTUNITY_FILTER_CONFIG = validateFilterConfig([
  {
    key: "stage",
    label: "Stage",
    type: "multiselect",
    choices: [...stageChoices],
  },
  {
    key: "principal_organization_id",
    label: "Principal",
    type: "reference",
    reference: "organizations",
  },
  {
    key: "customer_organization_id",
    label: "Customer",
    type: "reference",
    reference: "organizations",
  },
  {
    key: "campaign",
    label: "Campaign",
    type: "select",
    // Choices loaded dynamically in OpportunityListFilter
  },
  {
    key: "opportunity_owner_id",
    label: "Owner",
    type: "reference",
    reference: "sales",
  },
  {
    key: "account_manager_id",
    label: "Secondary Manager",
    type: "reference",
    reference: "sales",
  },
  {
    key: "priority",
    label: "Priority",
    type: "multiselect",
    choices: [...priorityChoices],
  },
  // Date ranges use underscore format for opportunities
  {
    key: "estimated_close_date_gte",
    label: "Close after",
    type: "date-range",
    removalGroup: "estimated_close_date_range",
  },
  {
    key: "estimated_close_date_lte",
    label: "Close before",
    type: "date-range",
    removalGroup: "estimated_close_date_range",
  },
  {
    key: "next_action_date_gte",
    label: "Action after",
    type: "date-range",
    removalGroup: "next_action_date_range",
  },
  {
    key: "next_action_date_lte",
    label: "Action before",
    type: "date-range",
    removalGroup: "next_action_date_range",
  },
  // "Recent Wins" preset filter
  {
    key: "updated_at_gte",
    label: "Updated after",
    type: "date-range",
  },
  // Tags filter (used by WorkflowManagementSection)
  // NOTE: Opportunity tags are stored as text[] (tag names), NOT IDs.
  // Use multiselect with no choices - values are already display-ready.
  {
    key: "tags",
    label: "Tags",
    type: "multiselect",
    // No choices needed - tag values ARE the display names
  },
  // Stage exclusion filter (used by KPISummaryRow for "Open Opportunities")
  {
    key: "stage@not_in",
    label: "Excluding stages",
    type: "multiselect",
    choices: [...stageChoices],
  },
  // Stale deals filter (used by KPISummaryRow)
  {
    key: "stale",
    label: "Status",
    type: "boolean",
    formatLabel: (value: unknown) => (value === true ? "Stale deals" : "Active deals"),
  },
]);
