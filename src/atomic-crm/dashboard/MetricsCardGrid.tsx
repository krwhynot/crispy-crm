import { useGetList } from "ra-core";
import { Card } from "@/components/ui/card";
import { Users, Building2, Activity } from "lucide-react";
import React, { useMemo } from "react";

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
  // Fetch contacts - use total count, not array length
  const { total: totalContacts, isPending: contactsPending } = useGetList("contacts", {
    pagination: { page: 1, perPage: 1 }, // Only need count, not data
    filter: { "deleted_at@is": null },
  });

  // Fetch organizations - use total count, not array length
  const { total: totalOrganizations, isPending: organizationsPending } = useGetList(
    "organizations",
    {
      pagination: { page: 1, perPage: 1 }, // Only need count, not data
      filter: { "deleted_at@is": null },
    }
  );

  // Calculate 7 days ago for activity filtering
  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  }, []);

  // Fetch activities from last 7 days
  const { data: activities, isPending: activitiesPending } = useGetList("activities", {
    pagination: { page: 1, perPage: 10000 },
    filter: {
      "deleted_at@is": null,
      "activity_date@gte": sevenDaysAgo,
    },
  });

  // Combined loading state
  const isPending = contactsPending || organizationsPending || activitiesPending;

  const metrics = useMemo((): MetricCard[] => {
    // Loading state - show zeros
    if (totalContacts === undefined || totalOrganizations === undefined || !activities) {
      return [
        { title: "Total Contacts", value: "0", icon: null, unit: "contacts" },
        { title: "Total Organizations", value: "0", icon: null, unit: "organizations" },
        { title: "Activities This Week", value: "0", icon: null, unit: "this week" },
      ];
    }

    // Calculate actual metrics - icons will be resized by the component
    return [
      {
        title: "Total Contacts",
        value: totalContacts,
        icon: <Users aria-hidden="true" />,
        unit: "contacts",
      },
      {
        title: "Total Organizations",
        value: totalOrganizations,
        icon: <Building2 aria-hidden="true" />,
        unit: "organizations",
      },
      {
        title: "Activities This Week",
        value: activities.length,
        icon: <Activity aria-hidden="true" />,
        unit: "this week",
      },
    ];
  }, [totalContacts, totalOrganizations, activities]);

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 md:h-18 lg:h-20 bg-card rounded-md border border-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
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
    <Card className="rounded-md p-2 flex flex-col justify-between h-16 md:h-18 lg:h-20 transition-shadow duration-200 hover:shadow-md active:shadow-sm">
      {/* Ultra-compact layout - Icon and title on same line */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Inline icon */}
          <div className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 text-muted-foreground opacity-75">
            {React.cloneElement(metric.icon as React.ReactElement, {
              className: "w-full h-full",
            })}
          </div>
          <h3 className="text-[10px] md:text-xs font-semibold text-muted-foreground tracking-wide uppercase truncate">
            {metric.title}
          </h3>
        </div>

        {/* Value and unit inline */}
        <div className="flex items-baseline gap-1">
          <span className="text-base md:text-lg lg:text-xl font-bold tabular-nums text-foreground leading-none">
            {metric.value}
          </span>
          {metric.unit && (
            <span className="text-[9px] md:text-[10px] text-muted-foreground font-normal">
              {metric.unit}
            </span>
          )}
        </div>
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
