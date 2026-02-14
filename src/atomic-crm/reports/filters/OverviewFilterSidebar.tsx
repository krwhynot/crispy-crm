/**
 * OverviewFilterSidebar -- Filter panel for the Overview report tab.
 *
 * Sections:
 *  - Date Range (Select from DATE_PRESETS)
 *  - Sales Rep  (Select from useGetList("sales"))
 *
 * State is stored via useStore<OverviewFilterState>("reports.overview").
 */
import { useCallback, useMemo } from "react";
import { useStore, useGetList } from "ra-core";
import { Calendar, User } from "lucide-react";

import { FilterCategory } from "@/atomic-crm/filters/FilterCategory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOOKUP_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";
import { DATE_PRESETS } from "@/atomic-crm/reports/constants";
import type { OverviewFilterState } from "@/atomic-crm/reports/hooks";
import { OVERVIEW_DEFAULTS } from "@/atomic-crm/reports/hooks";
import type { Sale } from "@/atomic-crm/reports/types";

export function OverviewFilterSidebar() {
  const [state, setState] = useStore<OverviewFilterState>("reports.overview", OVERVIEW_DEFAULTS);

  const update = useCallback(
    (partial: Partial<OverviewFilterState>) => {
      setState({ ...state, ...partial });
    },
    [state, setState]
  );

  // Fetch sales reps for the filter dropdown
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

  const hasDateActive = state.datePreset !== OVERVIEW_DEFAULTS.datePreset;
  const hasSalesRepActive = state.salesRepId !== null;

  return (
    <div className="flex flex-col gap-1">
      {/* Date Range */}
      <FilterCategory
        icon={<Calendar className="h-4 w-4" />}
        label="Date Range"
        defaultExpanded
        hasActiveFilters={hasDateActive}
      >
        <Select value={state.datePreset} onValueChange={(v) => update({ datePreset: v })}>
          <SelectTrigger className="h-11 w-full" aria-label="Date Range">
            <SelectValue placeholder="Last 30 Days" />
          </SelectTrigger>
          <SelectContent>
            {DATE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterCategory>

      {/* Sales Rep */}
      <FilterCategory
        icon={<User className="h-4 w-4" />}
        label="Sales Rep"
        hasActiveFilters={hasSalesRepActive}
      >
        <Select
          value={state.salesRepId?.toString() ?? "all"}
          onValueChange={(v) => update({ salesRepId: v === "all" ? null : Number(v) })}
        >
          <SelectTrigger className="h-11 w-full" aria-label="Sales Rep">
            <SelectValue placeholder="All Sales Reps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sales Reps</SelectItem>
            {salesRepOptions.map((rep) => (
              <SelectItem key={rep.id} value={String(rep.id)}>
                {rep.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterCategory>
    </div>
  );
}

/**
 * Returns true when any Overview filter differs from defaults.
 * Used by the parent ReportFilterSidebar to show the Reset button.
 */
export function useOverviewHasActiveFilters(): boolean {
  const [state] = useStore<OverviewFilterState>("reports.overview", OVERVIEW_DEFAULTS);

  return state.datePreset !== OVERVIEW_DEFAULTS.datePreset || state.salesRepId !== null;
}
