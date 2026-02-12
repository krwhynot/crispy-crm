import React, { useEffect, useMemo, useState } from "react";
import { ReportLayout } from "@/atomic-crm/reports/ReportLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminButton } from "@/components/admin/AdminButton";
import { Label } from "@/components/ui/label";
import { Card, CardHeader } from "@/components/ui/card";
import { ActivityTypeCard } from "./ActivityTypeCard";
import { StaleLeadsView } from "./StaleLeadsView";
import { CampaignActivityFilters } from "./CampaignActivityFilters";
import { CampaignActivitySummaryCards } from "./CampaignActivitySummaryCards";
import { useCampaignActivityData } from "./useCampaignActivityData";
import { useCampaignActivityExport } from "./useCampaignActivityExport";
import { INTERACTION_TYPE_OPTIONS } from "@/atomic-crm/validation/activities";
import { format, subDays, startOfMonth } from "date-fns";
import { AppliedFiltersBar } from "@/atomic-crm/reports/components";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity, CheckCircle } from "lucide-react";
import { useReportFilterState, CAMPAIGN_DEFAULTS, type CampaignFilterState } from "../hooks";

/** Activity type matching useCampaignActivityData return type and Activity from types.ts */
interface CampaignActivity {
  id: number;
  type: string;
  subject: string;
  organization_id: number;
  organization_name: string;
  contact_id: number | null;
  contact_name?: string;
  opportunity_id?: number | null;
  opportunity_name?: string | null;
  created_by: number;
  created_at: string;
}

/** Extended ActivityGroup with required percentage for campaign reports */
interface CampaignActivityGroup {
  type: string;
  activities: CampaignActivity[];
  totalCount: number;
  uniqueOrgs: number;
  percentage: number;
  mostActiveOrg: string;
  mostActiveCount: number;
}

