/**
 * ReportFilterSidebar -- Sidebar content for the unified report filter panel.
 *
 * Renders inside AdaptiveFilterContainer. Shows:
 * - Global filters (always visible): Period, Principal, Product, Owner
 * - Tab-local filters based on activeTab prop
 *
 * Uses useStore directly (NOT useReportFilterState) to avoid URL-seeding
 * side effects. Only tab content owns URL seeding.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore, useGetList } from "ra-core";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  GLOBAL_DEFAULTS,
  CAMPAIGN_DEFAULTS,
  OPPORTUNITIES_DEFAULTS,
  type GlobalReportFilterState,
  type CampaignFilterState,
  type OpportunitiesFilterState,
} from "../hooks/useReportFilterState";
import { applyGlobalFilterCascades } from "../hooks/useReportFilterResets";
import { REPORT_DATE_PRESETS } from "../constants";
import { OPPORTUNITY_STAGE_CHOICES } from "@/atomic-crm/opportunities/constants";
import { INTERACTION_TYPE_OPTIONS } from "@/atomic-crm/validation/activities";
import { LOOKUP_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";
import { useCampaignFilterOptions } from "@/atomic-crm/reports/CampaignActivity/useCampaignFilterOptions";
import type { Sale } from "@/atomic-crm/reports/types";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface PrincipalRecord {
  id: number;
  name: string;
}

interface ProductRecord {
  id: number;
  name: string;
  principal_id?: number | null;
}

interface ReportFilterSidebarProps {
  activeTab: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ReportFilterSidebar({ activeTab }: ReportFilterSidebarProps) {
  return (
    <div className="flex flex-col gap-6">
      <GlobalFilterSection />
      {activeTab === "opportunities" && <OpportunitiesFilterSection />}
      {activeTab === "campaign" && <CampaignFilterSection />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Global Filters (always visible)
// ---------------------------------------------------------------------------

function GlobalFilterSection() {
  const [global, setGlobal] = useStore<GlobalReportFilterState>("reports.global", GLOBAL_DEFAULTS);

  const updateGlobal = useCallback(
    (
      field: keyof GlobalReportFilterState,
      value: GlobalReportFilterState[keyof GlobalReportFilterState]
    ) => {
      const cascades = applyGlobalFilterCascades(field, value, global);
      setGlobal({ ...global, [field]: value, ...cascades });
    },
    [global, setGlobal]
  );

  // Fetch principals
  const { data: principals = [] } = useGetList<PrincipalRecord>("organizations_summary", {
    pagination: { page: 1, perPage: LOOKUP_PAGE_SIZE },
    sort: { field: "name", order: "ASC" },
    filter: { type: "principal", "deleted_at@is": null },
  });

  // Fetch products, scoped to principal when selected
  const productFilter = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (global.principalId != null) {
      f.principal_id = global.principalId;
    }
    return f;
  }, [global.principalId]);

  const { data: products = [] } = useGetList<ProductRecord>("products", {
    pagination: { page: 1, perPage: LOOKUP_PAGE_SIZE },
    sort: { field: "name", order: "ASC" },
    filter: productFilter,
  });

  // Fetch sales reps (owners)
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
    <>
      {/* Period */}
      <FilterGroup label="Period">
        <Select value={global.periodPreset} onValueChange={(v) => updateGlobal("periodPreset", v)}>
          <SelectTrigger className="h-11 w-full" aria-label="Period">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_DATE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {global.periodPreset === "custom" && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="sidebar-custom-start" className="text-xs text-muted-foreground">
                Start
              </Label>
              <Input
                id="sidebar-custom-start"
                type="date"
                value={global.customStart ?? ""}
                onChange={(e) => updateGlobal("customStart", e.target.value || null)}
                aria-label="Custom start date"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="sidebar-custom-end" className="text-xs text-muted-foreground">
                End
              </Label>
              <Input
                id="sidebar-custom-end"
                type="date"
                value={global.customEnd ?? ""}
                onChange={(e) => updateGlobal("customEnd", e.target.value || null)}
                aria-label="Custom end date"
              />
            </div>
          </div>
        )}
      </FilterGroup>

      {/* Principal */}
      <FilterGroup label="Principal">
        <Select
          value={global.principalId?.toString() ?? "all"}
          onValueChange={(v) => updateGlobal("principalId", v === "all" ? null : Number(v))}
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
      </FilterGroup>

      {/* Product */}
      <FilterGroup label="Product">
        <Select
          value={global.productId?.toString() ?? "all"}
          onValueChange={(v) => updateGlobal("productId", v === "all" ? null : Number(v))}
          disabled={global.principalId == null}
        >
          <SelectTrigger className="h-11 w-full" aria-label="Product">
            <SelectValue
              placeholder={global.principalId == null ? "Select a principal first" : "All Products"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      {/* Owner */}
      <FilterGroup label="Owner">
        <Select
          value={global.ownerId?.toString() ?? "all"}
          onValueChange={(v) => updateGlobal("ownerId", v === "all" ? null : Number(v))}
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
      </FilterGroup>
    </>
  );
}

