/**
 * useCampaignFilterOptions — Light hook for campaign filter metadata only.
 *
 * Fetches campaign options, sales rep options, and activity type counts
 * via the `get_campaign_report_stats` RPC. Does NOT fetch heavy activity
 * data or stale opportunities.
 *
 * Uses the same React Query key (`reportKeys.campaignStats`) as
 * `useCampaignActivityData`, so the RPC call is deduplicated when both
 * hooks are mounted for the same campaign.
 */
import { useMemo } from "react";
import { useDataProvider } from "ra-core";
import { useQuery } from "@tanstack/react-query";
import { reportKeys } from "@/atomic-crm/queryKeys";
import type { ExtendedDataProvider } from "../../providers/supabase/extensions/types";
import type { GetCampaignReportStatsResponse } from "../../validation/rpc";

export function useCampaignFilterOptions(selectedCampaign: string) {
  const dataProvider = useDataProvider() as ExtendedDataProvider;

  const { data: reportStats, isPending } = useQuery({
    queryKey: reportKeys.campaignStats(selectedCampaign),
    queryFn: () =>
      dataProvider.rpc<GetCampaignReportStatsResponse>("get_campaign_report_stats", {
        p_campaign: selectedCampaign || null,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const campaignOptions = useMemo(
    () => reportStats?.campaign_options ?? [],
    [reportStats?.campaign_options]
  );

  const salesRepOptions = useMemo(
    () => reportStats?.sales_rep_options ?? [],
    [reportStats?.sales_rep_options]
  );

  const activityTypeCounts = useMemo(
    () => new Map(Object.entries(reportStats?.activity_type_counts ?? {})),
    [reportStats?.activity_type_counts]
  );

  return {
    campaignOptions,
    salesRepOptions,
    activityTypeCounts,
    isLoading: isPending,
  };
}
