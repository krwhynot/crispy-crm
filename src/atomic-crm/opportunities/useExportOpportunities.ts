import { useCallback } from "react";
import { useNotify } from "ra-core";
import { logger } from "@/lib/logger";
import type { Opportunity } from "../types";
import { getOpportunityStageLabel } from "./constants";
import { format } from "date-fns";
import { parseDateSafely } from "@/lib/date-utils";

export const useExportOpportunities = () => {
  const notify = useNotify();

  const exportToCSV = useCallback(
    (opportunities: Opportunity[], filename?: string) => {
      if (!opportunities || opportunities.length === 0) {
        notify("No opportunities to export", { type: "warning" });
        return;
      }

      try {
        // Define CSV columns - Principal is prominently positioned (3rd column)
        const headers = [
          "Name",
          "Customer Organization",
          "⭐ Principal Organization", // Prominent with star
          "Distributor Organization",
          "Stage",
          "Status",
          "Priority",
          "Estimated Close Date",
          "Description",
          "Campaign",
          "Related Opportunity",
          "Tags",
          "Interactions",
          "Last Interaction",
          "Days in Stage",
          "Created Date",
        ];

        // Convert opportunities to CSV rows
        const rows = opportunities.map((opp) => [
          opp.name || "",
          opp.customer_organization_name || "",
          opp.principal_organization_name || "", // ⭐ Principal prominently positioned
          opp.distributor_organization_name || "",
          getOpportunityStageLabel(opp.stage) || "",
          opp.status || "",
          opp.priority || "",
          opp.estimated_close_date && parseDateSafely(opp.estimated_close_date)
            ? format(parseDateSafely(opp.estimated_close_date)!, "yyyy-MM-dd")
            : "",
          opp.description || "",
          opp.campaign || "",
          opp.related_opportunity_id ? `ID: ${opp.related_opportunity_id}` : "",
          opp.tags ? opp.tags.join("; ") : "",
          opp.nb_interactions?.toString() || "0",
          opp.last_interaction_date && parseDateSafely(opp.last_interaction_date)
            ? format(parseDateSafely(opp.last_interaction_date)!, "yyyy-MM-dd")
            : "",
          opp.days_in_stage?.toString() || "",
          opp.created_at && parseDateSafely(opp.created_at)
            ? format(parseDateSafely(opp.created_at)!, "yyyy-MM-dd")
            : "",
        ]);

        // Combine headers and rows
        const csvContent = [
          headers.join(","),
          ...rows.map((row) =>
            row
              .map((cell) => {
                // Escape cells containing commas, quotes, or newlines
                const cellStr = String(cell);
                if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
                  return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
              })
              .join(",")
          ),
        ].join("\n");

        // Create and trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        const defaultFilename = `opportunities_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
        link.setAttribute("download", filename || defaultFilename);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        notify(
          `Exported ${opportunities.length} opportunit${opportunities.length === 1 ? "y" : "ies"} to CSV`,
          {
            type: "success",
          }
        );
      } catch (error: unknown) {
        logger.error("Export failed", error, { feature: "useExportOpportunities" });
        const message = error instanceof Error ? error.message : "Unknown error";
        notify(`Failed to export opportunities: ${message}`, { type: "error" });
      }
    },
    [notify]
  );

  return { exportToCSV };
};
