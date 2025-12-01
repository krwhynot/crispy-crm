import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { useMyPerformance, type PerformanceMetric } from "../hooks/useMyPerformance";

/**
 * Performance metric type identifiers for configuration lookup
 */
type PerformanceMetricType =
  | "activitiesThisWeek"
  | "dealsMoved"
  | "tasksCompleted"
  | "openOpportunities";

/**
 * Configuration for each performance metric type
 * Per PRD v1.18 - personal performance tracking for sales reps
 */
const METRIC_CONFIG: Record<
  PerformanceMetricType,
  {
    icon: LucideIcon;
    label: string;
    shortLabel: string;
  }
> = {
  activitiesThisWeek: {
    icon: Activity,
    label: "Activities This Week",
    shortLabel: "Activities",
  },
  dealsMoved: {
    icon: TrendingUp,
    label: "Deals Moved",
    shortLabel: "Deals Moved",
  },
  tasksCompleted: {
    icon: CheckCircle2,
    label: "Tasks Completed",
    shortLabel: "Tasks Done",
  },
  openOpportunities: {
    icon: Briefcase,
    label: "Open Opportunities",
    shortLabel: "Open Opps",
  },
};

interface MetricCardProps {
  type: PerformanceMetricType;
  metric: PerformanceMetric;
  loading?: boolean;
}

/**
 * Individual metric display within the performance widget
 *
 * Features:
 * - Value with trend arrow indicator
 * - text-success (green) for positive trends
 * - text-destructive (red) for negative trends
 * - Compact layout for widget embedding
 */
function MetricCard({ type, metric, loading }: MetricCardProps) {
  const config = METRIC_CONFIG[type];
  const Icon = config.icon;

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3" aria-busy="true">
        <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    );
  }

  // Determine trend icon and styling per P8 constraint
  const TrendIcon =
    metric.direction === "up" ? ArrowUpRight : metric.direction === "down" ? ArrowDownRight : Minus;

  const trendColorClass =
    metric.direction === "up"
      ? "text-success"
      : metric.direction === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
      role="group"
      aria-label={`${config.label}: ${metric.value}`}
    >
      {/* Icon - 36px container for compact layout */}
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      {/* Metric content */}
      <div className="flex-1 min-w-0">
        {/* Label */}
        <p className="text-xs text-muted-foreground truncate">{config.shortLabel}</p>
        {/* Value and trend */}
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-semibold text-foreground">
            {metric.value.toLocaleString()}
          </span>
          {/* Trend indicator - only show if there's a meaningful comparison */}
          {(metric.previousValue > 0 || metric.value > 0) && (
            <span
              className={cn("flex items-center text-xs font-medium", trendColorClass)}
              aria-label={`${metric.direction === "up" ? "increased" : metric.direction === "down" ? "decreased" : "unchanged"} by ${Math.abs(metric.trend)}%`}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {metric.direction !== "flat" && (
                <span className="ml-0.5">{Math.abs(metric.trend)}%</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MyPerformanceWidget - Personal performance metrics summary
 *
 * Displays 4 key personal performance metrics with week-over-week trends:
 * 1. Activities This Week - activities logged by current user
 * 2. Deals Moved - opportunities with stage changes
 * 3. Tasks Completed - tasks marked complete this week
 * 4. Open Opportunities - current pipeline count
 *
 * Layout:
 * - Card container with 2x2 grid of metrics
 * - Trend arrows use semantic colors (text-success/text-destructive)
 * - Compact design for dashboard embedding
 *
 * Accessibility:
 * - Semantic structure with role="group"
 * - Screen reader labels for trends
 * - Keyboard navigable (inherits from Card)
 */
export function MyPerformanceWidget() {
  const { metrics, loading } = useMyPerformance();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">My Performance</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* 2x2 grid on mobile, 2x2 on desktop for compact widget */}
        <div
          className="grid grid-cols-2 gap-1"
          role="region"
          aria-label="Personal performance metrics"
        >
          <MetricCard
            type="activitiesThisWeek"
            metric={metrics.activitiesThisWeek}
            loading={loading}
          />
          <MetricCard type="dealsMoved" metric={metrics.dealsMoved} loading={loading} />
          <MetricCard type="tasksCompleted" metric={metrics.tasksCompleted} loading={loading} />
          <MetricCard
            type="openOpportunities"
            metric={metrics.openOpportunities}
            loading={loading}
          />
        </div>

        {/* Week comparison note */}
        <p className="text-xs text-muted-foreground mt-3 text-center">Compared to last week</p>
      </CardContent>
    </Card>
  );
}
