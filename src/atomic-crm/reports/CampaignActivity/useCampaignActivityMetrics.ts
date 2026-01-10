import { useMemo } from "react";
import { parseDateSafely } from "@/lib/date-utils";
import { isOpportunityStale, getStaleThreshold } from "@/atomic-crm/utils/stalenessCalculation";

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

interface CampaignActivityGroup {
  type: string;
  activities: CampaignActivity[];
  totalCount: number;
  uniqueOrgs: number;
  percentage: number;
  mostActiveOrg: string;
  mostActiveCount: number;
}

interface CampaignOpportunity {
  id: number;
  name: string;
  campaign: string | null;
  customer_organization_name?: string;
  stage?: string;
}

function getLastActivityForOpportunity(
  oppId: number,
  activities: CampaignActivity[]
): string | null {
  const oppActivities = activities.filter((a) => a.opportunity_id === oppId);
  if (oppActivities.length === 0) return null;

  const sortedActivities = oppActivities.sort((a, b) => {
    const dateA = parseDateSafely(a.created_at);
    const dateB = parseDateSafely(b.created_at);
    if (!dateA || !dateB) return 0;
    return dateB.getTime() - dateA.getTime();
  });

  return sortedActivities[0]?.created_at ?? null;
}

export function useCampaignActivityMetrics(
  activities: CampaignActivity[],
  allOpportunities: CampaignOpportunity[],
  allCampaignActivities: CampaignActivity[],
  selectedCampaign: string,
  showStaleLeads: boolean
) {
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

  const staleOpportunities = useMemo(() => {
    if (!showStaleLeads || !allOpportunities) return [];

    const opportunitiesForCampaign = allOpportunities.filter(
      (o) => o.campaign === selectedCampaign
    );
    const now = new Date();

    return opportunitiesForCampaign
      .filter((opp) => {
        if (!opp.stage) {
          console.error(
            `[DATA INTEGRITY] Opportunity ID ${opp.id} has no stage. ` +
              `Excluding from metrics calculation. ` +
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
          : 999999;

        // Stage is guaranteed to exist due to filter above, but TypeScript needs assertion
        const stage = opp.stage as string;
        const stageThreshold = getStaleThreshold(stage);

        return {
          ...opp,
          lastActivityDate,
          daysInactive,
          stageThreshold,
          isStale: isOpportunityStale(stage, lastActivityDate, now),
        };
      })
      .filter((opp) => opp.isStale && opp.stageThreshold !== undefined)
      .sort((a, b) => {
        const aOverage = a.daysInactive - (a.stageThreshold || 0);
        const bOverage = b.daysInactive - (b.stageThreshold || 0);
        return bOverage - aOverage;
      });
  }, [showStaleLeads, allOpportunities, selectedCampaign, allCampaignActivities]);

  const totalActivities = activities.length;
  const uniqueOrgs = new Set(activities.map((a) => a.organization_id)).size;
  const totalOpportunities =
    allOpportunities.filter((opp) => opp.campaign === selectedCampaign).length || 1;
  const coverageRate =
    totalOpportunities > 0 ? Math.round((uniqueOrgs / totalOpportunities) * 100) : 0;
  const avgActivitiesPerLead =
    totalOpportunities > 0 ? (totalActivities / totalOpportunities).toFixed(1) : "0.0";

  return {
    activityGroups,
    staleOpportunities,
    totalActivities,
    uniqueOrgs,
    coverageRate,
    avgActivitiesPerLead,
  };
}
