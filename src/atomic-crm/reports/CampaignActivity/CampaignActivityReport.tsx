import React, { useMemo, useState } from "react";
import { ReportLayout } from "@/atomic-crm/reports/ReportLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import { getStaleThreshold, isOpportunityStale } from "@/atomic-crm/utils/stalenessCalculation";
import { parseDateSafely } from "@/lib/date-utils";

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
  const [selectedCampaign, setSelectedCampaign] = useState<string>("Grand Rapids Trade Show");

  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(
    INTERACTION_TYPE_OPTIONS.map((opt) => opt.value)
  );
  const [datePreset, setDatePreset] = useState<string>("allTime");
  const [selectedSalesRep, setSelectedSalesRep] = useState<number | null>(null);
  const [showStaleLeads, setShowStaleLeads] = useState<boolean>(false);
  const [ariaLiveMessage, setAriaLiveMessage] = useState<string>("");

  const hasInitialized = React.useRef(false);

  const {
    activities,
    activitiesError,
    allOpportunities,
    allCampaignActivities,
    opportunityMap,
    salesMap,
    campaignOptions,
    salesRepOptions,
    activityTypeCounts,
    isLoadingCampaigns,
    isLoadingActivities,
  } = useCampaignActivityData({
    selectedCampaign,
    dateRange,
    selectedActivityTypes,
    selectedSalesRep,
    allActivityTypes: INTERACTION_TYPE_OPTIONS,
  });

  const { exportStaleLeads, exportActivities } = useCampaignActivityExport(
    selectedCampaign,
    salesMap,
    opportunityMap
  );

  // Group activities by type
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

    // Calculate metrics for each group
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
      const sortedOrgs = Array.from(orgCounts.entries()).sort((a, b) => b[1].count - a[1].count);
      const [, mostActiveData] = sortedOrgs[0] || [null, { name: "N/A", count: 0 }];

      return {
        ...group,
        uniqueOrgs,
        percentage: Math.round((group.totalCount / totalActivities) * 100),
        mostActiveOrg: mostActiveData.name,
        mostActiveCount: mostActiveData.count,
      };
    });

    return result.sort((a, b) => b.totalCount - a.totalCount);
  }, [activities]);

  // Helper function: Get last activity date for an opportunity
  const getLastActivityForOpportunity = (
    oppId: number,
    activities: CampaignActivity[]
  ): string | null => {
    const oppActivities = activities.filter((a) => a.opportunity_id === oppId);
    if (oppActivities.length === 0) return null;

    const sortedActivities = oppActivities.sort((a, b) => {
      const dateA = parseDateSafely(a.created_at);
      const dateB = parseDateSafely(b.created_at);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });

    const firstActivity = sortedActivities[0];
    return firstActivity?.created_at ?? null;
  };

  // Calculate stale opportunities using per-stage thresholds (PRD Section 6.3)
  // Closed stages (closed_won, closed_lost) are excluded from staleness calculations
  const staleOpportunities = useMemo(() => {
    if (!showStaleLeads || !allOpportunities) return [];

    const opportunitiesForCampaign = allOpportunities.filter(
      (o) => o.campaign === selectedCampaign
    );
    const now = new Date();

    return (
      opportunitiesForCampaign
        .filter((opp) => {
          if (!opp.stage) {
            console.error(
              `[DATA INTEGRITY] Opportunity ID ${opp.id} has no stage. ` +
                `Excluding from stale leads calculation. ` +
                `This indicates database corruption or a bug in the data layer.`
            );
            return false;
          }
          return true;
        })
        .map((opp) => {
          const lastActivityDate = getLastActivityForOpportunity(opp.id, allCampaignActivities);
          const lastActivityDateObj = lastActivityDate ? parseDateSafely(lastActivityDate) : null;
          const daysInactive = lastActivityDateObj
            ? Math.floor((now.getTime() - lastActivityDateObj.getTime()) / (1000 * 60 * 60 * 24))
            : 999999; // Never had activity - sort to end

          // Get per-stage threshold (undefined for closed stages)
          // Stage is guaranteed to exist due to filter above, but TypeScript needs assertion
          const stage = opp.stage!;
          const stageThreshold = getStaleThreshold(stage);

          return {
            ...opp,
            lastActivityDate,
            daysInactive,
            stageThreshold, // Include threshold for display
            isStale: isOpportunityStale(stage, lastActivityDate ?? null, now),
          };
        })
        // Exclude closed stages (stageThreshold is undefined for them)
        // Only include opportunities that are actually stale per their stage threshold
        .filter((opp) => opp.isStale && opp.stageThreshold !== undefined)
        .sort((a, b) => {
          // Sort by "days over threshold" (most urgent first)
          const aOverage = a.daysInactive - (a.stageThreshold || 0);
          const bOverage = b.daysInactive - (b.stageThreshold || 0);
          return bOverage - aOverage;
        })
    );
  }, [showStaleLeads, allOpportunities, selectedCampaign, allCampaignActivities]);

  // Auto-expand top 3 activity types on load
  React.useEffect(() => {
    if (activityGroups.length > 0 && !hasInitialized.current) {
      const topThreeTypes = new Set(activityGroups.slice(0, 3).map((g) => g.type));
      setExpandedTypes(topThreeTypes);
      hasInitialized.current = true;
    }
  }, [activityGroups]);

  // Announce view changes to screen readers
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
    // Clear message after announcement
    const timer = setTimeout(() => setAriaLiveMessage(""), 1000);
    return () => clearTimeout(timer);
  }, [showStaleLeads, staleOpportunities.length, activityGroups.length]);

  // Calculate summary metrics
  const totalActivities = activities.length;
  const uniqueOrgs = new Set(activities.map((a) => a.organization_id)).size;
  const totalOpportunities =
    allOpportunities.filter((opp) => opp.campaign === selectedCampaign).length || 1;
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

  // Date preset handlers
  const setDatePresetHandler = (preset: string) => {
    setDatePreset(preset);
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

  // Activity type toggle handler
  const toggleActivityType = (type: string) => {
    if (selectedActivityTypes.includes(type)) {
      // Don't allow deselecting if it's the last one
      if (selectedActivityTypes.length > 1) {
        setSelectedActivityTypes(selectedActivityTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedActivityTypes([...selectedActivityTypes, type]);
    }
  };

  // Select/deselect all activity types
  const toggleAllActivityTypes = () => {
    if (selectedActivityTypes.length === INTERACTION_TYPE_OPTIONS.length) {
      setSelectedActivityTypes([]);
    } else {
      setSelectedActivityTypes(INTERACTION_TYPE_OPTIONS.map((opt) => opt.value));
    }
  };

  // Clear all filters (keeps campaign selected)
  const clearFilters = () => {
    setDateRange(null);
    setSelectedActivityTypes(INTERACTION_TYPE_OPTIONS.map((opt) => opt.value));
    setDatePreset("allTime");
    setSelectedSalesRep(null);
    setShowStaleLeads(false);
  };

  // Check if any filters are active
  const hasActiveFilters =
    dateRange !== null ||
    selectedActivityTypes.length < INTERACTION_TYPE_OPTIONS.length ||
    selectedSalesRep !== null ||
    showStaleLeads;

  // Build applied filters array for AppliedFiltersBar
  const appliedFilters = useMemo(() => {
    const result: Array<{ label: string; value: string; onRemove: () => void }> = [];

    // Campaign filter (always visible)
    result.push({
      label: "Campaign",
      value: selectedCampaign,
      onRemove: () => {}, // Can't remove campaign - it's required
    });

    // Date range (if not all time)
    if (dateRange) {
      result.push({
        label: "Date Range",
        value: `${dateRange.start} to ${dateRange.end}`,
        onRemove: () => {
          setDateRange(null);
          setDatePreset("allTime");
        },
      });
    }

    // Activity types (if not all)
    if (selectedActivityTypes.length < INTERACTION_TYPE_OPTIONS.length) {
      result.push({
        label: "Activity Types",
        value: `${selectedActivityTypes.length} selected`,
        onRemove: () => setSelectedActivityTypes(INTERACTION_TYPE_OPTIONS.map((opt) => opt.value)),
      });
    }

    // Sales rep
    if (selectedSalesRep !== null) {
      result.push({
        label: "Sales Rep",
        value: salesMap.get(selectedSalesRep) || `Rep ${selectedSalesRep}`,
        onRemove: () => setSelectedSalesRep(null),
      });
    }

    // Stale leads toggle
    if (showStaleLeads) {
      result.push({
        label: "View",
        value: "Stale Leads Only",
        onRemove: () => setShowStaleLeads(false),
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
  ]);

  const handleExport = () => {
    if (showStaleLeads) {
      exportStaleLeads(staleOpportunities);
    } else {
      exportActivities(activityGroups, activities);
    }
  };

  return (
    <ReportLayout title="Campaign Activity Report">
      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {ariaLiveMessage}
      </div>

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
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
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
              <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                Clear Filters
              </Button>
            )}
            <Button
              variant="default"
              onClick={handleExport}
              disabled={
                isLoadingActivities ||
                (showStaleLeads ? staleOpportunities.length === 0 : activities.length === 0)
              }
              className="w-full sm:w-auto"
            >
              Export to CSV
            </Button>
          </div>
        </div>

        <CampaignActivityFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          datePreset={datePreset}
          setDatePreset={setDatePreset}
          setDatePresetHandler={setDatePresetHandler}
          selectedActivityTypes={selectedActivityTypes}
          toggleActivityType={toggleActivityType}
          toggleAllActivityTypes={toggleAllActivityTypes}
          activityTypeOptions={INTERACTION_TYPE_OPTIONS}
          activityTypeCounts={activityTypeCounts}
          selectedSalesRep={selectedSalesRep}
          setSelectedSalesRep={setSelectedSalesRep}
          salesRepOptions={salesRepOptions}
          allCampaignActivitiesCount={allCampaignActivities.length}
          showStaleLeads={showStaleLeads}
          setShowStaleLeads={setShowStaleLeads}
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
          isLoadingActivities={isLoadingActivities}
          totalActivities={totalActivities}
          uniqueOrgs={uniqueOrgs}
          coverageRate={coverageRate}
          avgActivitiesPerLead={avgActivitiesPerLead}
        />
      </div>

      {/* Conditional Rendering: Stale Leads View or Activity Type Breakdown */}
      {isLoadingActivities ? (
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
