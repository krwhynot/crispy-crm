import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  AlertCircle,
  Activity,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

/**
 * KPI Metric Type for dashboard summary cards
 */
export type KPIMetricType =
  | "totalPipeline"
  | "overdueTasks"
  | "activitiesThisWeek"
  | "openOpportunities";

interface KPICardProps {
  /** Metric type determines icon, label, and navigation target */
  type: KPIMetricType;
  /** The metric value to display */
  value: number;
  /** Whether the card is in loading state */
  loading?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * Configuration for each KPI metric type
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
  }
> = {
  totalPipeline: {
    icon: DollarSign,
    label: "Total Pipeline",
    formatValue: (value) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: value >= 1_000_000 ? "compact" : "standard",
      }).format(value),
    navigateTo: "/opportunities?filter=%7B%22stage%40not_in%22%3A%5B%22closed_won%22%2C%22closed_lost%22%5D%7D",
  },
  overdueTasks: {
    icon: AlertCircle,
    label: "Overdue Tasks",
    formatValue: (value) => value.toLocaleString(),
    navigateTo: "/tasks?filter=%7B%22completed%22%3Afalse%2C%22due_date%40lt%22%3A%22today%22%7D",
    destructiveWhenPositive: true,
  },
  activitiesThisWeek: {
    icon: Activity,
    label: "Activities This Week",
    formatValue: (value) => value.toLocaleString(),
    navigateTo: "/activities?filter=%7B%22activity_date%40gte%22%3A%22this_week_start%22%7D",
  },
  openOpportunities: {
    icon: Briefcase,
    label: "Open Opportunities",
    formatValue: (value) => value.toLocaleString(),
    navigateTo: "/opportunities?filter=%7B%22stage%40not_in%22%3A%5B%22closed_won%22%2C%22closed_lost%22%5D%7D",
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
export function KPICard({ type, value, loading = false, className }: KPICardProps) {
  const navigate = useNavigate();
  const config = KPI_CONFIG[type];
  const Icon = config.icon;

  const isDestructive = config.destructiveWhenPositive && value > 0;

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
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-3">
          {/* Icon container - 48px minimum touch target */}
          <div
            className={cn(
              "flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg shrink-0",
              isDestructive
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden="true" />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Label */}
            <p className="text-xs lg:text-sm text-muted-foreground truncate">
              {config.label}
            </p>
            {/* Value */}
            <p
              className={cn(
                "text-lg lg:text-xl font-semibold truncate",
                isDestructive ? "text-destructive" : "text-foreground"
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
