import { useState, useEffect } from "react";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceInput } from "@/components/admin/reference-input";
import { FilterButton } from "@/components/admin/filter-form";
import { SearchInput } from "@/components/admin/search-input";
import { MultiSelectInput } from "@/components/admin/multi-select-input";
import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/admin/breadcrumb";

import {
  Translate,
  useGetIdentity,
  useListContext,
  useGetResourceLabel,
  useDataProvider,
} from "ra-core";
import { Link } from "react-router-dom";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { TopToolbar } from "../layout/TopToolbar";
import { OpportunityArchivedList } from "./OpportunityArchivedList";
import { OpportunityEmpty } from "./OpportunityEmpty";
import { OpportunityListContent } from "./OpportunityListContent";
import { OnlyMineInput } from "./OnlyMineInput";
import { OPPORTUNITY_STAGE_CHOICES } from "./stageConstants";
import { FilterChipsPanel } from "../filters/FilterChipsPanel";

// Helper functions for default stage management
const getInitialStageFilter = (): string[] | undefined => {
  // 1. Check URL parameters (highest priority)
  const urlParams = new URLSearchParams(window.location.search);
  const urlFilter = urlParams.get('filter');
  if (urlFilter) {
    try {
      const parsed = JSON.parse(urlFilter);
      if (parsed.stage) {
        // Handle both array and single value for backward compatibility
        return Array.isArray(parsed.stage) ? parsed.stage : [parsed.stage];
      }
    } catch {
      // Invalid JSON in URL, continue to next fallback
    }
  }

  // 2. Check localStorage preferences
  const hiddenStages = JSON.parse(
    localStorage.getItem('opportunity_hidden_stages') ||
    '["closed_won", "closed_lost"]'
  );

  // 3. Return visible stages (all except hidden) - hardcoded defaults
  return OPPORTUNITY_STAGE_CHOICES
    .map(choice => choice.id)
    .filter(stage => !hiddenStages.includes(stage));
};

const updateStagePreferences = (selectedStages: string[]): void => {
  const allStages = OPPORTUNITY_STAGE_CHOICES.map(choice => choice.id);
  const hiddenStages = allStages.filter(stage => !selectedStages.includes(stage));

  // Only update localStorage if the hidden stages include closed stages
  // This prevents overwriting user preferences when they temporarily select all stages
  if (hiddenStages.length > 0) {
    localStorage.setItem('opportunity_hidden_stages', JSON.stringify(hiddenStages));
  }
};

const OpportunityList = () => {
  const { identity } = useGetIdentity();
  const getResourceLabel = useGetResourceLabel();
  const resourceLabel = getResourceLabel("opportunities", 2);
  const { opportunityCategories } = useConfigurationContext();
  const dataProvider = useDataProvider();
  const [categoryChoices, setCategoryChoices] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch distinct categories from opportunities table
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Calculate date 6 months ago for performance optimization
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const sixMonthsAgoISO = sixMonthsAgo.toISOString();

        // Fetch recent opportunities to get current categories (performance optimization)
        const { data } = await dataProvider.getList('opportunities', {
          pagination: { page: 1, perPage: 1000 },
          filter: {
            "deleted_at@is": null, // Only include non-deleted opportunities
            "created_at@gte": sixMonthsAgoISO // Only opportunities from last 6 months
          },
          sort: { field: 'category', order: 'ASC' }
        });

        // Extract unique, non-null categories
        const uniqueCategories = [...new Set(
          data
            .map(opportunity => opportunity.category)
            .filter(category => category && category.trim() !== '') // Filter out null, undefined, and empty strings
        )];

        // Format as React Admin choice array
        const choices = uniqueCategories.map(category => ({
          id: category,
          name: category
        }));

        setCategoryChoices(choices);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to configuration categories if fetch fails
        setCategoryChoices(opportunityCategories.map(type => ({ id: type, name: type })));
      }
    };

    if (identity) {
      fetchCategories();
    }
  }, [dataProvider, identity, opportunityCategories]);

  if (!identity) return null;

  const opportunityFilters = [
    <SearchInput source="q" alwaysOn />,
    <ReferenceInput source="customer_organization_id" reference="organizations">
      <AutocompleteArrayInput label={false} placeholder="Customer Organization" />
    </ReferenceInput>,
    <MultiSelectInput
      source="category"
      emptyText="Category"
      choices={categoryChoices}
    />,
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
    <OnlyMineInput source="sales_id" alwaysOn />,
  ];

  return (
    <List
      perPage={100}
      filter={{
        "deleted_at@is": null,
      }}
      title={false}
      sort={{ field: "index", order: "DESC" }}
      filters={opportunityFilters}
      actions={<OpportunityActions />}
      pagination={null}
    >
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/">
            <Translate i18nKey="ra.page.dashboard">Home</Translate>
          </Link>
        </BreadcrumbItem>
        <BreadcrumbPage>{resourceLabel}</BreadcrumbPage>
      </Breadcrumb>
      <FilterChipsPanel className="mb-4" />
      <OpportunityLayout />
    </List>
  );
};

const OpportunityLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Monitor stage filter changes and update localStorage preferences
  useEffect(() => {
    if (filterValues?.stage && Array.isArray(filterValues.stage)) {
      updateStagePreferences(filterValues.stage);
    }
  }, [filterValues?.stage]);

  if (isPending) return null;
  if (!data?.length && !hasFilters)
    return (
      <>
        <OpportunityEmpty>
          <OpportunityArchivedList />
        </OpportunityEmpty>
      </>
    );

  return (
    <div className="w-full">
      <OpportunityListContent />
      <OpportunityArchivedList />
    </div>
  );
};

const OpportunityActions = () => {
  return (
    <TopToolbar>
      <FilterButton />
      <ExportButton />
      <CreateButton label="New Opportunity" />
    </TopToolbar>
  );
};

export default OpportunityList;
