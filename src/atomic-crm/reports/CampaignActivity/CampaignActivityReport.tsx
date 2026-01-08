import React, { useMemo, useState } from "react";
import { useGetList, useNotify, downloadCSV } from "ra-core";
import jsonExport from "jsonexport/dist";
import { ReportLayout } from "@/atomic-crm/reports/ReportLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ActivityTypeCard } from "./ActivityTypeCard";
import { StaleLeadsView } from "./StaleLeadsView";
import { INTERACTION_TYPE_OPTIONS } from "@/atomic-crm/validation/activities";
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";
import {
  STAGE_STALE_THRESHOLDS,
  isOpportunityStale,
  getStaleThreshold,
} from "@/atomic-crm/utils/stalenessCalculation";
import { format, subDays, startOfMonth } from "date-fns";
import { parseDateSafely } from "@/lib/date-utils";
import type { Sale, Activity as BaseActivity, ActivityGroup } from "../types";
import { AppliedFiltersBar, EmptyState } from "@/atomic-crm/reports/components";
import { useReportData } from "@/atomic-crm/reports/hooks";
import { Activity, CheckCircle } from "lucide-react";

/** Extended activity with required organization_name for campaign reporting */
interface CampaignActivity extends Omit<BaseActivity, "organization_name"> {
  organization_name: string; // Required for campaign reports
}

/** Campaign-specific opportunity data */
interface CampaignOpportunity {
  id: number;
  name: string;
  campaign: string | null;
  customer_organization_name?: string;
  stage?: string;
}

/** Extended ActivityGroup with required percentage for campaign reports */
interface CampaignActivityGroup
  extends Omit<ActivityGroup, "percentage" | "mostActiveOrg" | "mostActiveCount" | "activities"> {
  activities: CampaignActivity[];
  percentage: number;
  mostActiveOrg: string;
  mostActiveCount: number;
}

