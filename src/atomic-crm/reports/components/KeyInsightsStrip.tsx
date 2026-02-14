/**
 * KeyInsightsStrip — Auto-generated insight statements above KPI row.
 *
 * Displays up to 3 contextual insights derived from report data:
 * 1. Dominant pipeline stage
 * 2. Most active rep
 * 3. Stale deal risk (warning-tinted)
 *
 * Pure presentational — no react-admin imports.
 */
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PipelineItem {
  stage: string;
  count: number;
}

interface RepItem {
  name: string;
  activities: number;
  opportunities: number;
}

interface KeyInsightsStripProps {
  pipelineData: PipelineItem[];
  repPerformanceData: RepItem[];
  staleDeals: number;
  isLoading: boolean;
}

interface Insight {
  key: string;
  text: string;
  variant: "default" | "warning";
}

export function KeyInsightsStrip({
  pipelineData,
  repPerformanceData,
  staleDeals,
  isLoading,
}: KeyInsightsStripProps) {
  const insights = useMemo(() => {
    const result: Insight[] = [];

    // 1. Dominant pipeline stage
    if (pipelineData.length > 0) {
      const total = pipelineData.reduce((sum, s) => sum + s.count, 0);
      if (total > 0) {
        // Sort by count desc, then alphabetically for ties
        const sorted = [...pipelineData].sort(
          (a, b) => b.count - a.count || a.stage.localeCompare(b.stage)
        );
        const dominant = sorted[0];
        const pct = Math.round((dominant.count / total) * 100);
        result.push({
          key: "pipeline",
          text: `Pipeline dominated by ${dominant.stage} (${pct}%)`,
          variant: "default",
        });
      }
    }

    // 2. Most active rep
    if (repPerformanceData.length > 0) {
      const withActivity = repPerformanceData.filter((r) => r.activities > 0);
      if (withActivity.length > 0) {
        // Sort by activities desc, then alphabetically for ties
        const sorted = [...withActivity].sort(
          (a, b) => b.activities - a.activities || a.name.localeCompare(b.name)
        );
        const topRep = sorted[0];
        result.push({
          key: "rep",
          text: `${topRep.name} most active this week (${topRep.activities} activities)`,
          variant: "default",
        });
      }
    }

    // 3. Stale deal risk
    if (staleDeals > 0) {
      result.push({
        key: "stale",
        text: `${staleDeals} deal${staleDeals === 1 ? "" : "s"} exceeding stage thresholds`,
        variant: "warning",
      });
    }

    return result;
  }, [pipelineData, repPerformanceData, staleDeals]);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-compact" aria-busy="true">
        <Skeleton className="h-6 w-64 rounded" />
        <Skeleton className="h-6 w-56 rounded" />
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2"
      role="status"
      aria-label="Key insights"
    >
      {insights.map((insight) => (
        <span
          key={insight.key}
          className={`inline-flex items-center gap-1.5 text-sm ${
            insight.variant === "warning" ? "text-warning font-medium" : "text-muted-foreground"
          }`}
        >
          {insight.variant === "warning" && (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          {insight.text}
        </span>
      ))}
    </div>
  );
}
