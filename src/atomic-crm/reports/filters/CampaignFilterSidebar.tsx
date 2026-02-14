/**
 * CampaignFilterSidebar -- Filter panel for the Campaign Activity report tab.
 *
 * Sections:
 *  - Campaign        (Select from campaign options via useCampaignFilterOptions)
 *  - Date Range      (Select from CAMPAIGN_DATE_PRESETS; custom shows date inputs)
 *  - Sales Rep       (Select from salesRepOptions)
 *  - Activity Types  (Checkboxes with counts, Select All / Deselect All)
 *  - Options         (Switch for "Show Stale Leads")
 *
 * State is stored via useStore<CampaignFilterState>("reports.campaign").
 */
import { useCallback, useEffect, useRef } from "react";
import { useStore } from "ra-core";
import { Activity, Calendar, Settings, Target, User } from "lucide-react";

import { FilterCategory } from "@/atomic-crm/filters/FilterCategory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CAMPAIGN_DATE_PRESETS } from "@/atomic-crm/reports/constants";
import { INTERACTION_TYPE_OPTIONS } from "@/atomic-crm/validation/activities";
import { useCampaignFilterOptions } from "@/atomic-crm/reports/CampaignActivity/useCampaignFilterOptions";
import type { CampaignFilterState } from "@/atomic-crm/reports/hooks";
import { CAMPAIGN_DEFAULTS } from "@/atomic-crm/reports/hooks";

const ALL_ACTIVITY_TYPE_VALUES = INTERACTION_TYPE_OPTIONS.map((o) => o.value);

