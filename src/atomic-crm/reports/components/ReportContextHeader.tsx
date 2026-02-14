/**
 * ReportContextHeader -- Inline filter bar for the Overview report tab.
 *
 * Replaces the sidebar filter with a compact horizontal header that shows
 * Date Range + Sales Rep selects, applied filter chips, and a Clear All button.
 *
 * CRITICAL (Gap #2): Uses `useStore` directly, NOT `useReportFilterState`.
 * Per PATTERNS.md:720 — only tab content owns URL-seeding; shared components
 * use `useStore` to avoid double-seeding side effects.
 *
 * CRITICAL (Gap #3): Renders ONLY when activeTab === "overview".
 * Non-overview tabs keep their own AppliedFiltersBar inside tab content.
 */
import { useCallback, useMemo } from "react";
import { useStore, useGetList } from "ra-core";
import { Calendar, User, RotateCcw } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminButton } from "@/components/admin/AdminButton";
import { FilterChip } from "./FilterChip";
import { LOOKUP_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";
import { DATE_PRESETS } from "@/atomic-crm/reports/constants";
import type { OverviewFilterState } from "@/atomic-crm/reports/hooks";
import { OVERVIEW_DEFAULTS } from "@/atomic-crm/reports/hooks";
import type { Sale } from "@/atomic-crm/reports/types";

interface ReportContextHeaderProps {
  activeTab: string;
}

export function ReportContextHeader({ activeTab }: ReportContextHeaderProps) {
  // Only render for the Overview tab (Gap #3)
  if (activeTab !== "overview") return null;

  return <OverviewContextHeaderInner />;
}

/**
 * Inner component — isolated so hooks only run when Overview is active.
 * This avoids running useStore/useGetList when another tab is selected.
 */
function OverviewContextHeaderInner() {
  // Gap #2: Direct store access — no URL-seeding side effect
  const [state, setState] = useStore<OverviewFilterState>("reports.overview", OVERVIEW_DEFAULTS);

  const update = useCallback(
    (partial: Partial<OverviewFilterState>) => {
      setState({ ...state, ...partial });
    },
    [state, setState]
  );

  const handleReset = useCallback(() => {
    setState(OVERVIEW_DEFAULTS);
  }, [setState]);

  // Fetch sales reps for the dropdown
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

  // Determine active filters for chips
  const hasDateActive = state.datePreset !== OVERVIEW_DEFAULTS.datePreset;
  const hasSalesRepActive = state.salesRepId !== null;
  const hasActiveFilters = hasDateActive || hasSalesRepActive;

  // Find the label for the currently selected date preset
  const datePresetLabel = useMemo(
    () => DATE_PRESETS.find((p) => p.value === state.datePreset)?.label ?? state.datePreset,
    [state.datePreset]
  );

  // Find the name of the selected sales rep
  const salesRepName = useMemo(() => {
    if (!state.salesRepId) return null;
    const rep = salesRepOptions.find((r) => r.id === state.salesRepId);
    return rep?.name ?? `Rep ${state.salesRepId}`;
  }, [state.salesRepId, salesRepOptions]);

  return (
    <div
      className="flex flex-wrap items-center gap-compact"
      role="toolbar"
      aria-label="Overview filters"
    >
      {/* Date Range Select */}
      <div className="flex items-center gap-1.5">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
        <Select value={state.datePreset} onValueChange={(v) => update({ datePreset: v })}>
          <SelectTrigger className="h-11 w-[160px]" aria-label="Date Range">
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
      </div>

      {/* Sales Rep Select */}
      <div className="flex items-center gap-1.5">
        <User className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
        <Select
          value={state.salesRepId?.toString() ?? "all"}
          onValueChange={(v) => update({ salesRepId: v === "all" ? null : Number(v) })}
        >
          <SelectTrigger className="h-11 w-[180px]" aria-label="Sales Rep">
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
      </div>

      {/* Divider + Applied Filter Chips */}
      {hasActiveFilters && (
        <>
          <div className="h-6 w-px bg-border mx-1 shrink-0" role="separator" />

          <div
            role="list"
            className="flex flex-wrap items-center gap-compact"
            aria-label="Applied filters"
          >
            {hasDateActive && (
              <FilterChip
                label="Date Range"
                value={datePresetLabel}
                onRemove={() => update({ datePreset: OVERVIEW_DEFAULTS.datePreset })}
              />
            )}
            {hasSalesRepActive && salesRepName && (
              <FilterChip
                label="Sales Rep"
                value={salesRepName}
                onRemove={() => update({ salesRepId: null })}
              />
            )}
          </div>

          <AdminButton
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-11 shrink-0"
            aria-label="Clear all filters"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Clear all
          </AdminButton>
        </>
      )}
    </div>
  );
}
