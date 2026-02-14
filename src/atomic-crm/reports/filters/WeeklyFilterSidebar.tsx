/**
 * WeeklyFilterSidebar -- Filter panel for the Weekly Activity report tab.
 *
 * Sections:
 *  - Date Range (Two date inputs for start/end)
 *
 * State is stored via useStore<WeeklyFilterState>("reports.weekly").
 */
import { useCallback } from "react";
import { useStore } from "ra-core";
import { Calendar } from "lucide-react";

import { FilterCategory } from "@/atomic-crm/filters/FilterCategory";
import type { WeeklyFilterState } from "@/atomic-crm/reports/hooks";

const WEEKLY_DEFAULTS: WeeklyFilterState = { start: "", end: "" };

export function WeeklyFilterSidebar() {
  const [state, setState] = useStore<WeeklyFilterState>("reports.weekly", WEEKLY_DEFAULTS);

  const update = useCallback(
    (partial: Partial<WeeklyFilterState>) => {
      setState({ ...state, ...partial });
    },
    [state, setState]
  );

  const hasDateActive = state.start !== "" || state.end !== "";

  return (
    <div className="flex flex-col gap-1">
      <FilterCategory
        icon={<Calendar className="h-4 w-4" />}
        label="Date Range"
        defaultExpanded
        hasActiveFilters={hasDateActive}
      >
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-muted-foreground" htmlFor="weekly-start-date">
            Start
          </label>
          <input
            id="weekly-start-date"
            type="date"
            value={state.start}
            onChange={(e) => update({ start: e.target.value })}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            aria-label="Start date"
          />
          <label className="text-xs text-muted-foreground" htmlFor="weekly-end-date">
            End
          </label>
          <input
            id="weekly-end-date"
            type="date"
            value={state.end}
            onChange={(e) => update({ end: e.target.value })}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            aria-label="End date"
          />
        </div>
      </FilterCategory>
    </div>
  );
}

/**
 * Returns true when any Weekly filter differs from defaults.
 */
export function useWeeklyHasActiveFilters(): boolean {
  const [state] = useStore<WeeklyFilterState>("reports.weekly", WEEKLY_DEFAULTS);

  return state.start !== "" || state.end !== "";
}
