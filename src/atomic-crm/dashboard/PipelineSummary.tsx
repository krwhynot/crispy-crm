// src/atomic-crm/dashboard/PipelineSummary.tsx
import { useGetList, useGetIdentity } from "react-admin";
import { TrendingUp } from "lucide-react";
import { DashboardWidget } from "./DashboardWidget";
import type { Opportunity } from "../types";
import { OPPORTUNITY_STAGES } from "../opportunities/stageConstants";

interface PipelineMetrics {
  total: number;
  byStage: Array<{ stage: string; count: number; stuckCount: number }>;
  active: number;
  stuck: number;
  atRisk: number;
}

export function calculatePipelineMetrics(opportunities: Opportunity[]): PipelineMetrics {
  if (!opportunities || opportunities.length === 0) {
    return {
      total: 0,
      byStage: [],
      active: 0,
      stuck: 0,
      atRisk: 0,
    };
  }

  // Group by stage
  const stageGroups = new Map<string, { count: number; stuckCount: number }>();

  OPPORTUNITY_STAGES.forEach((stage) => {
    stageGroups.set(stage.value, { count: 0, stuckCount: 0 });
  });

  let stuckCount = 0;
  let activeCount = 0;

  opportunities.forEach((opp) => {
    // Count active opportunities
    if (opp.status === "active") {
      activeCount++;
    }

    // Count stuck opportunities (30+ days in stage)
    const isStuck = opp.days_in_stage && opp.days_in_stage >= 30;
    if (isStuck) {
      stuckCount++;
    }

    // Group by stage
    const group = stageGroups.get(opp.stage);
    if (group) {
      group.count++;
      if (isStuck) {
        group.stuckCount++;
      }
    }
  });

  // Convert to array and filter out empty stages
  const byStage = Array.from(stageGroups.entries())
    .filter(([_, group]) => group.count > 0)
    .map(([stage, group]) => ({
      stage,
      count: group.count,
      stuckCount: group.stuckCount,
    }));

  return {
    total: opportunities.length,
    byStage,
    active: activeCount,
    stuck: stuckCount,
    atRisk: 0, // TODO: Calculate based on principal urgency
  };
}

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

      {/* Success state */}
      {!isPending && !error && opportunities && opportunities.length > 0 && (
        <div className="w-full">
          {/* Metrics display */}
          <div className="px-3 py-4 space-y-4">
            {(() => {
              const metrics = calculatePipelineMetrics(opportunities);
              const health = calculatePipelineHealth(metrics.stuck, metrics.atRisk);

              return (
                <>
                  {/* Total Count */}
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-sm font-semibold">Total Opportunities</span>
                    <span className="text-lg font-bold">{metrics.total}</span>
                  </div>

                  {/* By Stage */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">BY STAGE</h4>
                    <div className="space-y-1">
                      {metrics.byStage.map((stage) => (
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
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">BY STATUS</h4>
                    <div className="space-y-1">
                      <StatusRow icon="🟢" label="Active" count={metrics.active} />
                      <StatusRow icon="⚠️" label="Stuck (30+d)" count={metrics.stuck} />
                      <StatusRow icon="🔴" label="At Risk" count={metrics.atRisk} />
                    </div>
                  </div>

                  {/* Pipeline Health */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Pipeline Health:</span>
                      <span className="text-lg">
                        {health.icon} {health.label}
                      </span>
                    </div>
                    {(metrics.stuck > 0 || metrics.atRisk > 0) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {metrics.stuck > 0 && `${metrics.stuck} stuck deal${metrics.stuck > 1 ? "s" : ""}`}
                        {metrics.stuck > 0 && metrics.atRisk > 0 && ", "}
                        {metrics.atRisk > 0 && `${metrics.atRisk} urgent principal${metrics.atRisk > 1 ? "s" : ""}`}
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
