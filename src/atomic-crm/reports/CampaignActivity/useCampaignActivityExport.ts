import { useCallback } from "react";
import { useNotify, downloadCSV } from "ra-core";
import jsonExport from "jsonexport/dist";
import { format } from "date-fns";
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";
import { parseDateSafely } from "@/lib/date-utils";

interface CampaignActivity {
  id: number;
  type: string;
  subject: string;
  organization_id: number;
  organization_name: string;
  contact_name?: string | null;
  opportunity_id?: number | null;
  opportunity_name?: string | null;
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

interface StaleOpportunity {
  id: number;
  name: string;
  stage?: string;
  customer_organization_name?: string;
  lastActivityDate: string | null;
  daysInactive: number;
  stageThreshold?: number;
  isStale: boolean;
}

export function useCampaignActivityExport(selectedCampaign: string, salesMap: Map<number, string>) {
  const notify = useNotify();

  const exportStaleLeads = useCallback(
    (staleOpportunities: StaleOpportunity[]) => {
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
          notes: "",
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
    },
    [selectedCampaign, notify]
  );

  const exportActivities = useCallback(
    (activityGroups: CampaignActivityGroup[], activities: CampaignActivity[]) => {
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
            activity_category: sanitizeCsvValue(activity.type),
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
    },
    [selectedCampaign, salesMap, opportunityMap, notify]
  );

  return { exportStaleLeads, exportActivities };
}
