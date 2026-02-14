/**
 * ReportFilterSidebar -- Switcher that renders the correct filter sidebar
 * based on the active report tab.
 *
 * Note: Overview tab no longer uses the sidebar — its filters are in
 * ReportContextHeader (inline header bar). This sidebar only renders
 * for opportunities, weekly, and campaign tabs.
 *
 * Includes a "Clear filters" button when any filter deviates from defaults.
 */
import { useCallback } from "react";
import { useStore } from "ra-core";
import { RotateCcw } from "lucide-react";

import { AdminButton } from "@/components/admin/AdminButton";
import { INTERACTION_TYPE_OPTIONS } from "@/atomic-crm/validation/activities";
import type {
  CampaignFilterState,
  WeeklyFilterState,
  OpportunitiesFilterState,
} from "@/atomic-crm/reports/hooks";
import { CAMPAIGN_DEFAULTS, OPPORTUNITIES_DEFAULTS } from "@/atomic-crm/reports/hooks";

import {
  OpportunitiesFilterSidebar,
  useOpportunitiesHasActiveFilters,
} from "./OpportunitiesFilterSidebar";
import { WeeklyFilterSidebar, useWeeklyHasActiveFilters } from "./WeeklyFilterSidebar";
import { CampaignFilterSidebar, useCampaignHasActiveFilters } from "./CampaignFilterSidebar";

interface ReportFilterSidebarProps {
  activeTab: string;
}

const WEEKLY_DEFAULTS: WeeklyFilterState = { start: "", end: "" };

const ALL_ACTIVITY_TYPE_VALUES = INTERACTION_TYPE_OPTIONS.map((o) => o.value);

export function ReportFilterSidebar({ activeTab }: ReportFilterSidebarProps) {
  const opportunitiesActive = useOpportunitiesHasActiveFilters();
  const weeklyActive = useWeeklyHasActiveFilters();
  const campaignActive = useCampaignHasActiveFilters();

  // Store setters for resetting each tab
  const [, setOpportunities] = useStore<OpportunitiesFilterState>(
    "reports.opportunities",
    OPPORTUNITIES_DEFAULTS
  );
  const [, setWeekly] = useStore<WeeklyFilterState>("reports.weekly", WEEKLY_DEFAULTS);
  // Campaign reset preserves selectedCampaign to avoid losing context
  const [campaignState, setCampaign] = useStore<CampaignFilterState>(
    "reports.campaign",
    CAMPAIGN_DEFAULTS
  );

  const hasActiveFilters =
    (activeTab === "opportunities" && opportunitiesActive) ||
    (activeTab === "weekly" && weeklyActive) ||
    (activeTab === "campaign" && campaignActive);

  const handleReset = useCallback(() => {
    switch (activeTab) {
      case "opportunities":
        setOpportunities(OPPORTUNITIES_DEFAULTS);
        break;
      case "weekly":
        setWeekly(WEEKLY_DEFAULTS);
        break;
      case "campaign":
        // Preserve the selected campaign when resetting
        setCampaign({
          ...CAMPAIGN_DEFAULTS,
          selectedCampaign: campaignState.selectedCampaign,
          selectedActivityTypes: [...ALL_ACTIVITY_TYPE_VALUES],
        });
        break;
    }
  }, [activeTab, setOpportunities, setWeekly, setCampaign, campaignState.selectedCampaign]);

  return (
    <nav aria-label="Report filters" className="flex flex-col gap-1 w-full">
      {/* Tab-specific filter panel (overview uses ReportContextHeader instead) */}
      {activeTab === "opportunities" && <OpportunitiesFilterSidebar />}
      {activeTab === "weekly" && <WeeklyFilterSidebar />}
      {activeTab === "campaign" && <CampaignFilterSidebar />}

      {/* Reset button */}
      {hasActiveFilters && (
        <div className="mt-4 px-2">
          <AdminButton
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-11 w-full justify-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            Clear filters
          </AdminButton>
        </div>
      )}
    </nav>
  );
}
