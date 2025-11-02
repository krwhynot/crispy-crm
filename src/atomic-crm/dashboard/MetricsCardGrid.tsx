import { useGetList } from "ra-core";
import { Card } from "@/components/ui/card";
import { Users, Building2, Activity } from "lucide-react";
import { useMemo } from "react";

interface MetricCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  unit?: string;
  trend?: number;
  trendLabel?: string;
}

/**
 * MetricsCardGrid - iPad-first responsive dashboard metrics
 *
 * Design Strategy (iPad-First Responsive):
 * - iPad Portrait (sm): 1 column, full width cards
 * - iPad Landscape (md): 3 columns, optimal for field use
 * - Desktop (lg+): 3 columns with larger spacing
 *
 * Touch Targets: 44x44px minimum (Apple HIG compliant)
 * Card Heights: 160px (iPad portrait), 176px (iPad landscape), 192px (desktop)
 *
 * Color System: Uses semantic Tailwind utilities only
 * - No inline CSS variables (text-[color:var(--text-subtle)])
 * - All text colors via Tailwind: text-muted-foreground, text-foreground
 * - Borders via semantic: border-border
 * - Shadows via semantic: shadow-sm, shadow-md (mapped to elevation system)
 */
export const MetricsCardGrid = () => {
  // Fetch contacts
  const { data: contacts, isPending: contactsPending } = useGetList(
    "contacts",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: { "deleted_at@is": null },
    }
  );

  // Fetch organizations
  const { data: organizations, isPending: organizationsPending } = useGetList(
    "organizations",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: { "deleted_at@is": null },
    }
  );

  // Calculate 7 days ago for activity filtering
  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }, []);

  // Fetch activities from last 7 days
  const { data: activities, isPending: activitiesPending } = useGetList(
    "activities",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        "deleted_at@is": null,
        "activity_date@gte": sevenDaysAgo,
      },
    }
  );

  // Combined loading state
  const isPending = contactsPending || organizationsPending || activitiesPending;

  const metrics = useMemo((): MetricCard[] => {
    // Loading state - show zeros
    if (!contacts || !organizations || !activities) {
      return [
        { title: "Total Contacts", value: "0", icon: null, unit: "contacts" },
        { title: "Total Organizations", value: "0", icon: null, unit: "organizations" },
        { title: "Activities This Week", value: "0", icon: null, unit: "this week" },
      ];
    }

    // Calculate actual metrics
    return [
      {
        title: "Total Contacts",
        value: contacts.length,
        icon: <Users className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" aria-hidden="true" />,
        unit: "contacts",
      },
      {
        title: "Total Organizations",
        value: organizations.length,
        icon: <Building2 className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" aria-hidden="true" />,
        unit: "organizations",
      },
      {
        title: "Activities This Week",
        value: activities.length,
        icon: <Activity className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" aria-hidden="true" />,
        unit: "this week",
      },
    ];
  }, [contacts, organizations, activities]);

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6 w-full">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 md:h-44 lg:h-48 bg-card rounded-lg border border-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6 w-full">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} metric={metric} />
      ))}
    </div>
  );
};

/**
 * Individual metric card component
 *
 * iPad-First Responsive Sizing:
 * - Base (sm): 16px padding, compact text
 * - md (iPad landscape): 20px padding, balanced text
 * - lg+ (desktop): 24px padding, spacious layout
 *
 * Touch Targets:
 * - Icon container: 44x44px (sm), 48x48px (md), 52x52px (lg)
 * - All interactive areas meet 44px minimum
 *
 * Semantic Colors (NO inline CSS variables):
 * - Title: text-muted-foreground (warm gray)
 * - Value: text-foreground (darkest text)
 * - Unit: text-muted-foreground (secondary)
 * - Border: border-border (1px hairline)
 * - Shadow: shadow-sm (elevation-1), hover:shadow-md (elevation-2)
 */
interface MetricCardProps {
  metric: MetricCard;
}

const MetricCard = ({ metric }: MetricCardProps) => {
  return (
    <Card className="rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6 flex flex-col justify-between h-40 md:h-44 lg:h-48 transition-shadow duration-200 hover:shadow-md active:shadow-sm">
      {/* Header: Icon + Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs md:text-sm lg:text-base font-semibold text-muted-foreground tracking-wide uppercase">
            {metric.title}
          </h3>
        </div>

        {/* Icon Container - 44x44px minimum touch target (Apple HIG) */}
        <div className="flex-shrink-0 w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-md flex items-center justify-center text-muted-foreground opacity-75 flex-center">
          {metric.icon}
        </div>
      </div>

      {/* Main Value - Large, prominent metric number */}
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl md:text-3xl lg:text-4xl font-bold tabular-nums text-foreground leading-none">
          {metric.value}
        </span>
        {metric.unit && (
          <span className="text-xs md:text-sm lg:text-base text-muted-foreground font-normal ml-1">
            {metric.unit}
          </span>
        )}
      </div>

      {/* Optional trend indicator */}
      {metric.trend !== undefined && (
        <div
          className={`text-xs md:text-sm mt-2 font-medium ${
            metric.trend > 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {metric.trend > 0 ? "↑" : "↓"} {Math.abs(metric.trend)}%{" "}
          {metric.trendLabel && `(${metric.trendLabel})`}
        </div>
      )}
    </Card>
  );
};

export default MetricsCardGrid;
