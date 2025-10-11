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
 * @returns Array of React Admin filter input components
 *
 * @example
 * ```tsx
 * const filters = useOpportunityFilters();
 * <List filters={filters}>...</List>
 * ```
 */
export const useOpportunityFilters = () => {
  return [
    <SearchInput source="q" alwaysOn />,
    <ReferenceInput source="customer_organization_id" reference="organizations">
      <AutocompleteArrayInput label={false} placeholder="Customer Organization" />
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
  ];
};
