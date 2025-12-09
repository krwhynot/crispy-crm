import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle, Activity, Briefcase, AlertTriangle, type LucideIcon } from "lucide-react";

/**
 * KPI Metric Type for dashboard summary cards (PRD v1.9)
 *
 * Order matches PRD Section 9.2.1:
 * 1. Open Opportunities - count (not $ value per Decision #5)
 * 2. Overdue Tasks - red when > 0
 * 3. Activities This Week - count
 * 4. Stale Deals - amber when > 0 (per-stage thresholds)
 */
export type KPIMetricType =
  | "openOpportunities"
  | "overdueTasks"
  | "activitiesThisWeek"
  | "staleDeals";

interface KPICardProps {
  /** Metric type determines icon, label, and navigation target */
  type: KPIMetricType;
  /** The metric value to display */
  value: number;
  /** Whether the card is in loading state */
  loading?: boolean;
  /** Custom class names */
  className?: string;
  /** Tutorial step identifier */
  "data-tutorial"?: string;
}

/**
 * Configuration for each KPI metric type (PRD v1.9 Section 9.2.1)
 */
const KPI_CONFIG: Record<
  KPIMetricType,
  {
    icon: LucideIcon;
    label: string;
    formatValue: (value: number) => string;
    navigateTo: string;
    /** Whether to show destructive (red) styling when value > 0 */
    destructiveWhenPositive?: boolean;
    /** Whether to show warning (amber) styling when value > 0 */
    warningWhenPositive?: boolean;
  }
> = {
  // KPI #1: Open Opportunities count (not $ value per Decision #5)
  openOpportunities: {
    icon: Briefcase,
    label: "Open Opportunities",
    formatValue: (value) => value.toLocaleString(),
    navigateTo:
      "/opportunities?filter=%7B%22stage%40not_in%22%3A%5B%22closed_won%22%2C%22closed_lost%22%5D%7D",
  },
  // KPI #2: Overdue Tasks with red styling when > 0
  overdueTasks: {
    icon: AlertCircle,
    label: "Overdue Tasks",
    formatValue: (value) => value.toLocaleString(),
    navigateTo: "/tasks?filter=%7B%22completed%22%3Afalse%2C%22due_date%40lt%22%3A%22today%22%7D",
    destructiveWhenPositive: true,
  },
  // KPI #3: Activities This Week - Navigate to Reports for weekly analysis
  activitiesThisWeek: {
    icon: Activity,
    label: "Activities This Week",
    formatValue: (value) => value.toLocaleString(),
    navigateTo: "/reports",
  },
  // KPI #4: Stale Deals with amber/warning styling when > 0
  staleDeals: {
    icon: AlertTriangle,
    label: "Stale Deals",
    formatValue: (value) => value.toLocaleString(),
    navigateTo: "/opportunities?filter=%7B%22stale%22%3Atrue%7D",
    warningWhenPositive: true,
  },
};

/**
 * KPICard - Dashboard metric summary card with navigation
 *
 * Features:
 * - Click navigates to filtered list view
 * - Loading skeleton while fetching
 * - Red accent for overdue tasks (when count > 0)
 * - 48px minimum touch target
 * - Semantic button for accessibility
 *
 * Layout:
 * - Desktop: Part of 4-column grid
 * - Mobile: Part of 2x2 grid
 */
export function KPICard({
  type,
  value,
  loading = false,
  className,
  "data-tutorial": dataTutorial
}: KPICardProps) {
  const navigate = useNavigate();
  const config = KPI_CONFIG[type];
  const Icon = config.icon;

  const isDestructive = config.destructiveWhenPositive && value > 0;
  const isWarning = config.warningWhenPositive && value > 0;

  const handleClick = () => {
    navigate(config.navigateTo);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  if (loading) {
    return (
      <Card
        className={cn("p-3 lg:p-4", className)}
        aria-busy="true"
        aria-label={`Loading ${config.label}`}
        data-tutorial={dataTutorial}
      >
        <CardContent className="p-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        // Base card styling
        "cursor-pointer transition-all duration-150",
        // Hover: subtle lift (inherits from Card component)
        // Padding: compact on mobile, standard on desktop
        "p-3 lg:p-4",
        // Focus ring for accessibility
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${config.label}: ${config.formatValue(value)}. Click to view details.`}
      data-tutorial={dataTutorial}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-3">
          {/* Icon container - 44px minimum touch target (WCAG 2.1 AA) */}
          <div
            className={cn(
              "flex h-11 w-11 lg:h-12 lg:w-12 items-center justify-center rounded-lg shrink-0",
              isDestructive
                ? "bg-destructive/10 text-destructive"
                : isWarning
                  ? "bg-warning/10 text-warning"
                  : "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden="true" />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Label */}
            <p className="text-xs lg:text-sm text-muted-foreground truncate">{config.label}</p>
            {/* Value */}
            <p
              className={cn(
                "text-lg lg:text-xl font-semibold truncate",
                isDestructive ? "text-destructive" : isWarning ? "text-warning" : "text-foreground"
              )}
            >
              {config.formatValue(value)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
