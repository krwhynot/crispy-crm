/**
 * OpportunitiesFilterSidebar -- Filter panel for the Opportunities report tab.
 *
 * Sections:
 *  - Principal  (Select from organizations_summary filtered to type=principal)
 *  - Stage      (Checkboxes from OPPORTUNITY_STAGE_CHOICES)
 *  - Owner      (Select from useGetList("sales"))
 *  - Date Range (Two date inputs for start/end)
 *
 * State is stored via useStore<OpportunitiesFilterState>("reports.opportunities").
 */
import { useCallback, useMemo } from "react";
import { useStore, useGetList } from "ra-core";
import { Building2, Calendar, Layers, User } from "lucide-react";

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
import { LOOKUP_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";
import { OPPORTUNITY_STAGE_CHOICES } from "@/atomic-crm/opportunities/constants";
import type { OpportunitiesFilterState } from "@/atomic-crm/reports/hooks";
import { OPPORTUNITIES_DEFAULTS } from "@/atomic-crm/reports/hooks";
import type { Sale } from "@/atomic-crm/reports/types";

interface PrincipalRecord {
  id: number;
  name: string;
}

export function OpportunitiesFilterSidebar() {
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

  // Fetch principals (organizations with type=principal)
  const { data: principals = [] } = useGetList<PrincipalRecord>("organizations_summary", {
    pagination: { page: 1, perPage: LOOKUP_PAGE_SIZE },
    sort: { field: "name", order: "ASC" },
    filter: { type: "principal", "deleted_at@is": null },
  });

  // Fetch sales reps for the owner dropdown
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

  // Stage checkbox toggle handler
  const toggleStage = useCallback(
    (stageId: string, checked: boolean) => {
      const current = state.stage;
      const next = checked ? [...current, stageId] : current.filter((s) => s !== stageId);
      update({ stage: next });
    },
    [state.stage, update]
  );

  const hasPrincipalActive = state.principal_organization_id !== null;
  const hasStageActive = state.stage.length > 0;
  const hasOwnerActive = state.opportunity_owner_id !== null;
  const hasDateActive = state.startDate !== null || state.endDate !== null;

  return (
    <div className="flex flex-col gap-1">
      {/* Principal */}
      <FilterCategory
        icon={<Building2 className="h-4 w-4" />}
        label="Principal"
        defaultExpanded
        hasActiveFilters={hasPrincipalActive}
      >
        <Select
          value={state.principal_organization_id?.toString() ?? "all"}
          onValueChange={(v) =>
            update({
              principal_organization_id: v === "all" ? null : Number(v),
            })
          }
        >
          <SelectTrigger className="h-11 w-full" aria-label="Principal">
            <SelectValue placeholder="All Principals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Principals</SelectItem>
            {principals.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterCategory>

      {/* Stage */}
      <FilterCategory
        icon={<Layers className="h-4 w-4" />}
        label="Stage"
        hasActiveFilters={hasStageActive}
      >
        <div className="flex flex-col gap-2 w-full">
          {OPPORTUNITY_STAGE_CHOICES.map((stage) => {
            const checkboxId = `stage-${stage.id}`;
            const isChecked = state.stage.includes(stage.id);
            return (
              <div key={stage.id} className="flex items-center gap-2">
                <Checkbox
                  id={checkboxId}
                  checked={isChecked}
                  onCheckedChange={(checked) => toggleStage(stage.id, checked === true)}
                />
                <Label htmlFor={checkboxId} className="cursor-pointer">
                  {stage.name}
                </Label>
              </div>
            );
          })}
        </div>
      </FilterCategory>

      {/* Owner */}
      <FilterCategory
        icon={<User className="h-4 w-4" />}
        label="Owner"
        hasActiveFilters={hasOwnerActive}
      >
        <Select
          value={state.opportunity_owner_id?.toString() ?? "all"}
          onValueChange={(v) =>
            update({
              opportunity_owner_id: v === "all" ? null : Number(v),
            })
          }
        >
          <SelectTrigger className="h-11 w-full" aria-label="Owner">
            <SelectValue placeholder="All Owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {salesRepOptions.map((rep) => (
              <SelectItem key={rep.id} value={String(rep.id)}>
                {rep.name}
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
          <label className="text-xs text-muted-foreground" htmlFor="opp-start-date">
            Start
          </label>
          <input
            id="opp-start-date"
            type="date"
            value={state.startDate ?? ""}
            onChange={(e) => update({ startDate: e.target.value || null })}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            aria-label="Start date"
          />
          <label className="text-xs text-muted-foreground" htmlFor="opp-end-date">
            End
          </label>
          <input
            id="opp-end-date"
            type="date"
            value={state.endDate ?? ""}
            onChange={(e) => update({ endDate: e.target.value || null })}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            aria-label="End date"
          />
        </div>
      </FilterCategory>
    </div>
  );
}

/**
 * Returns true when any Opportunities filter differs from defaults.
 */
export function useOpportunitiesHasActiveFilters(): boolean {
  const [state] = useStore<OpportunitiesFilterState>(
    "reports.opportunities",
    OPPORTUNITIES_DEFAULTS
  );

  return (
    state.principal_organization_id !== null ||
    state.stage.length > 0 ||
    state.opportunity_owner_id !== null ||
    state.startDate !== null ||
    state.endDate !== null
  );
}