// ---------------------------------------------------------------------------
// Opportunities tab filters
// ---------------------------------------------------------------------------

/** Map OPPORTUNITY_STAGE_CHOICES to checkbox options */
const stageCheckboxOptions = OPPORTUNITY_STAGE_CHOICES.map((s) => ({
  value: s.id,
  label: s.name,
}));

function OpportunitiesFilterSection() {
  const [local, setLocal] = useStore<OpportunitiesFilterState>(
    "reports.opportunities",
    OPPORTUNITIES_DEFAULTS
  );

  const toggleStage = useCallback(
    (value: string, checked: boolean) => {
      const next = checked ? [...local.stage, value] : local.stage.filter((v) => v !== value);
      setLocal({ ...local, stage: next });
    },
    [local, setLocal]
  );

  return (
    <FilterGroup label="Stage">
      <div className="flex flex-col gap-2">
        {stageCheckboxOptions.map((opt) => {
          const checkboxId = `sidebar-stage-${opt.value}`;
          const isChecked = local.stage.includes(opt.value);
          return (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={checkboxId}
                checked={isChecked}
                onCheckedChange={(checked) => toggleStage(opt.value, checked === true)}
              />
              <Label htmlFor={checkboxId} className="cursor-pointer text-sm">
                {opt.label}
              </Label>
            </div>
          );
        })}
      </div>
    </FilterGroup>
  );
}

// ---------------------------------------------------------------------------
// Campaign tab filters
// ---------------------------------------------------------------------------

function CampaignFilterSection() {
  const [local, setLocal] = useStore<CampaignFilterState>("reports.campaign", CAMPAIGN_DEFAULTS);

  const updateLocal = useCallback(
    (partial: Partial<CampaignFilterState>) => {
      setLocal({ ...local, ...partial });
    },
    [local, setLocal]
  );

  // Fetch campaign metadata
  const { campaignOptions, isLoading } = useCampaignFilterOptions(local.selectedCampaign ?? "");

  // Auto-select first campaign on load when none is selected
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (
      !autoSelectedRef.current &&
      !isLoading &&
      campaignOptions.length > 0 &&
      local.selectedCampaign == null
    ) {
      autoSelectedRef.current = true;
      setLocal({ ...local, selectedCampaign: campaignOptions[0].name });
    }
  }, [isLoading, campaignOptions, local, setLocal]);

  const toggleActivityType = useCallback(
    (value: string, checked: boolean) => {
      const next = checked
        ? [...local.selectedActivityTypes, value]
        : local.selectedActivityTypes.filter((v) => v !== value);
      updateLocal({ selectedActivityTypes: next });
    },
    [local.selectedActivityTypes, updateLocal]
  );

  return (
    <>
      {/* Campaign */}
      <FilterGroup label="Campaign">
        <Select
          value={local.selectedCampaign ?? "__none__"}
          onValueChange={(v) => updateLocal({ selectedCampaign: v === "__none__" ? null : v })}
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
      </FilterGroup>

      {/* Activity Types */}
      <FilterGroup label="Activity Types">
        <div className="flex flex-col gap-2">
          {INTERACTION_TYPE_OPTIONS.map((opt) => {
            const checkboxId = `sidebar-activity-${opt.value}`;
            const isChecked = local.selectedActivityTypes.includes(opt.value);
            return (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={checkboxId}
                  checked={isChecked}
                  onCheckedChange={(checked) => toggleActivityType(opt.value, checked === true)}
                />
                <Label htmlFor={checkboxId} className="cursor-pointer text-sm">
                  {opt.label}
                </Label>
              </div>
            );
          })}
        </div>
      </FilterGroup>

      {/* Stale Leads */}
      <FilterGroup label="Stale Leads">
        <div className="flex items-center gap-3">
          <Switch
            id="sidebar-stale-leads"
            checked={local.showStaleLeads}
            onCheckedChange={(checked) => updateLocal({ showStaleLeads: checked })}
            aria-label="Show stale leads"
          />
          <Label htmlFor="sidebar-stale-leads" className="cursor-pointer text-sm">
            Show stale leads
          </Label>
        </div>
      </FilterGroup>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared layout helper
// ---------------------------------------------------------------------------

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      {children}
    </div>
  );
}
