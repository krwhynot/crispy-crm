import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { useMyPerformance, type PerformanceMetric } from "./useMyPerformance";

/**
 * Performance metric type identifiers for configuration lookup
 */
type PerformanceMetricType =
  | "activitiesThisWeek"
  | "dealsMoved"
  | "tasksCompleted"
  | "openOpportunities";

/**
 * Configuration for each compact metric in the widget row
 */
const COMPACT_METRIC_CONFIG: Record<PerformanceMetricType, { icon: LucideIcon; label: string }> = {
  activitiesThisWeek: { icon: Activity, label: "Activities" },
  dealsMoved: { icon: TrendingUp, label: "Deals Moved" },
  tasksCompleted: { icon: CheckCircle2, label: "Tasks Done" },
  openOpportunities: { icon: Briefcase, label: "Open Opps" },
};

/**
 * Navigation URLs for each metric, matching KPI_NAVIGATION from MyPerformanceWidget
 */
const PERFORMANCE_NAVIGATION: Record<PerformanceMetricType, string> = {
  activitiesThisWeek: "/reports",
  dealsMoved: "/opportunities",
  tasksCompleted: "/tasks",
  openOpportunities:
    "/opportunities?filter=%7B%22stage%40not_in%22%3A%5B%22closed_won%22%2C%22closed_lost%22%5D%7D",
};

/**
 * Ordered list of metrics for consistent rendering in the 2x2 grid
 */
const METRIC_ORDER: PerformanceMetricType[] = [
  "activitiesThisWeek",
  "dealsMoved",
  "tasksCompleted",
  "openOpportunities",
];

interface CompactMetricItemProps {
  type: PerformanceMetricType;
  metric: PerformanceMetric;
  onClick: () => void;
}

/**
 * Individual compact metric item within the 2x2 grid.
 * Shows icon, label, value, and trend arrow.
 * Min height 44px for touch target compliance.
 */
function CompactMetricItem({ type, metric, onClick }: CompactMetricItemProps) {
  const config = COMPACT_METRIC_CONFIG[type];
  const Icon = config.icon;

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
      className="flex items-center gap-2 rounded-md p-1.5 min-h-[44px] cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${config.label}: ${metric.value}. Click to view details`}
    >
      {/* Icon container */}
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      {/* Label + value + trend */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{config.label}</p>
        <div className="flex items-center gap-1">
          <span className="text-base font-semibold text-foreground">
            {metric.value.toLocaleString()}
          </span>
          {(metric.previousValue > 0 || metric.value > 0) && (
            <TrendIcon
              className={cn("h-3 w-3", trendColorClass)}
              aria-label={`${metric.direction === "up" ? "increased" : metric.direction === "down" ? "decreased" : "unchanged"}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the compact metric item
 */
function CompactMetricSkeleton() {
  return (
    <div className="flex items-center gap-2 p-1.5 min-h-[44px]" aria-busy="true">
      <Skeleton className="h-8 w-8 rounded-md shrink-0" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  );
}

/**
 * CompactPerformanceWidget - Compact 200px-tall performance metrics card
 * for the V4 dashboard widget row.
 *
 * Reuses the useMyPerformance() hook and renders a 2x2 grid of compact
 * metric items with trend indicators and click-to-navigate behavior.
 *
 * Features:
 * - 2x2 grid layout within 200px height constraint
 * - Trend arrows with semantic colors (text-success / text-destructive)
 * - Clickable metrics navigate to relevant pages
 * - Loading skeleton state
 * - Touch targets >= 44px
 *
 * @example
 * ```tsx
 * <CompactPerformanceWidget />
 * ```
 */
export function CompactPerformanceWidget() {
  const navigate = useNavigate();
  const { metrics, loading } = useMyPerformance();

  return (
    <Card className="flex flex-col" data-tutorial="dashboard-compact-performance">
      <CardHeader className="py-2 px-3 shrink-0">
        <CardTitle className="text-sm font-medium">My Performance</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-3 pb-3">
        <div
          className="grid grid-cols-2 gap-2"
          role="region"
          aria-label="Personal performance metrics"
        >
          {loading
            ? METRIC_ORDER.map((type) => <CompactMetricSkeleton key={type} />)
            : METRIC_ORDER.map((type) => (
                <CompactMetricItem
                  key={type}
                  type={type}
                  metric={metrics[type]}
                  onClick={() => navigate(PERFORMANCE_NAVIGATION[type])}
                />
              ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">vs. last week</p>
      </CardContent>
    </Card>
  );
}

export default CompactPerformanceWidget;
