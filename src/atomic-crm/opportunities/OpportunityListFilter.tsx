import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Flag,
  Layers,
  Megaphone,
  Users,
  Zap,
  User,
  Calendar,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { FilterLiveForm, useGetIdentity, useGetList, useListContext } from "ra-core";
import { addDays } from "date-fns";

import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { FilterCategory } from "../filters/FilterCategory";
import { OPPORTUNITY_STAGES } from "./constants/stageConstants";
import { priorityChoices } from "./constants/priorityChoices";

export const OpportunityListFilter = () => {
  const { data: identity } = useGetIdentity();
  const { filterValues, setFilters } = useListContext();

  // Fetch principals (organizations with type principal)
  const { data: principalsData } = useGetList("organizations", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "name", order: "ASC" },
    filter: { organization_type: "principal", deleted_at: null },
  });

  // Fetch customers (organizations with type customer)
  const { data: customersData } = useGetList("organizations", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "name", order: "ASC" },
    filter: { organization_type: "customer", deleted_at: null },
  });

  // Handle principal filter change via Select dropdown
  const handlePrincipalChange = (value: string) => {
    if (value === "all") {
      const { principal_organization_id: _, ...rest } = filterValues || {};
      setFilters(rest);
    } else {
      setFilters({
        ...filterValues,
        principal_organization_id: Number(value),
      });
    }
  };

  // Handle customer filter change via Select dropdown
  const handleCustomerChange = (value: string) => {
    if (value === "all") {
      const { customer_organization_id: _, ...rest } = filterValues || {};
      setFilters(rest);
    } else {
      setFilters({
        ...filterValues,
        customer_organization_id: Number(value),
      });
    }
  };

  // Handle campaign filter change via Select dropdown
  const handleCampaignChange = (value: string) => {
    if (value === "all") {
      const { campaign: _, ...rest } = filterValues || {};
      setFilters(rest);
    } else {
      setFilters({
        ...filterValues,
        campaign: value,
      });
    }
  };

  // Get current filter values for controlled Selects
  const currentPrincipalFilter = filterValues?.principal_organization_id
    ? String(filterValues.principal_organization_id)
    : "all";

  const currentCustomerFilter = filterValues?.customer_organization_id
    ? String(filterValues.customer_organization_id)
    : "all";

  const currentCampaignFilter = filterValues?.campaign || "all";

  // Extract unique campaign values from opportunities
  const { data: opportunitiesData } = useGetList("opportunities", {
    pagination: { page: 1, perPage: 1000 },
  });

  const campaigns = React.useMemo(() => {
    if (!opportunitiesData) return [];
    const uniqueCampaigns = new Set<string>();
    opportunitiesData.forEach((opp) => {
      if (opp.campaign) {
        uniqueCampaigns.add(opp.campaign);
      }
    });
    return Array.from(uniqueCampaigns).sort();
  }, [opportunitiesData]);

  // Quick filter presets
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);

  const handlePresetClick = (filters: Record<string, any>) => {
    setFilters({ ...filterValues, ...filters });
  };

  const isPresetActive = (presetFilters: Record<string, any>): boolean => {
    return Object.entries(presetFilters).every(([key, value]) => {
      const currentValue = filterValues?.[key];
      if (Array.isArray(value) && Array.isArray(currentValue)) {
        return value.every((v) => currentValue.includes(v));
      }
      return currentValue === value;
    });
  };

  return (
    <div className="flex flex-col gap-4" data-tutorial="opp-filters">
      {/* Search - Always visible */}
      <FilterLiveForm>
        <SearchInput source="q" placeholder="Search opportunities..." />
      </FilterLiveForm>

      {/* Collapsible Filter Sections */}
      <div className="flex flex-col gap-2">
        <FilterCategory label="Quick Filters" icon={<Zap className="h-4 w-4" />} defaultExpanded data-tutorial="opp-quick-filters">
          <Button
            type="button"
            variant={
              isPresetActive({ opportunity_owner_id: identity?.id }) ? "default" : "outline"
            }
            size="sm"
            onClick={() => handlePresetClick({ opportunity_owner_id: identity?.id })}
            className="w-full justify-start"
            title="Opportunities I manage"
          >
            <User className="w-3.5 h-3.5 mr-2" />
            My Opportunities
          </Button>

          <Button
            type="button"
            variant={
              isPresetActive({
                estimated_close_date_gte: today.toISOString().split("T")[0],
                estimated_close_date_lte: thirtyDaysFromNow.toISOString().split("T")[0],
              })
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              handlePresetClick({
                estimated_close_date_gte: today.toISOString().split("T")[0],
                estimated_close_date_lte: thirtyDaysFromNow.toISOString().split("T")[0],
              })
            }
            className="w-full justify-start"
            title="Opportunities with expected close date within 30 days"
          >
            <Calendar className="w-3.5 h-3.5 mr-2" />
            Closing This Month
          </Button>

          <Button
            type="button"
            variant={isPresetActive({ priority: ["high", "critical"] }) ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick({ priority: ["high", "critical"] })}
            className="w-full justify-start"
            title="Critical and high priority opportunities"
          >
            <AlertCircle className="w-3.5 h-3.5 mr-2" />
            High Priority
          </Button>

          <Button
            type="button"
            variant={
              isPresetActive({ next_action_date_lte: today.toISOString().split("T")[0] })
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              handlePresetClick({ next_action_date_lte: today.toISOString().split("T")[0] })
            }
            className="w-full justify-start"
            title="Opportunities with overdue or upcoming actions"
          >
            <Flag className="w-3.5 h-3.5 mr-2" />
            Needs Action
          </Button>

          <Button
            type="button"
            variant={
              isPresetActive({
                stage: "closed_won",
                updated_at_gte: addDays(today, -30).toISOString().split("T")[0],
              })
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              handlePresetClick({
                stage: "closed_won",
                updated_at_gte: addDays(today, -30).toISOString().split("T")[0],
              })
            }
            className="w-full justify-start"
            title="Opportunities closed won in the last 30 days"
          >
            <Trophy className="w-3.5 h-3.5 mr-2" />
            Recent Wins
          </Button>
        </FilterCategory>

        <FilterCategory label="Stage" icon={<Layers className="h-4 w-4" />} data-tutorial="opp-stage-filters">
          {OPPORTUNITY_STAGES.map((stage) => (
            <ToggleFilterButton
              multiselect
              className="w-full justify-between"
              key={stage.value}
              label={stage.label}
              value={{ stage: stage.value }}
            />
          ))}
        </FilterCategory>

        <FilterCategory label="Priority" icon={<Flag className="h-4 w-4" />}>
          {priorityChoices.map((priority) => (
            <ToggleFilterButton
              multiselect
              className="w-full justify-between"
              key={priority.id}
              label={priority.name}
              value={{ priority: priority.id }}
            />
          ))}
        </FilterCategory>

        <FilterCategory label="Principal" icon={<Building2 className="h-4 w-4" />}>
          <Select value={currentPrincipalFilter} onValueChange={handlePrincipalChange}>
            <SelectTrigger
              className="w-full min-h-11 bg-background border-border text-foreground"
              aria-label="Filter by principal"
            >
              <SelectValue placeholder="All Principals" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all" className="min-h-11">
                <span className="text-muted-foreground">All Principals</span>
              </SelectItem>
              {principalsData?.map((org) => (
                <SelectItem key={org.id} value={String(org.id)} className="min-h-11">
                  <span className="truncate" title={org.name}>
                    {org.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterCategory>

        <FilterCategory label="Customer" icon={<Building2 className="h-4 w-4" />}>
          <Select value={currentCustomerFilter} onValueChange={handleCustomerChange}>
            <SelectTrigger
              className="w-full min-h-11 bg-background border-border text-foreground"
              aria-label="Filter by customer"
            >
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all" className="min-h-11">
                <span className="text-muted-foreground">All Customers</span>
              </SelectItem>
              {customersData?.map((org) => (
                <SelectItem key={org.id} value={String(org.id)} className="min-h-11">
                  <span className="truncate" title={org.name}>
                    {org.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterCategory>

        <FilterCategory label="Campaign" icon={<Megaphone className="h-4 w-4" />}>
          <Select value={currentCampaignFilter} onValueChange={handleCampaignChange}>
            <SelectTrigger
              className="w-full min-h-11 bg-background border-border text-foreground"
              aria-label="Filter by campaign"
            >
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all" className="min-h-11">
                <span className="text-muted-foreground">All Campaigns</span>
              </SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign} value={campaign} className="min-h-11">
                  <span className="truncate" title={campaign}>
                    {campaign}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterCategory>

        <FilterCategory icon={<Users className="h-4 w-4" />} label="Owner">
          <ToggleFilterButton
            className="w-full justify-between"
            label="Me"
            value={{ opportunity_owner_id: identity?.id }}
          />
        </FilterCategory>
      </div>
    </div>
  );
};
