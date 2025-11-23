import { useMemo } from "react";
import { SearchInput } from "@/components/admin/search-input";
import { MultiSelectInput } from "@/components/admin/multi-select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { OPPORTUNITY_STAGE_CHOICES } from "../opportunities/stageConstants";
import { OnlyMineInput } from "../opportunities/OnlyMineInput";
import { getInitialStageFilter } from "./opportunityStagePreferences";

/**
 * Centralized filter configuration for opportunities resource
 * Shared between List and future Kanban views for consistent filter state
 *
 * @returns Memoized array of React Admin filter input components
 *
 * @example
 * ```tsx
 * const filters = useOpportunityFilters();
 * <List filters={filters}>...</List>
 * ```
 */
export const useOpportunityFilters = () => {
  // Memoize the filter array to prevent unnecessary re-renders
  // Note: getInitialStageFilter() reads from localStorage and should be stable
  return useMemo(() => [
    <SearchInput source="q" alwaysOn />,
    // ⭐ Principal filter at TOP position (most important filter per PRD)
    <ReferenceInput source="principal_organization_id" reference="organizations">
      <AutocompleteArrayInput label={false} placeholder="Principal (Brand/Manufacturer)" />
    </ReferenceInput>,
    <ReferenceInput source="customer_organization_id" reference="organizations">
      <AutocompleteArrayInput label={false} placeholder="Customer Organization" />
    </ReferenceInput>,
    <ReferenceInput source="campaign" reference="campaign_choices">
      <AutocompleteArrayInput label={false} placeholder="Campaign" />
    </ReferenceInput>,
    <MultiSelectInput
      source="priority"
      emptyText="Priority"
      choices={[
        { id: "low", name: "Low" },
        { id: "medium", name: "Medium" },
        { id: "high", name: "High" },
        { id: "critical", name: "Critical" },
      ]}
    />,
    <MultiSelectInput
      source="stage"
      emptyText="Stage"
      choices={OPPORTUNITY_STAGE_CHOICES}
      defaultValue={getInitialStageFilter()}
    />,
    <OnlyMineInput source="opportunity_owner_id" alwaysOn />,
  ], []); // Empty dependency array - filters are static configuration
};
