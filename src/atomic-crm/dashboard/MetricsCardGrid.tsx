import { useGetList } from "ra-core";
import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target } from "lucide-react";
import { useMemo } from "react";
import type { Opportunity } from "../types";

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
  const { data: opportunities, isPending } = useGetList<Opportunity>(
    "opportunities",
    {
      pagination: { page: 1, perPage: 1000 },
      filter: { "deleted_at@is": null },
    }
  );

  const metrics = useMemo((): MetricCard[] => {
    if (!opportunities) {
      return [
        { title: "Total Opportunities", value: "0", icon: null },
        { title: "Pipeline Revenue", value: "$0", icon: null },
        { title: "Win Rate", value: "0%", icon: null },
      ];
    }

    const active = opportunities.filter(
      (opp) => !["closed_won", "closed_lost"].includes(opp.stage)
    );

    const won = opportunities.filter((opp) => opp.stage === "closed_won");
    const lost = opportunities.filter((opp) => opp.stage === "closed_lost");
    const closed = won.length + lost.length;

    const totalRevenue = active.reduce((sum, opp) => sum + (opp.amount || 0), 0);

    const winRate =
      closed > 0 ? Math.round((won.length / closed) * 100) : 0;

    return [
      {
        title: "Total Opportunities",
        value: opportunities.length,
        icon: <Target className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" />,
        unit: "open",
      },
      {
        title: "Pipeline Revenue",
        value: totalRevenue.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
        icon: <DollarSign className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" />,
        unit: `${active.length} active`,
      },
      {
        title: "Win Rate",
        value: `${winRate}%`,
        icon: <TrendingUp className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" />,
        unit: `${won.length}/${closed} closed`,
      },
    ];
  }, [opportunities]);

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
