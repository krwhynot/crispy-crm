/**
 * ReportParameterBar -- Unified horizontal parameter bar for ALL report tabs.
 *
 * Replaces sidebar filters with a compact horizontal toolbar. Switches
 * between inner components based on the active tab so that hooks only
 * run when their tab is visible.
 *
 * CRITICAL: Uses `useStore` directly, NOT `useReportFilterState`.
 * Per PATTERNS.md -- only tab content owns URL-seeding; shared
 * components use `useStore` to avoid double-seeding side effects.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore, useGetList } from "ra-core";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LOOKUP_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";
import { DATE_PRESETS, CAMPAIGN_DATE_PRESETS } from "@/atomic-crm/reports/constants";
import { OPPORTUNITY_STAGE_CHOICES } from "@/atomic-crm/opportunities/constants";
import { INTERACTION_TYPE_OPTIONS } from "@/atomic-crm/validation/activities";
import { useCampaignFilterOptions } from "@/atomic-crm/reports/CampaignActivity/useCampaignFilterOptions";
import type {
  OverviewFilterState,
  CampaignFilterState,
  WeeklyFilterState,
  OpportunitiesFilterState,
} from "@/atomic-crm/reports/hooks";
import {
  OVERVIEW_DEFAULTS,
  CAMPAIGN_DEFAULTS,
  OPPORTUNITIES_DEFAULTS,
} from "@/atomic-crm/reports/hooks";
import type { Sale } from "@/atomic-crm/reports/types";
import { CheckboxPopoverFilter } from "./CheckboxPopoverFilter";
import { DateRangePopoverFilter } from "./DateRangePopoverFilter";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface PrincipalRecord {
  id: number;
  name: string;
}

interface ReportParameterBarProps {
  activeTab: string;
}

// ---------------------------------------------------------------------------
// Outer guard component
// ---------------------------------------------------------------------------

export function ReportParameterBar({ activeTab }: ReportParameterBarProps) {
  switch (activeTab) {
    case "overview":
      return <OverviewParameterBar />;
    case "opportunities":
      return <OpportunitiesParameterBar />;
    case "weekly":
      return <WeeklyParameterBar />;
    case "campaign":
      return <CampaignParameterBar />;
    default:
      return null;
  }
}

// ===========================================================================
// OVERVIEW
// ===========================================================================

function OverviewParameterBar() {
  const [state, setState] = useStore<OverviewFilterState>("reports.overview", OVERVIEW_DEFAULTS);

  const update = useCallback(
    (partial: Partial<OverviewFilterState>) => {
      setState({ ...state, ...partial });
    },
    [state, setState]
  );

  // Fetch sales reps
  const { data: salesReps = [] } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: LOOKUP_PAGE_SIZE },
    sort: { field: "first_name", order: "ASC" },
  });

  const salesRepOptions = useMemo(
    () =>
      salesReps.map((rep) => ({
        id: rep.id,
        name: `${rep.first_name} ${rep.last_name}`,
      })),
    [salesReps]
  );

  return (
    <div
      className="flex flex-wrap items-end gap-6"
      role="toolbar"
      aria-label="Overview report parameters"
    >
      {/* Period */}
      <div className="flex flex-col gap-1">
        <span className="paper-micro-label">Period</span>
        <Select value={state.datePreset} onValueChange={(v) => update({ datePreset: v })}>
          <SelectTrigger className="report-filter-trigger h-11 w-[160px]" aria-label="Period">
            <SelectValue placeholder="Last 30 Days" />
          </SelectTrigger>
          <SelectContent className="report-filter-content">
            {DATE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Owner */}
      <div className="flex flex-col gap-1">
        <span className="paper-micro-label">Owner</span>
        <Select
          value={state.salesRepId?.toString() ?? "all"}
          onValueChange={(v) => update({ salesRepId: v === "all" ? null : Number(v) })}
        >
          <SelectTrigger className="report-filter-trigger h-11 w-[180px]" aria-label="Owner">
            <SelectValue placeholder="All Sales Reps" />
          </SelectTrigger>
          <SelectContent className="report-filter-content">
            <SelectItem value="all">All Sales Reps</SelectItem>
            {salesRepOptions.map((rep) => (
              <SelectItem key={rep.id} value={String(rep.id)}>
                {rep.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ===========================================================================
// OPPORTUNITIES
// ===========================================================================

/** Map OPPORTUNITY_STAGE_CHOICES to the shape CheckboxPopoverFilter expects. */
const stageCheckboxOptions = OPPORTUNITY_STAGE_CHOICES.map((s) => ({
  value: s.id,
  label: s.name,
}));

function OpportunitiesParameterBar() {
  const [state, setState] = useStore<OpportunitiesFilterState>(
    "reports.opportunities",
    OPPORTUNITIES_DEFAULTS
  );

  const update = useCallback(
    (partial: Partial<OpportunitiesFilterState>) => {
      setState({ ...state, ...partial });
    },
    [state, setState]
  );

  // Fetch principals
  const { data: principals = [] } = useGetList<PrincipalRecord>("organizations_summary", {
    pagination: { page: 1, perPage: LOOKUP_PAGE_SIZE },
    sort: { field: "name", order: "ASC" },
    filter: { type: "principal", "deleted_at@is": null },
  });

  // Fetch sales reps
  const { data: salesReps = [] } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: LOOKUP_PAGE_SIZE },
    sort: { field: "first_name", order: "ASC" },
  });

  const salesRepOptions = useMemo(
    () =>
      salesReps.map((rep) => ({
        id: rep.id,
        name: `${rep.first_name} ${rep.last_name}`,
      })),
    [salesReps]
  );

  return (
    <div
      className="flex flex-wrap items-end gap-6"
      role="toolbar"
      aria-label="Opportunities report parameters"
    >
      {/* Principal */}
      <div className="flex flex-col gap-1">
        <span className="paper-micro-label">Principal</span>
        <Select
          value={state.principal_organization_id?.toString() ?? "all"}
          onValueChange={(v) =>
            update({
              principal_organization_id: v === "all" ? null : Number(v),
            })
          }
        >
          <SelectTrigger className="report-filter-trigger h-11 w-[200px]" aria-label="Principal">
            <SelectValue placeholder="All Principals" />
          </SelectTrigger>
          <SelectContent className="report-filter-content">
            <SelectItem value="all">All Principals</SelectItem>
            {principals.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stage (checkbox popover) */}
      <CheckboxPopoverFilter
        label="Stage"
        options={stageCheckboxOptions}
        selected={state.stage}
        onChange={(selected) => update({ stage: selected })}
        triggerWidth="w-[180px]"
        ariaLabel="Stage"
      />

      {/* Owner */}
      <div className="flex flex-col gap-1">
        <span className="paper-micro-label">Owner</span>
        <Select
          value={state.opportunity_owner_id?.toString() ?? "all"}
          onValueChange={(v) =>
            update({
              opportunity_owner_id: v === "all" ? null : Number(v),
            })
          }
        >
          <SelectTrigger className="report-filter-trigger h-11 w-[180px]" aria-label="Owner">
            <SelectValue placeholder="All Owners" />
          </SelectTrigger>
          <SelectContent className="report-filter-content">
            <SelectItem value="all">All Owners</SelectItem>
            {salesRepOptions.map((rep) => (
              <SelectItem key={rep.id} value={String(rep.id)}>
                {rep.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range (popover) */}
      <DateRangePopoverFilter
        label="Date Range"
        startDate={state.startDate}
        endDate={state.endDate}
        onStartChange={(d) => update({ startDate: d })}
        onEndChange={(d) => update({ endDate: d })}
        triggerWidth="w-[200px]"
      />
    </div>
  );
}

// ===========================================================================
// WEEKLY
// ===========================================================================

const WEEKLY_DEFAULTS: WeeklyFilterState = { start: "", end: "" };

function WeeklyParameterBar() {
  const [state, setState] = useStore<WeeklyFilterState>("reports.weekly", WEEKLY_DEFAULTS);

  const update = useCallback(
    (partial: Partial<WeeklyFilterState>) => {
      setState({ ...state, ...partial });
    },
    [state, setState]
  );

  return (
    <div
      className="flex flex-wrap items-end gap-6"
      role="toolbar"
      aria-label="Weekly report parameters"
    >
      {/* Start date */}
      <div className="flex flex-col gap-1">
        <label className="paper-micro-label" htmlFor="weekly-start">
          Start
        </label>
        <input
          id="weekly-start"
          type="date"
          value={state.start}
          onChange={(e) => update({ start: e.target.value })}
          className="h-11 w-[160px] rounded-md border border-input bg-background px-3 text-sm text-foreground"
          aria-label="Start date"
        />
      </div>

      {/* End date */}
      <div className="flex flex-col gap-1">
        <label className="paper-micro-label" htmlFor="weekly-end">
          End
        </label>
        <input
          id="weekly-end"
          type="date"
          value={state.end}
          onChange={(e) => update({ end: e.target.value })}
          className="h-11 w-[160px] rounded-md border border-input bg-background px-3 text-sm text-foreground"
          aria-label="End date"
        />
      </div>
    </div>
  );
}

// ===========================================================================
// CAMPAIGN
// ===========================================================================

function CampaignParameterBar() {
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

  // Auto-select first campaign on load when none is selected
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

  // Build activity type options with counts for CheckboxPopoverFilter
  const activityTypeOptions = useMemo(
    () =>
      INTERACTION_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
        count: activityTypeCounts.get(opt.value) ?? 0,
      })),
    [activityTypeCounts]
  );

  return (
    <div
      className="flex flex-wrap items-end gap-6"
      role="toolbar"
      aria-label="Campaign report parameters"
    >
      {/* Campaign */}
      <div className="flex flex-col gap-1">
        <span className="paper-micro-label">Campaign</span>
        <Select
          value={state.selectedCampaign || "__none__"}
          onValueChange={(v) => update({ selectedCampaign: v === "__none__" ? "" : v })}
        >
          <SelectTrigger className="report-filter-trigger h-11 w-[200px]" aria-label="Campaign">
            <SelectValue placeholder={isLoading ? "Loading..." : "Select campaign"} />
          </SelectTrigger>
          <SelectContent className="report-filter-content">
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
      </div>

      {/* Date Range Preset */}
      <div className="flex flex-col gap-1">
        <span className="paper-micro-label">Date Range</span>
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
          <SelectTrigger className="report-filter-trigger h-11 w-[160px]" aria-label="Date Range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="report-filter-content">
            {CAMPAIGN_DATE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Range (conditionally shown when preset is "custom") */}
      {state.datePreset === "custom" && (
        <DateRangePopoverFilter
          label="Custom Range"
          startDate={state.startDate}
          endDate={state.endDate}
          onStartChange={(d) => update({ startDate: d })}
          onEndChange={(d) => update({ endDate: d })}
          triggerWidth="w-[200px]"
          startId="campaign-custom-start"
          endId="campaign-custom-end"
        />
      )}

      {/* Sales Rep */}
      <div className="flex flex-col gap-1">
        <span className="paper-micro-label">Sales Rep</span>
        <Select
          value={state.selectedSalesRep?.toString() ?? "all"}
          onValueChange={(v) => update({ selectedSalesRep: v === "all" ? null : Number(v) })}
        >
          <SelectTrigger className="report-filter-trigger h-11 w-[180px]" aria-label="Sales Rep">
            <SelectValue placeholder="All Sales Reps" />
          </SelectTrigger>
          <SelectContent className="report-filter-content">
            <SelectItem value="all">All Sales Reps</SelectItem>
            {salesRepOptions.map((rep) => (
              <SelectItem key={rep.id} value={String(rep.id)}>
                {rep.name} ({rep.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Types (checkbox popover) */}
      <CheckboxPopoverFilter
        label="Activity Types"
        options={activityTypeOptions}
        selected={state.selectedActivityTypes}
        onChange={(selected) => update({ selectedActivityTypes: selected })}
        showSelectAll
        triggerWidth="w-[180px]"
        ariaLabel="Activity Types"
      />

      {/* Stale Leads Switch */}
      <div className="flex flex-col gap-1">
        <span className="paper-micro-label">Stale Leads</span>
        <div className="flex h-11 items-center px-2">
          <Switch
            id="campaign-stale-leads"
            checked={state.showStaleLeads}
            onCheckedChange={(checked) => update({ showStaleLeads: checked })}
            aria-label="Show stale leads"
          />
        </div>
      </div>
    </div>
  );
}
