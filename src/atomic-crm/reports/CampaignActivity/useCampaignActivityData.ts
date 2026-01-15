import { useMemo } from "react";
import { useGetList } from "ra-core";
import { useReportData } from "@/atomic-crm/reports/hooks";
import type { Sale } from "../types";

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

interface CampaignOpportunity {
  id: number;
  name: string;
  campaign: string | null;
  customer_organization_name?: string;
  stage?: string;
}

interface DateRange {
  start: string;
  end: string;
}

interface UseCampaignActivityDataOptions {
  selectedCampaign: string;
  dateRange: DateRange | null;
  selectedActivityTypes: string[];
  selectedSalesRep: number | null;
  allActivityTypes: readonly { value: string; label: string }[];
}

export function useCampaignActivityData(options: UseCampaignActivityDataOptions) {
  const { selectedCampaign, dateRange, selectedActivityTypes, selectedSalesRep, allActivityTypes } =
    options;

  const { data: allOpportunities = [], isPending: opportunitiesPending } =
    useGetList<CampaignOpportunity>("opportunities", {
      pagination: { page: 1, perPage: 1000 }, // Report requires all records for campaign filtering
      filter: {
        "deleted_at@is": null,
      },
    });

  const { data: allCampaignActivities = [], isPending: allActivitiesPending } =
    useGetList<CampaignActivity>("activities", {
      pagination: { page: 1, perPage: 1000 },
      filter: {
        "opportunities.campaign": selectedCampaign,
        "opportunities.deleted_at@is": null,
      },
      sort: { field: "created_at", order: "DESC" },
    });

  const activitiesFilter = useMemo(
    () => ({
      "opportunities.campaign": selectedCampaign,
      "opportunities.deleted_at@is": null,
      ...(selectedActivityTypes.length > 0 &&
        selectedActivityTypes.length < allActivityTypes.length && {
          type: selectedActivityTypes,
        }),
      ...(selectedSalesRep !== null && { created_by: selectedSalesRep }),
    }),
    [selectedCampaign, selectedActivityTypes, selectedSalesRep, allActivityTypes.length]
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

  const opportunityMap = useMemo(
    () => new Map((allOpportunities || []).map((o) => [o.id, o])),
    [allOpportunities]
  );

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

  const activityTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allCampaignActivities.forEach((activity) => {
      const type = activity.type || "Unknown";
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return counts;
  }, [allCampaignActivities]);

  const isLoadingCampaigns = opportunitiesPending;
  const isLoadingActivities = activitiesLoading || allActivitiesPending;

  return {
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
  };
}