export default function CampaignActivityReport() {
  const notify = useNotify();
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [selectedCampaign, setSelectedCampaign] = useState<string>("Grand Rapids Trade Show");

  // Filter state
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(
    INTERACTION_TYPE_OPTIONS.map((opt) => opt.value)
  );
  const [datePreset, setDatePreset] = useState<string>("allTime");
  const [selectedSalesRep, setSelectedSalesRep] = useState<number | null>(null);
  const [showStaleLeads, setShowStaleLeads] = useState<boolean>(false);
  // Per-stage thresholds from PRD Section 6.3 - no longer using a fixed threshold
  // Thresholds: new_lead=7d, initial_outreach=14d, sample_visit_offered=14d, feedback_logged=21d, demo_scheduled=14d
  // Closed stages (closed_won, closed_lost) are excluded from staleness calculations
  const [ariaLiveMessage, setAriaLiveMessage] = useState<string>("");

  // Track if initial expansion has happened (prevents re-expansion on re-renders)
  const hasInitialized = React.useRef(false);

  // Fetch all opportunities to get available campaigns
  const { data: allOpportunities = [], isPending: opportunitiesPending } =
    useGetList<CampaignOpportunity>("opportunities", {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        "deleted_at@is": null,
      },
    });

  // Get distinct campaigns with opportunity counts
  const campaignOptions = useMemo(() => {
    const campaigns = new Map<string, number>();

    allOpportunities.forEach((opp) => {
      if (opp.campaign) {
        campaigns.set(opp.campaign, (campaigns.get(opp.campaign) || 0) + 1);
      }
    });

    return Array.from(campaigns.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allOpportunities]);

  // Fetch ALL activities for the selected campaign (unfiltered, for counts)
  const { data: allCampaignActivities = [], isPending: allActivitiesPending } =
    useGetList<CampaignActivity>("activities", {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        "opportunities.campaign": selectedCampaign,
        "opportunities.deleted_at@is": null,
      },
      sort: { field: "created_at", order: "DESC" },
    });

  // Fetch activities for the selected campaign (with filters applied)
  const activitiesFilter = useMemo(
    () => ({
      "opportunities.campaign": selectedCampaign,
      "opportunities.deleted_at@is": null,
      ...(selectedActivityTypes.length > 0 &&
        selectedActivityTypes.length < INTERACTION_TYPE_OPTIONS.length && {
          type: selectedActivityTypes,
        }),
      ...(selectedSalesRep !== null && { created_by: selectedSalesRep }),
    }),
    [selectedCampaign, selectedActivityTypes, selectedSalesRep]
  );

  const activitiesDateRange = useMemo(
    () =>
      dateRange
        ? {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          }
        : undefined,
    [dateRange]
  );

  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useReportData<CampaignActivity>("activities", {
    dateRange: activitiesDateRange,
    additionalFilters: activitiesFilter,
    dateField: "created_at",
  });

  // Get sales rep names for created_by lookup
  const ownerIds = useMemo(
    () => Array.from(new Set((activities || []).map((a) => a.created_by).filter(Boolean))),
    [activities]
  );

  const { data: salesReps = [] } = useGetList<Sale>("sales", {
    filter: ownerIds.length > 0 ? { id: ownerIds } : undefined,
    pagination: { page: 1, perPage: 100 },
  });

  const salesMap = useMemo(
    () => new Map((salesReps || []).map((s) => [s.id, `${s.first_name} ${s.last_name}`])),
    [salesReps]
  );

  // Create opportunity map for looking up opportunity details
  const opportunityMap = useMemo(
    () => new Map((allOpportunities || []).map((o) => [o.id, o])),
    [allOpportunities]
  );

  // Calculate sales rep options with activity counts from ALL activities (unfiltered)
  const salesRepOptions = useMemo(() => {
    const repCounts = new Map<number, number>();

    allCampaignActivities.forEach((activity) => {
      if (activity.created_by) {
        repCounts.set(activity.created_by, (repCounts.get(activity.created_by) || 0) + 1);
      }
    });

    return Array.from(repCounts.entries())
      .map(([id, count]) => ({
        id,
        name: salesMap.get(id) || `Rep ${id}`,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allCampaignActivities, salesMap]);

  // Group activities by type
  const activityGroups = useMemo(() => {
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

    return sortedActivities[0].created_at;
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
        .map((opp) => {
          const lastActivityDate = getLastActivityForOpportunity(opp.id, allCampaignActivities);
          const lastActivityDateObj = lastActivityDate ? parseDateSafely(lastActivityDate) : null;
          const daysInactive = lastActivityDateObj
            ? Math.floor((now.getTime() - lastActivityDateObj.getTime()) / (1000 * 60 * 60 * 24))
            : 999999; // Never had activity - sort to end

          // Get per-stage threshold (undefined for closed stages)
          const stage = opp.stage || "new_lead";
          const stageThreshold = getStaleThreshold(stage);

          return {
            ...opp,
            lastActivityDate,
            daysInactive,
            stageThreshold, // Include threshold for display
            isStale: isOpportunityStale(stage, lastActivityDate, now),
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

  // Check if data is loading
  const isLoadingCampaigns = opportunitiesPending;
  const isLoadingActivities = activitiesLoading || allActivitiesPending;

  // Calculate activity counts by type for all activities (unfiltered)
  const activityTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allCampaignActivities.forEach((activity) => {
      const type = activity.type || "Unknown";
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return counts;
  }, [allCampaignActivities]);

  // CSV Export Function
  const handleExport = () => {
    if (showStaleLeads) {
      // Export stale leads
      if (staleOpportunities.length === 0) {
        notify("No stale leads to export", { type: "warning" });
        return;
      }

      const exportData = staleOpportunities.map((opp) => {
        const lastActivityDateObj = opp.lastActivityDate
          ? parseDateSafely(opp.lastActivityDate)
          : null;
        return {
          campaign: sanitizeCsvValue(selectedCampaign),
          opportunity_name: sanitizeCsvValue(opp.name),
          organization: sanitizeCsvValue(opp.customer_organization_name || ""),
          last_activity_date: lastActivityDateObj
            ? format(lastActivityDateObj, "yyyy-MM-dd")
            : "Never",
          days_inactive:
            opp.daysInactive >= 999999 ? "Never contacted" : opp.daysInactive.toString(),
          notes: "", // Not available in current data structure
        };
      });

      jsonExport(exportData, (err, csv) => {
        if (err) {
          console.error("Export error:", err);
          notify("Export failed. Please try again.", { type: "error" });
          return;
        }
        const campaignSlug = selectedCampaign
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "");
        const dateStr = format(new Date(), "yyyy-MM-dd");
        downloadCSV(csv, `campaign-stale-leads-${campaignSlug}-${dateStr}`);
        notify(`${staleOpportunities.length} stale leads exported successfully`, {
          type: "success",
        });
      });
    } else {
      // Export activities
      if (activityGroups.length === 0 || activities.length === 0) {
        notify("No activities to export", { type: "warning" });
        return;
      }

      const exportData = activityGroups.flatMap((group) =>
        group.activities.map((activity) => {
          const opportunity = activity.opportunity_id
            ? opportunityMap.get(activity.opportunity_id)
            : null;
          const createdAtDate = parseDateSafely(activity.created_at);
          const daysSinceActivity = createdAtDate
            ? Math.floor((Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          return {
            campaign: sanitizeCsvValue(selectedCampaign),
            activity_type: sanitizeCsvValue(activity.type),
            activity_category: sanitizeCsvValue(activity.type), // Same as activity_type for now
            subject: sanitizeCsvValue(activity.subject),
            organization: sanitizeCsvValue(activity.organization_name),
            contact_name: sanitizeCsvValue(activity.contact_name || ""),
            date: createdAtDate ? format(createdAtDate, "yyyy-MM-dd") : "",
            sales_rep: sanitizeCsvValue(salesMap.get(activity.created_by!) || "Unassigned"),
            days_since_activity: daysSinceActivity,
            opportunity_name: sanitizeCsvValue(opportunity?.name || ""),
            opportunity_stage: sanitizeCsvValue(opportunity?.stage || ""),
          };
        })
      );

      jsonExport(exportData, (err, csv) => {
        if (err) {
          console.error("Export error:", err);
          notify("Export failed. Please try again.", { type: "error" });
          return;
        }
        const campaignSlug = selectedCampaign
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "");
        const dateStr = format(new Date(), "yyyy-MM-dd");
        downloadCSV(csv, `campaign-activity-${campaignSlug}-${dateStr}`);
        notify(`${exportData.length} activities exported successfully`, { type: "success" });
      });
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

        {/* Filter Panel */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-section">
              {/* Date Range Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Date Range</h4>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={datePreset === "allTime" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDatePresetHandler("allTime")}
                    >
                      All time
                    </Button>
                    <Button
                      variant={datePreset === "last7" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDatePresetHandler("last7")}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant={datePreset === "last30" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDatePresetHandler("last30")}
                    >
                      Last 30 days
                    </Button>
                    <Button
                      variant={datePreset === "thisMonth" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDatePresetHandler("thisMonth")}
                    >
                      This month
                    </Button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Label htmlFor="start-date" className="text-xs">
                        Start Date
                      </Label>
                      <input
                        id="start-date"
                        type="date"
                        value={dateRange?.start || ""}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setDatePreset(""); // Clear preset when manual input
                          const endDate = dateRange?.end || format(new Date(), "yyyy-MM-dd");
                          // Only update if start <= end
                          if (newStart <= endDate) {
                            setDateRange({ start: newStart, end: endDate });
                          }
                        }}
                        className="h-11 w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="end-date" className="text-xs">
                        End Date
                      </Label>
                      <input
                        id="end-date"
                        type="date"
                        value={dateRange?.end || ""}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          setDatePreset(""); // Clear preset when manual input
                          const startDate = dateRange?.start || format(new Date(), "yyyy-MM-dd");
                          // Only update if start <= end
                          if (startDate <= newEnd) {
                            setDateRange({ start: startDate, end: newEnd });
                          }
                        }}
                        className="h-11 w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Type Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Activity Type</h4>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={toggleAllActivityTypes}
                    className="h-auto p-0 text-xs"
                  >
                    {selectedActivityTypes.length === INTERACTION_TYPE_OPTIONS.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {INTERACTION_TYPE_OPTIONS.map((option) => {
                    const count = activityTypeCounts.get(option.value) || 0;
                    return (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`activity-type-${option.value}`}
                          checked={selectedActivityTypes.includes(option.value)}
                          onCheckedChange={() => toggleActivityType(option.value)}
                        />
                        <Label
                          htmlFor={`activity-type-${option.value}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {option.label} ({count})
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sales Rep Filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Sales Rep</h4>
                <Select
                  value={selectedSalesRep?.toString() || "all"}
                  onValueChange={(value) =>
                    setSelectedSalesRep(value === "all" ? null : parseInt(value, 10))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Reps" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reps ({allCampaignActivities.length})</SelectItem>
                    {salesRepOptions.map((rep) => (
                      <SelectItem key={rep.id} value={rep.id.toString()}>
                        {rep.name} ({rep.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stale Leads Filter - Using Per-Stage Thresholds (PRD Section 6.3) */}
              <div>
                <h4 className="text-sm font-medium mb-3">Stale Leads</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-stale-leads"
                      checked={showStaleLeads}
                      onCheckedChange={(checked) => setShowStaleLeads(checked === true)}
                    />
                    <Label
                      htmlFor="show-stale-leads"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Show stale leads (per-stage thresholds)
                    </Label>
                  </div>
                  {/* Per-stage threshold info */}
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Thresholds by stage:</p>
                    <p className="pl-2">• New Lead: {STAGE_STALE_THRESHOLDS.new_lead}d</p>
                    <p className="pl-2">
                      • Outreach/Sample/Demo: {STAGE_STALE_THRESHOLDS.initial_outreach}d
                    </p>
                    <p className="pl-2">• Feedback: {STAGE_STALE_THRESHOLDS.feedback_logged}d</p>
                    <p className="pl-2 italic">Closed stages excluded</p>
                  </div>
                  {showStaleLeads && staleOpportunities.length > 0 && (
                    <div className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded">
                      ⚠️ {staleOpportunities.length}{" "}
                      {staleOpportunities.length === 1 ? "lead needs" : "leads need"} follow-up
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-content mb-section">
        {isLoadingActivities ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalActivities}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Organizations Contacted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueOrgs}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Coverage Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{coverageRate}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Activities per Lead
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgActivitiesPerLead}</div>
              </CardContent>
            </Card>
          </>
        )}
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