export default function CampaignActivityReport() {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const campaignDefaults: CampaignFilterState = {
    ...CAMPAIGN_DEFAULTS,
    selectedActivityTypes: INTERACTION_TYPE_OPTIONS.map((opt) => opt.value),
  };

  const [filterState, updateFilters, resetFilters] = useReportFilterState<CampaignFilterState>(
    "reports.campaign",
    campaignDefaults
  );

  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [ariaLiveMessage, setAriaLiveMessage] = useState<string>("");

  const hasInitialized = React.useRef(false);

  const {
    activities,
    activitiesError,
    salesMap,
    campaignOptions,
    salesRepOptions,
    activityTypeCounts,
    totalCampaignActivitiesCount,
    totalCampaignOpportunities,
    isLoadingCampaigns,
    isLoadingActivities,
    staleOpportunities: staleOpportunitiesData,
  } = useCampaignActivityData({
    selectedCampaign: filterState.selectedCampaign || "Grand Rapids Trade Show",
    dateRange,
    selectedActivityTypes:
      filterState.selectedActivityTypes.length > 0
        ? filterState.selectedActivityTypes
        : INTERACTION_TYPE_OPTIONS.map((opt) => opt.value),
    selectedSalesRep: filterState.selectedSalesRep,
    allActivityTypes: INTERACTION_TYPE_OPTIONS,
    showStaleLeads: filterState.showStaleLeads,
  });

  const selectedCampaign =
    filterState.selectedCampaign || campaignOptions[0]?.name || "Grand Rapids Trade Show";
  const datePreset = filterState.datePreset;
  const selectedActivityTypes =
    filterState.selectedActivityTypes.length > 0
      ? filterState.selectedActivityTypes
      : INTERACTION_TYPE_OPTIONS.map((opt) => opt.value);
  const selectedSalesRep = filterState.selectedSalesRep;
  const showStaleLeads = filterState.showStaleLeads;

  useEffect(() => {
    if (!filterState.selectedCampaign && campaignOptions.length > 0) {
      updateFilters({ selectedCampaign: campaignOptions[0].name });
    }
  }, [campaignOptions, filterState.selectedCampaign, updateFilters]);

  const { exportStaleLeads, exportActivities } = useCampaignActivityExport(
    selectedCampaign,
    salesMap
  );

  const activityGroups = useMemo((): CampaignActivityGroup[] => {
    if (activities.length === 0) return [];

    const grouped = new Map<string, CampaignActivityGroup>();
    const totalActivities = activities.length;

    activities.forEach((activity) => {
      const type = activity.type || "Unknown";

      if (!grouped.has(type)) {
        grouped.set(type, {
          type,
          activities: [],
          totalCount: 0,
          uniqueOrgs: 0,
          percentage: 0,
          mostActiveOrg: "",
          mostActiveCount: 0,
        });
      }

      const group = grouped.get(type)!;
      group.activities.push(activity);
      group.totalCount += 1;
    });

    const result = Array.from(grouped.values()).map((group) => {
      const orgCounts = new Map<number, { name: string; count: number }>();

      group.activities.forEach((activity) => {
        const orgId = activity.organization_id;
        if (!orgCounts.has(orgId)) {
          orgCounts.set(orgId, {
            name: activity.organization_name || `Organization ${orgId}`,
            count: 0,
          });
        }
        orgCounts.get(orgId)!.count += 1;
      });

      const uniqueOrgs = orgCounts.size;
      const sortedOrgs = Array.from(orgCounts.entries()).toSorted(
        (a, b) => b[1].count - a[1].count
      );
      const [, mostActiveData] = sortedOrgs[0] || [null, { name: "N/A", count: 0 }];

      return {
        ...group,
        uniqueOrgs,
        percentage: Math.round((group.totalCount / totalActivities) * 100),
        mostActiveOrg: mostActiveData.name,
        mostActiveCount: mostActiveData.count,
      };
    });

    return result.toSorted((a, b) => b.totalCount - a.totalCount);
  }, [activities]);

  const staleOpportunities = useMemo(
    () =>
      (staleOpportunitiesData || []).map((opp) => ({
        id: opp.id,
        name: opp.name,
        stage: opp.stage,
        customer_organization_name: opp.customer_organization_name ?? undefined,
        lastActivityDate: opp.last_activity_date,
        daysInactive: opp.days_inactive,
        stageThreshold: opp.stage_threshold,
        isStale: opp.is_stale,
      })),
    [staleOpportunitiesData]
  );

  React.useEffect(() => {
    if (activityGroups.length > 0 && !hasInitialized.current) {
      const topThreeTypes = new Set(activityGroups.slice(0, 3).map((g) => g.type));
      setExpandedTypes(topThreeTypes);
      hasInitialized.current = true;
    }
  }, [activityGroups]);

  React.useEffect(() => {
    if (showStaleLeads) {
      setAriaLiveMessage(
        `Switched to stale leads view. Showing ${staleOpportunities.length} opportunities exceeding their per-stage activity thresholds.`
      );
    } else {
      setAriaLiveMessage(
        `Switched to activity breakdown view. Showing ${activityGroups.length} activity types.`
      );
    }
    const timer = setTimeout(() => setAriaLiveMessage(""), 1000);
    return () => clearTimeout(timer);
  }, [showStaleLeads, staleOpportunities.length, activityGroups.length]);

  const totalActivities = activities.length;
  const uniqueOrgs = new Set(activities.map((a) => a.organization_id)).size;
  const totalOpportunities = totalCampaignOpportunities || 1;
  const coverageRate =
    totalOpportunities > 0 ? Math.round((uniqueOrgs / totalOpportunities) * 100) : 0;
  const avgActivitiesPerLead =
    totalOpportunities > 0 ? (totalActivities / totalOpportunities).toFixed(1) : "0.0";

  const handleToggle = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const setDatePresetHandler = (preset: string) => {
    updateFilters({ datePreset: preset });
    const today = new Date();
    switch (preset) {
      case "last7":
        setDateRange({
          start: format(subDays(today, 7), "yyyy-MM-dd"),
          end: format(today, "yyyy-MM-dd"),
        });
        break;
      case "last30":
        setDateRange({
          start: format(subDays(today, 30), "yyyy-MM-dd"),
          end: format(today, "yyyy-MM-dd"),
        });
        break;
      case "thisMonth":
        setDateRange({
          start: format(startOfMonth(today), "yyyy-MM-dd"),
          end: format(today, "yyyy-MM-dd"),
        });
        break;
      case "allTime":
      default:
        setDateRange(null);
        break;
    }
  };

  const toggleActivityType = (type: string) => {
    if (selectedActivityTypes.includes(type)) {
      if (selectedActivityTypes.length > 1) {
        updateFilters({ selectedActivityTypes: selectedActivityTypes.filter((t) => t !== type) });
      }
    } else {
      updateFilters({ selectedActivityTypes: [...selectedActivityTypes, type] });
    }
  };

  const toggleAllActivityTypes = () => {
    if (selectedActivityTypes.length === INTERACTION_TYPE_OPTIONS.length) {
      updateFilters({ selectedActivityTypes: [] });
    } else {
      updateFilters({ selectedActivityTypes: INTERACTION_TYPE_OPTIONS.map((opt) => opt.value) });
    }
  };

  const clearFilters = () => {
    resetFilters();
    setDateRange(null);
  };

  const hasActiveFilters =
    dateRange !== null ||
    selectedActivityTypes.length < INTERACTION_TYPE_OPTIONS.length ||
    selectedSalesRep !== null ||
    showStaleLeads;

  const appliedFilters = useMemo(() => {
    const result: Array<{ label: string; value: string; onRemove: () => void }> = [];

    result.push({
      label: "Campaign",
      value: selectedCampaign,
      onRemove: () => {},
    });

    if (dateRange) {
      result.push({
        label: "Date Range",
        value: `${dateRange.start} to ${dateRange.end}`,
        onRemove: () => {
          setDateRange(null);
          updateFilters({ datePreset: "allTime" });
        },
      });
    }

    if (selectedActivityTypes.length < INTERACTION_TYPE_OPTIONS.length) {
      result.push({
        label: "Activity Types",
        value: `${selectedActivityTypes.length} selected`,
        onRemove: () =>
          updateFilters({
            selectedActivityTypes: INTERACTION_TYPE_OPTIONS.map((opt) => opt.value),
          }),
      });
    }

    if (selectedSalesRep !== null) {
      result.push({
        label: "Sales Rep",
        value: salesMap.get(selectedSalesRep) || `Rep ${selectedSalesRep}`,
        onRemove: () => updateFilters({ selectedSalesRep: null }),
      });
    }

    if (showStaleLeads) {
      result.push({
        label: "View",
        value: "Stale Leads Only",
        onRemove: () => updateFilters({ showStaleLeads: false }),
      });
    }

    return result;
  }, [
    selectedCampaign,
    dateRange,
    selectedActivityTypes,
    selectedSalesRep,
    showStaleLeads,
    salesMap,
    updateFilters,
  ]);

  const handleExport = () => {
    if (showStaleLeads) {
      exportStaleLeads(staleOpportunities);
    } else {
      exportActivities(activityGroups, activities);
    }
  };

  const hasActivityData = activities.length > 0;
  const isFirstLoad = isLoadingActivities && !hasActivityData;
  const isRefreshing = isLoadingActivities && hasActivityData;

  return (
    <ReportLayout title="Campaign Activity Report">
      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {ariaLiveMessage}
      </div>

      {isRefreshing && (
        <div className="text-xs text-muted-foreground animate-pulse" role="status">
          Updating...
        </div>
      )}

      {/* Campaign Selector and Filters */}
      <div className="mb-section">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
          <div className="flex-1 sm:max-w-xs">
            <Label htmlFor="campaign-select" className="block text-sm font-medium mb-2">
              Select Campaign
            </Label>
            {isLoadingCampaigns ? (
              <div
                className="h-10 bg-muted animate-pulse rounded-md"
                role="status"
                aria-label="Loading campaigns"
              />
            ) : (
              <Select
                value={selectedCampaign}
                onValueChange={(val) => updateFilters({ selectedCampaign: val })}
              >
                <SelectTrigger id="campaign-select">
                  <SelectValue placeholder="Choose a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaignOptions.map((campaign) => (
                    <SelectItem key={campaign.name} value={campaign.name}>
                      {campaign.name} ({campaign.count} opportunities)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {hasActiveFilters && (
              <AdminButton variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                Clear Filters
              </AdminButton>
            )}
            <AdminButton
              variant="default"
              onClick={handleExport}
              disabled={
                isLoadingActivities ||
                (showStaleLeads ? staleOpportunities.length === 0 : activities.length === 0)
              }
              className="w-full sm:w-auto"
            >
              Export to CSV
            </AdminButton>
          </div>
        </div>

        <CampaignActivityFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          datePreset={datePreset}
          setDatePreset={(val) => updateFilters({ datePreset: val })}
          setDatePresetHandler={setDatePresetHandler}
          selectedActivityTypes={selectedActivityTypes}
          toggleActivityType={toggleActivityType}
          toggleAllActivityTypes={toggleAllActivityTypes}
          activityTypeOptions={INTERACTION_TYPE_OPTIONS}
          activityTypeCounts={activityTypeCounts}
          selectedSalesRep={selectedSalesRep}
          setSelectedSalesRep={(val) => updateFilters({ selectedSalesRep: val })}
          salesRepOptions={salesRepOptions}
          allCampaignActivitiesCount={totalCampaignActivitiesCount}
          showStaleLeads={showStaleLeads}
          setShowStaleLeads={(val) => updateFilters({ showStaleLeads: val })}
          staleOpportunitiesCount={staleOpportunities.length}
        />
      </div>

      {/* Applied Filters Bar */}
      <AppliedFiltersBar
        filters={appliedFilters}
        onResetAll={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Error Display */}
      {activitiesError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive mb-section">
          <p className="font-medium">Failed to load campaign activities</p>
          <p className="text-sm">{activitiesError.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-content mb-section">
        <CampaignActivitySummaryCards
          isLoadingActivities={isFirstLoad}
          totalActivities={totalActivities}
          uniqueOrgs={uniqueOrgs}
          coverageRate={coverageRate}
          avgActivitiesPerLead={avgActivitiesPerLead}
        />
      </div>

      {/* Conditional Rendering: Stale Leads View or Activity Type Breakdown */}
      {isFirstLoad ? (
        <div className="space-y-4" role="status" aria-label="Loading campaign activities">
          <div className="h-6 bg-muted animate-pulse rounded w-48 mb-4" />
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted animate-pulse rounded w-32 mb-2" />
                    <div className="h-4 bg-muted animate-pulse rounded w-64" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : showStaleLeads ? (
        staleOpportunities.length === 0 && !activitiesError ? (
          <EmptyState
            title="No Stale Leads"
            description="All leads have recent activity - great job!"
            icon={CheckCircle}
          />
        ) : (
          <StaleLeadsView campaignName={selectedCampaign} staleOpportunities={staleOpportunities} />
        )
      ) : activityGroups.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Activity Type Breakdown</h3>
          {activityGroups.map((group) => (
            <ActivityTypeCard
              key={group.type}
              group={group}
              isExpanded={expandedTypes.has(group.type)}
              onToggle={() => handleToggle(group.type)}
              salesMap={salesMap}
            />
          ))}
        </div>
      ) : (
        !activitiesError && (
          <EmptyState
            title="No Campaign Activities"
            description={
              hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "Activities will appear here once your team starts engaging with leads."
            }
            icon={Activity}
            action={
              hasActiveFilters
                ? {
                    label: "Clear Filters",
                    onClick: clearFilters,
                  }
                : undefined
            }
          />
        )
      )}
    </ReportLayout>
  );
}
