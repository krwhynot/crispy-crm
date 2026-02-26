/**
 * ReportsAppliedFiltersBar -- Chip row showing active (non-default) report filters.
 *
 * Sits between the tab list and tab content. Each chip is removable and
 * triggers the appropriate cascade reset via buildChipRemovalUpdate.
 *
 * Chip rules:
 * - Period: non-custom preset shows "Period: Last 30 Days", custom with BOTH
 *   dates shows "Period: Jan 1 - Dec 31", half-filled custom = no chip
 * - customStart/customEnd never get their own chips (part of period group)
 * - Renders nothing when no active filters
 */

import { useCallback, useMemo } from "react";
import { useStore, useGetOne } from "ra-core";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GLOBAL_DEFAULTS,
  CAMPAIGN_DEFAULTS,
  OPPORTUNITIES_DEFAULTS,
  type GlobalReportFilterState,
  type CampaignFilterState,
  type OpportunitiesFilterState,
} from "../hooks/useReportFilterState";
import { buildChipRemovalUpdate } from "../hooks/useReportFilterResets";
import { REPORT_DATE_PRESETS } from "../constants";
import { OPPORTUNITY_STAGE_CHOICES } from "@/atomic-crm/opportunities/constants";
import { INTERACTION_TYPE_OPTIONS } from "@/atomic-crm/validation/activities";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportsAppliedFiltersBarProps {
  activeTab: string;
}

interface ChipDef {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

// ---------------------------------------------------------------------------
// Display name lookups (lazy/cached via useGetOne)
// ---------------------------------------------------------------------------

function useLookupName(resource: string, id: number | null): string | null {
  const { data } = useGetOne(resource, { id: id ?? 0 }, { enabled: id != null });

  if (id == null || !data) return null;

  // Handle different name shapes
  if ("name" in data && typeof data.name === "string") return data.name;
  if ("first_name" in data && "last_name" in data) {
    return `${data.first_name} ${data.last_name}`;
  }
  return String(id);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ReportsAppliedFiltersBar({ activeTab }: ReportsAppliedFiltersBarProps) {
  const [global, setGlobal] = useStore<GlobalReportFilterState>("reports.global", GLOBAL_DEFAULTS);
  const [opps, setOpps] = useStore<OpportunitiesFilterState>(
    "reports.opportunities",
    OPPORTUNITIES_DEFAULTS
  );
  const [campaign, setCampaign] = useStore<CampaignFilterState>(
    "reports.campaign",
    CAMPAIGN_DEFAULTS
  );

  // Display name lookups
  const principalName = useLookupName("organizations_summary", global.principalId);
  const productName = useLookupName("products", global.productId);
  const ownerName = useLookupName("sales", global.ownerId);

  // Helper: remove a global field with cascade
  const removeGlobal = useCallback(
    (field: keyof GlobalReportFilterState) => {
      const update = buildChipRemovalUpdate(field, global);
      setGlobal({ ...global, [field]: GLOBAL_DEFAULTS[field], ...update });
    },
    [global, setGlobal]
  );

  // Build chip list
  const chips = useMemo(() => {
    const result: ChipDef[] = [];

    // --- Global chips ---

    // Period chip (special handling)
    if (global.periodPreset !== GLOBAL_DEFAULTS.periodPreset) {
      if (global.periodPreset === "custom") {
        // Only show chip when BOTH dates are filled
        if (global.customStart != null && global.customEnd != null) {
          const startLabel = formatDateShort(global.customStart);
          const endLabel = formatDateShort(global.customEnd);
          result.push({
            key: "period",
            label: "Period",
            value: `${startLabel} - ${endLabel}`,
            onRemove: () => removeGlobal("periodPreset"),
          });
        }
        // Half-filled custom: no chip
      } else {
        const presetLabel =
          REPORT_DATE_PRESETS.find((p) => p.value === global.periodPreset)?.label ??
          global.periodPreset;
        result.push({
          key: "period",
          label: "Period",
          value: presetLabel,
          onRemove: () => removeGlobal("periodPreset"),
        });
      }
    }

    // Principal
    if (global.principalId != null) {
      result.push({
        key: "principal",
        label: "Principal",
        value: principalName ?? `#${global.principalId}`,
        onRemove: () => removeGlobal("principalId"),
      });
    }

    // Product
    if (global.productId != null) {
      result.push({
        key: "product",
        label: "Product",
        value: productName ?? `#${global.productId}`,
        onRemove: () => removeGlobal("productId"),
      });
    }

    // Owner
    if (global.ownerId != null) {
      result.push({
        key: "owner",
        label: "Owner",
        value: ownerName ?? `#${global.ownerId}`,
        onRemove: () => removeGlobal("ownerId"),
      });
    }

    // --- Tab-local chips ---

    if (activeTab === "opportunities") {
      // Stage chips
      if (opps.stage.length > 0) {
        const stageLabels = opps.stage
          .map((s) => OPPORTUNITY_STAGE_CHOICES.find((c) => c.id === s)?.name ?? s)
          .join(", ");
        result.push({
          key: "stage",
          label: "Stage",
          value: stageLabels,
          onRemove: () => setOpps({ ...opps, stage: OPPORTUNITIES_DEFAULTS.stage }),
        });
      }
    }

    if (activeTab === "campaign") {
      // Campaign
      if (
        campaign.selectedCampaign != null &&
        campaign.selectedCampaign !== CAMPAIGN_DEFAULTS.selectedCampaign
      ) {
        result.push({
          key: "campaign",
          label: "Campaign",
          value: campaign.selectedCampaign,
          onRemove: () =>
            setCampaign({ ...campaign, selectedCampaign: CAMPAIGN_DEFAULTS.selectedCampaign }),
        });
      }

      // Activity types (show chip if not all selected)
      const allTypes = INTERACTION_TYPE_OPTIONS.map((t) => t.value);
      const defaultTypes = CAMPAIGN_DEFAULTS.selectedActivityTypes;
      if (
        JSON.stringify([...campaign.selectedActivityTypes].sort()) !==
        JSON.stringify([...defaultTypes].sort())
      ) {
        const count = campaign.selectedActivityTypes.length;
        result.push({
          key: "activityTypes",
          label: "Activity Types",
          value: `${count} of ${allTypes.length}`,
          onRemove: () => setCampaign({ ...campaign, selectedActivityTypes: defaultTypes }),
        });
      }

      // Stale leads
      if (campaign.showStaleLeads !== CAMPAIGN_DEFAULTS.showStaleLeads) {
        result.push({
          key: "staleLeads",
          label: "Stale Leads",
          value: campaign.showStaleLeads ? "On" : "Off",
          onRemove: () =>
            setCampaign({ ...campaign, showStaleLeads: CAMPAIGN_DEFAULTS.showStaleLeads }),
        });
      }
    }

    return result;
  }, [
    global,
    principalName,
    productName,
    ownerName,
    activeTab,
    opps,
    campaign,
    removeGlobal,
    setOpps,
    setCampaign,
  ]);

  // Render nothing when no chips
  if (chips.length === 0) return null;

  return (
    <div
      role="list"
      className="flex flex-wrap items-center gap-2 py-2"
      aria-label="Active report filters"
    >
      {chips.map((chip) => (
        <div key={chip.key} role="listitem">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 gap-1.5 pl-3 pr-2 text-xs"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label} filter: ${chip.value}`}
          >
            <span>
              {chip.label}: {chip.value}
            </span>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
