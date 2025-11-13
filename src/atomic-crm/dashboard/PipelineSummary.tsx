// src/atomic-crm/dashboard/PipelineSummary.tsx
import { useGetList, useGetIdentity } from "react-admin";
import { TrendingUp } from "lucide-react";
import { DashboardWidget } from "./DashboardWidget";
import { OPPORTUNITY_STAGES } from "../opportunities/stageConstants";

interface PipelineHealth {
  icon: string;
  label: string;
}

/**
 * Calculate overall pipeline health based on stuck deals and urgent principals
 *
 * Health Levels:
 * - 🟢 Healthy: No stuck deals, no urgent principals
 * - 🟡 Fair: 1-3 stuck deals OR 1 urgent principal
 * - 🔴 Needs Attention: >3 stuck deals OR >1 urgent principals
 *
 * Design Reference: docs/plans/2025-11-07-dashboard-widgets-design.md:424-437
 */
export function calculatePipelineHealth(
  stuckDeals: number,
  urgentPrincipals: number
): PipelineHealth {
  if (stuckDeals > 3 || urgentPrincipals > 1) {
    return { icon: "🔴", label: "Needs Attention" };
  }
  if (stuckDeals > 0 || urgentPrincipals > 0) {
    return { icon: "🟡", label: "Fair" };
  }
  return { icon: "🟢", label: "Healthy" };
}

/**
 * Pipeline Summary Widget
 *
 * Shows high-level pipeline health metrics across all active opportunities.
 * Queries pre-aggregated dashboard_pipeline_summary view (P2 optimization).
 *
 * Performance:
 * - Previous: useGetList("opportunities", ..., perPage: 1000) → ~500ms + client aggregation
 * - Current: useGetList("dashboard_pipeline_summary") → ~50ms pre-aggregated results
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

interface PipelineSummaryRow {
  account_manager_id: number;
  stage: string;
  count: number;
  stuck_count: number;
  total_active: number;
  total_stuck: number;
}

export const PipelineSummary = () => {
  const { identity } = useGetIdentity();

  // Query pre-aggregated dashboard view instead of fetching 1000+ opportunities
  const { data: pipelineData, isPending, error } = useGetList<PipelineSummaryRow>(
    "dashboard_pipeline_summary",
    {
      filter: {
        account_manager_id: identity?.id,
      },
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
          <div className="px-content py-widget">
            <p className="text-sm text-muted-foreground">Loading pipeline...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isPending && error && (
        <div className="w-full">
          <div className="px-content py-widget">
            <p className="text-sm text-destructive">Failed to load pipeline data</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isPending && !error && (!pipelineData || pipelineData.length === 0) && (
        <div className="w-full">
          <div className="px-content py-widget">
            <p className="text-sm text-muted-foreground">No active opportunities</p>
          </div>
        </div>
      )}

      {/* Success state */}
      {!isPending && !error && pipelineData && pipelineData.length > 0 && (
        <div className="w-full">
          {/* Metrics display */}
          <div className="px-content py-widget space-y-widget">
            {(() => {
              // Get totals from first row (same for all stages of same manager)
              const firstRow = pipelineData[0];
              const total_active = firstRow.total_active;
              const total_stuck = firstRow.total_stuck;
              const health = calculatePipelineHealth(total_stuck, 0); // atRisk=0 (TODO: calculate from principals)

              // Group by stage
              const byStage = pipelineData.map(row => ({
                stage: row.stage,
                count: row.count,
                stuckCount: row.stuck_count,
              }));

              return (
                <>
                  {/* Total Count */}
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-sm font-semibold">Total Opportunities</span>
                    <span className="text-lg font-bold">{total_active}</span>
                  </div>

                  {/* By Stage */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-compact">BY STAGE</h4>
                    <div className="space-y-compact">
                      {byStage.map((stage) => (
                        <StageRow
                          key={stage.stage}
                          stage={stage.stage}
                          count={stage.count}
                          stuckCount={stage.stuckCount}
                        />
                      ))}
                    </div>
                  </div>

                  {/* By Status */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-compact">BY STATUS</h4>
                    <div className="space-y-compact">
                      <StatusRow icon="🟢" label="Active" count={total_active} />
                      <StatusRow icon="⚠️" label="Stuck (30+d)" count={total_stuck} />
                      <StatusRow icon="🔴" label="At Risk" count={0} />
                    </div>
                  </div>

                  {/* Pipeline Health */}
                  <div className="pt-content border-t border-border">
                    <div className="flex items-center gap-compact">
                      <span className="text-sm font-semibold">Pipeline Health:</span>
                      <span className="text-lg">
                        {health.icon} {health.label}
                      </span>
                    </div>
                    {(total_stuck > 0) && (
                      <p className="text-xs text-muted-foreground mt-compact">
                        {total_stuck} stuck deal{total_stuck > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </DashboardWidget>
  );
};

/**
 * Stage Row Component
 * Displays opportunity count by stage with stuck indicator
 */
interface StageRowProps {
  stage: string;
  count: number;
  stuckCount: number;
}

function StageRow({ stage, count, stuckCount }: StageRowProps) {
  const stageLabel = OPPORTUNITY_STAGES.find((s) => s.value === stage)?.label || stage;

  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-foreground">{stageLabel}:</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{count}</span>
        {stuckCount > 0 && (
          <span className="text-xs text-warning">⚠️ {stuckCount} stuck</span>
        )}
      </div>
    </div>
  );
}

/**
 * Status Row Component
 * Displays opportunity count by status with emoji icon
 */
interface StatusRowProps {
  icon: string;
  label: string;
  count: number;
}

function StatusRow({ icon, label, count }: StatusRowProps) {
  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-foreground">
        {icon} {label}:
      </span>
      <span className="font-medium">{count}</span>
    </div>
  );
}
