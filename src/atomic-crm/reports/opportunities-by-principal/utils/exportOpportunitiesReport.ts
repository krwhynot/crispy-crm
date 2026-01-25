import { format } from "date-fns";
import { downloadCSV } from "ra-core";
import jsonExport from "jsonexport/dist";
import { logger } from "@/lib/logger";
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";
import { parseDateSafely } from "@/lib/date-utils";
import type { PrincipalGroup } from "../components/PrincipalGroupCard";

interface ExportOptions {
  principalGroups: PrincipalGroup[];
  salesMap: Map<string | number, string>;
  onSuccess: () => void;
  onError: (message: string) => void;
  onEmpty: () => void;
}

/**
 * Exports opportunities report to CSV format
 *
 * @param options - Export configuration including principal groups, sales map, and callbacks
 */
export function exportOpportunitiesReport({
  principalGroups,
  salesMap,
  onSuccess,
  onError,
  onEmpty,
}: ExportOptions): void {
  const exportData: Array<{
    principal: string;
    opportunity: string;
    organization: string;
    stage: string;
    close_date: string;
    sales_rep: string;
    priority: string;
    status: string;
    days_in_stage: number;
  }> = [];

  principalGroups.forEach((group) => {
    group.opportunities.forEach((opp) => {
      const closeDateObj = opp.estimated_close_date
        ? parseDateSafely(opp.estimated_close_date)
        : null;
      exportData.push({
        principal: sanitizeCsvValue(group.principalName),
        opportunity: sanitizeCsvValue(opp.name),
        organization: sanitizeCsvValue(opp.customer_organization_name || ""),
        stage: sanitizeCsvValue(opp.stage),
        close_date: closeDateObj ? format(closeDateObj, "yyyy-MM-dd") : "",
        sales_rep: sanitizeCsvValue(salesMap.get(opp.opportunity_owner_id!) || "Unassigned"),
        priority: sanitizeCsvValue(opp.priority || "medium"),
        status: sanitizeCsvValue(opp.status),
        days_in_stage: opp.days_in_stage || 0,
      });
    });
  });

  if (exportData.length === 0) {
    onEmpty();
    return;
  }

  jsonExport(exportData, (err, csv) => {
    if (err) {
      logger.error("Export error", err, { feature: "OpportunitiesByPrincipalReport" });
      onError("Export failed. Please try again.");
      return;
    }
    downloadCSV(csv, `opportunities-by-principal-${format(new Date(), "yyyy-MM-dd")}`);
    onSuccess();
  });
}
