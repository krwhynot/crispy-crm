// Card wrapper removed - parent DashboardTabPanel provides container
import { useNavigate } from "react-router-dom";
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
    label: "My Activities This Week",
    shortLabel: "My Activities",
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

/**
 * Navigation URLs for each metric type, matching KPI_NAVIGATION pattern
 */
const PERFORMANCE_NAVIGATION: Record<PerformanceMetricType, string> = {
  activitiesThisWeek: "/reports",
  dealsMoved: "/opportunities",
  tasksCompleted: "/tasks",
  openOpportunities:
    "/opportunities?filter=%7B%22stage%40not_in%22%3A%5B%22closed_won%22%2C%22closed_lost%22%5D%7D",
};

interface MetricCardProps {
  type: PerformanceMetricType;
  metric: PerformanceMetric;
  loading?: boolean;
  onClick?: () => void;
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
function MetricCard({ type, metric, loading, onClick }: MetricCardProps) {
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

  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        isClickable
          ? "cursor-pointer hover:bg-muted/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          : "hover:bg-muted/50"
      )}
      role={isClickable ? "button" : "group"}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={`${config.label}: ${metric.value}${isClickable ? ". Click to view details" : ""}`}
    >
      {/* Icon - 40px container for compact layout */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
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
 * 1. My Activities - activities logged by current user
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
function MyPerformanceWidget() {
  const navigate = useNavigate();
  const { metrics, loading } = useMyPerformance();

  return (
    <div className="p-4" data-tutorial="dashboard-performance-widget">
      <div className="mb-3">
        <h3 className="text-base font-semibold">My Performance</h3>
      </div>
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
          onClick={() => navigate(PERFORMANCE_NAVIGATION.activitiesThisWeek)}
        />
        <MetricCard
          type="dealsMoved"
          metric={metrics.dealsMoved}
          loading={loading}
          onClick={() => navigate(PERFORMANCE_NAVIGATION.dealsMoved)}
        />
        <MetricCard
          type="tasksCompleted"
          metric={metrics.tasksCompleted}
          loading={loading}
          onClick={() => navigate(PERFORMANCE_NAVIGATION.tasksCompleted)}
        />
        <MetricCard
          type="openOpportunities"
          metric={metrics.openOpportunities}
          loading={loading}
          onClick={() => navigate(PERFORMANCE_NAVIGATION.openOpportunities)}
        />
      </div>

      {/* Week comparison note */}
      <p className="text-xs text-muted-foreground mt-3 text-center">Compared to last week</p>
    </div>
  );
}

// Named export for barrel, default export for lazy loading
export { MyPerformanceWidget };
export default MyPerformanceWidget;