export function CampaignFilterSidebar() {
  const [state, setState] = useStore<CampaignFilterState>("reports.campaign", CAMPAIGN_DEFAULTS);

  const update = useCallback(
    (partial: Partial<CampaignFilterState>) => {
      setState({ ...state, ...partial });
    },
    [state, setState]
  );

  // Fetch campaign metadata (options, sales reps, type counts)
  const { campaignOptions, salesRepOptions, activityTypeCounts, isLoading } =
    useCampaignFilterOptions(state.selectedCampaign);

  // Auto-select first campaign when options load and none is selected
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (
      !autoSelectedRef.current &&
      !isLoading &&
      campaignOptions.length > 0 &&
      state.selectedCampaign === ""
    ) {
      autoSelectedRef.current = true;
      setState({ ...state, selectedCampaign: campaignOptions[0].name });
    }
  }, [isLoading, campaignOptions, state, setState]);

  // Activity type checkbox handlers
  const toggleActivityType = useCallback(
    (typeValue: string, checked: boolean) => {
      const current = state.selectedActivityTypes;
      const next = checked ? [...current, typeValue] : current.filter((t) => t !== typeValue);
      update({ selectedActivityTypes: next });
    },
    [state.selectedActivityTypes, update]
  );

  const selectAllTypes = useCallback(() => {
    update({ selectedActivityTypes: [...ALL_ACTIVITY_TYPE_VALUES] });
  }, [update]);

  const deselectAllTypes = useCallback(() => {
    update({ selectedActivityTypes: [] });
  }, [update]);

  const allSelected = state.selectedActivityTypes.length === ALL_ACTIVITY_TYPE_VALUES.length;

  // Active-filter indicators
  const hasCampaignActive = state.selectedCampaign !== CAMPAIGN_DEFAULTS.selectedCampaign;
  const hasDateActive = state.datePreset !== CAMPAIGN_DEFAULTS.datePreset;
  const hasSalesRepActive = state.selectedSalesRep !== null;
  const hasActivityTypesActive =
    state.selectedActivityTypes.length !== ALL_ACTIVITY_TYPE_VALUES.length;
  const hasOptionsActive = state.showStaleLeads !== CAMPAIGN_DEFAULTS.showStaleLeads;

  return (
    <div className="flex flex-col gap-1">
      {/* Campaign */}
      <FilterCategory
        icon={<Target className="h-4 w-4" />}
        label="Campaign"
        defaultExpanded
        hasActiveFilters={hasCampaignActive}
      >
        <Select
          value={state.selectedCampaign || "__none__"}
          onValueChange={(v) => update({ selectedCampaign: v === "__none__" ? "" : v })}
        >
          <SelectTrigger className="h-11 w-full" aria-label="Campaign">
            <SelectValue placeholder={isLoading ? "Loading..." : "Select campaign"} />
          </SelectTrigger>
          <SelectContent>
            {campaignOptions.length === 0 && (
              <SelectItem value="__none__" disabled>
                No campaigns found
              </SelectItem>
            )}
            {campaignOptions.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.name} ({c.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterCategory>

      {/* Date Range */}
      <FilterCategory
        icon={<Calendar className="h-4 w-4" />}
        label="Date Range"
        hasActiveFilters={hasDateActive}
      >
        <div className="flex flex-col gap-2 w-full">
          <Select
            value={state.datePreset}
            onValueChange={(v) =>
              update({
                datePreset: v,
                // Clear custom dates when switching away from custom
                ...(v !== "custom" ? { startDate: null, endDate: null } : {}),
              })
            }
          >
            <SelectTrigger className="h-11 w-full" aria-label="Date Range Preset">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAMPAIGN_DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom date inputs (shown only when preset is "custom") */}
          {state.datePreset === "custom" && (
            <>
              <label className="text-xs text-muted-foreground" htmlFor="campaign-start-date">
                Start
              </label>
              <input
                id="campaign-start-date"
                type="date"
                value={state.startDate ?? ""}
                onChange={(e) => update({ startDate: e.target.value || null })}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                aria-label="Custom start date"
              />
              <label className="text-xs text-muted-foreground" htmlFor="campaign-end-date">
                End
              </label>
              <input
                id="campaign-end-date"
                type="date"
                value={state.endDate ?? ""}
                onChange={(e) => update({ endDate: e.target.value || null })}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                aria-label="Custom end date"
              />
            </>
          )}
        </div>
      </FilterCategory>

      {/* Sales Rep */}
      <FilterCategory
        icon={<User className="h-4 w-4" />}
        label="Sales Rep"
        hasActiveFilters={hasSalesRepActive}
      >
        <Select
          value={state.selectedSalesRep?.toString() ?? "all"}
          onValueChange={(v) => update({ selectedSalesRep: v === "all" ? null : Number(v) })}
        >
          <SelectTrigger className="h-11 w-full" aria-label="Sales Rep">
            <SelectValue placeholder="All Sales Reps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sales Reps</SelectItem>
            {salesRepOptions.map((rep) => (
              <SelectItem key={rep.id} value={String(rep.id)}>
                {rep.name} ({rep.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterCategory>

      {/* Activity Types */}
      <FilterCategory
        icon={<Activity className="h-4 w-4" />}
        label="Activity Types"
        hasActiveFilters={hasActivityTypesActive}
      >
        <div className="flex flex-col gap-2 w-full">
          {/* Select All / Deselect All */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={allSelected ? deselectAllTypes : selectAllTypes}
              className="text-primary underline-offset-2 hover:underline h-11 flex items-center"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          {INTERACTION_TYPE_OPTIONS.map((opt) => {
            const checkboxId = `activity-type-${opt.value}`;
            const isChecked = state.selectedActivityTypes.includes(opt.value);
            const count = activityTypeCounts.get(opt.value) ?? 0;
            return (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={checkboxId}
                  checked={isChecked}
                  onCheckedChange={(checked) => toggleActivityType(opt.value, checked === true)}
                />
                <Label htmlFor={checkboxId} className="cursor-pointer flex-1">
                  {opt.label}
                </Label>
                <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
      </FilterCategory>

      {/* Options */}
      <FilterCategory
        icon={<Settings className="h-4 w-4" />}
        label="Options"
        hasActiveFilters={hasOptionsActive}
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <Label htmlFor="stale-leads-switch" className="cursor-pointer">
            Show Stale Leads
          </Label>
          <Switch
            id="stale-leads-switch"
            checked={state.showStaleLeads}
            onCheckedChange={(checked) => update({ showStaleLeads: checked })}
          />
        </div>
      </FilterCategory>
    </div>
  );
}

/**
 * Returns true when any Campaign filter differs from defaults.
 *
 * Note: selectedCampaign is excluded from the check because it is
 * auto-selected on first load; changing it is normal navigation, not
 * an "active filter" the user would want to reset.
 */
export function useCampaignHasActiveFilters(): boolean {
  const [state] = useStore<CampaignFilterState>("reports.campaign", CAMPAIGN_DEFAULTS);

  return (
    state.datePreset !== CAMPAIGN_DEFAULTS.datePreset ||
    state.startDate !== null ||
    state.endDate !== null ||
    state.selectedSalesRep !== null ||
    state.selectedActivityTypes.length !== ALL_ACTIVITY_TYPE_VALUES.length ||
    state.showStaleLeads !== CAMPAIGN_DEFAULTS.showStaleLeads
  );
}
