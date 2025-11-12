// src/atomic-crm/dashboard/PipelineSummary.tsx
import { useGetList, useGetIdentity } from "react-admin";
import { TrendingUp } from "lucide-react";
import { DashboardWidget } from "./DashboardWidget";
import type { Opportunity } from "../types";

/**
 * Pipeline Summary Widget
 *
 * Shows high-level pipeline health metrics across all active opportunities.
 * Displays counts by stage, status, and calculates overall pipeline health.
 *
 * Design: docs/plans/2025-11-07-dashboard-widgets-design.md (Widget 5)
 *
 * Table Structure:
 * - Header: "PIPELINE SUMMARY" with TrendingUp icon
 * - Metrics: Total count, By Stage, By Status, Health Score
 * - Compact display: ~300px height
 *
 * Interactions:
 * - Click stage → Navigate to /opportunities?stage={stage}
 * - Click "Stuck" → Navigate to /opportunities?stuck=true
 */

export const PipelineSummary = () => {
  const { identity } = useGetIdentity();

  const { data: opportunities, isPending, error } = useGetList<Opportunity>(
    "opportunities",
    {
      filter: {
        account_manager_id: identity?.id,
        status: "active",
      },
      pagination: { page: 1, perPage: 1000 },
    },
    {
      enabled: !!identity?.id,
    }
  );

  return (
    <DashboardWidget
      title={
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>PIPELINE SUMMARY</span>
        </div>
      }
      className="col-span-full"
    >
      {/* Loading state */}
      {isPending && (
        <div className="w-full">
          <div className="px-3 py-4">
            <p className="text-sm text-muted-foreground">Loading pipeline...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isPending && error && (
        <div className="w-full">
          <div className="px-3 py-4">
            <p className="text-sm text-destructive">Failed to load pipeline data</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isPending && !error && (!opportunities || opportunities.length === 0) && (
        <div className="w-full">
          <div className="px-3 py-4">
            <p className="text-sm text-muted-foreground">No active opportunities</p>
          </div>
        </div>
      )}

      {/* Success state - to be implemented */}
      {!isPending && !error && opportunities && opportunities.length > 0 && (
        <div className="w-full">
          <div className="px-3 py-4">
            <p className="text-sm">Pipeline data loaded ({opportunities.length} opportunities)</p>
          </div>
        </div>
      )}
    </DashboardWidget>
  );
};
