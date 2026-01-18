import { useMemo } from "react";
import { useGetList, useDataProvider } from "ra-core";
import { useQuery } from "@tanstack/react-query";
import { useReportData } from "@/atomic-crm/reports/hooks";
import type { Sale } from "../types";
import type { ExtendedDataProvider } from "../../providers/supabase/extensions/types";
import type { GetCampaignReportStatsResponse } from "../../validation/rpc";

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

  const dataProvider = useDataProvider() as ExtendedDataProvider;

  const { data: reportStats, isPending: reportStatsPending } = useQuery({
    queryKey: ["campaign-report-stats", selectedCampaign],
    queryFn: () =>
      dataProvider.rpc<GetCampaignReportStatsResponse>("get_campaign_report_stats", {
        p_campaign: selectedCampaign || null,
      }),
    staleTime: 5 * 60 * 1000,
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

  const campaignOptions = reportStats?.campaign_options ?? [];
  const salesRepOptions = reportStats?.sales_rep_options ?? [];
  const activityTypeCounts = useMemo(
    () => new Map(Object.entries(reportStats?.activity_type_counts ?? {})),
    [reportStats?.activity_type_counts]
  );

  const totalCampaignActivitiesCount = useMemo(
    () => salesRepOptions.reduce((sum, rep) => sum + rep.count, 0),
    [salesRepOptions]
  );

  const totalCampaignOpportunities = useMemo(() => {
    const selected = campaignOptions.find((c) => c.name === selectedCampaign);
    return selected?.count ?? 0;
  }, [campaignOptions, selectedCampaign]);

  const isLoadingCampaigns = reportStatsPending;
  const isLoadingActivities = activitiesLoading;

  return {
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
  };
}
