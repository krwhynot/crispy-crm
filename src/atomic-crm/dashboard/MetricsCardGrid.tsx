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
 * Layout strategy:
 * - iPad Portrait: 1 column (full width)
 * - iPad Landscape: 3 columns (optimal for touch)
 * - Desktop: 3 columns with larger font sizes
 *
 * Touch targets: 44x44px minimum (Apple HIG)
 * Card height: 160px (iPad optimized)
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

    const wonRevenue = won.reduce((sum, opp) => sum + (opp.amount || 0), 0);

    return [
      {
        title: "Total Opportunities",
        value: opportunities.length,
        icon: <Target className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />,
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
        icon: <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />,
        unit: `${active.length} active`,
      },
      {
        title: "Win Rate",
        value: `${winRate}%`,
        icon: <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />,
        unit: `${won.length}/${closed} closed`,
      },
    ];
  }, [opportunities]);

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 sm:h-44 md:h-48 bg-card rounded-lg border border-[color:var(--stroke-card)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} metric={metric} />
      ))}
    </div>
  );
};

/**
 * Individual metric card component
 *
 * Responsive sizing:
 * - Base: touch-friendly padding (16px)
 * - sm: slightly larger (20px)
 * - md: desktop comfortable (24px)
 *
 * Text scaling follows viewport size
 */
interface MetricCardProps {
  metric: MetricCard;
}

const MetricCard = ({ metric }: MetricCardProps) => {
  return (
    <Card className="rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 flex flex-col justify-between h-40 sm:h-44 md:h-48 transition-all duration-200 hover:shadow-[var(--elevation-2)] active:shadow-[var(--elevation-0)]">
      {/* Header: Icon + Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm md:text-base font-medium text-[color:var(--text-subtle)] tracking-wide uppercase">
            {metric.title}
          </h3>
        </div>

        {/* Icon - touch target area */}
        <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-md flex items-center justify-center text-[color:var(--text-subtle)] opacity-80">
          {metric.icon}
        </div>
      </div>

      {/* Main Value - Large, prominent text */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums text-[color:var(--text-metric)] leading-none">
          {metric.value}
        </span>
        {metric.unit && (
          <span className="text-xs sm:text-sm md:text-base text-[color:var(--text-subtle)] font-normal ml-1">
            {metric.unit}
          </span>
        )}
      </div>

      {/* Optional trend indicator */}
      {metric.trend !== undefined && (
        <div
          className={`text-xs sm:text-sm mt-2 font-medium ${
            metric.trend > 0
              ? "text-[color:var(--success)]"
              : "text-[color:var(--destructive)]"
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
