import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
import type { TooltipTitleContext } from "./chartUtils";
import { createAxisConfig, createBaseChartOptions, truncateLabel } from "./chartUtils";
import "./chartSetup";

interface RepPerformanceChartProps {
  data: Array<{ name: string; activities: number; opportunities: number; id?: number }>;
  onBarClick?: (repName: string, repId?: number) => void;
  showDrilldownLinks?: boolean;
}

/**
 * Rep Performance Chart
 *
 * Grouped bar chart showing activities and opportunities per sales rep.
 * Helps managers compare team performance at a glance.
 */
export function RepPerformanceChart({
  data,
  onBarClick,
  showDrilldownLinks = true,
}: RepPerformanceChartProps) {
  const { colors, font } = useChartTheme();

  // Memoize derived data - sort by total and take top 5
  const topData = useMemo(() => {
    return data
      .toSorted((a, b) => b.activities + b.opportunities - (a.activities + a.opportunities))
      .slice(0, 5);
  }, [data]);

  // Memoize chart data to prevent recalculation on every render
  const chartData = useMemo(() => {
    return {
      labels: topData.map((d) => truncateLabel(d.name, 15)),
      datasets: [
        {
          id: "activities",
          label: "Activities",
          data: topData.map((d) => d.activities),
          backgroundColor: colors.chart2,
          borderRadius: 4,
        },
        {
          id: "opportunities",
          label: "Opportunities",
          data: topData.map((d) => d.opportunities),
          backgroundColor: colors.chart4,
          borderRadius: 4,
        },
      ],
    };
  }, [topData, colors.chart2, colors.chart4]);

  const ariaLabel = useMemo(() => {
    const totalActivities = topData.reduce((sum, d) => sum + d.activities, 0);
    const totalOpportunities = topData.reduce((sum, d) => sum + d.opportunities, 0);
    const breakdown = topData
      .map((d) => `${d.name}: ${d.activities} activities, ${d.opportunities} opportunities`)
      .join("; ");
    return `Rep performance chart showing ${topData.length} reps with ${totalActivities} total activities and ${totalOpportunities} total opportunities. ${breakdown}`;
  }, [topData]);

  // Memoize chart options to prevent recalculation on every render
  const options = useMemo(() => {
    return {
      ...createBaseChartOptions(colors, font),
      onClick: (_event: unknown, elements: Array<{ index: number }>) => {
        if (elements.length > 0 && onBarClick) {
          const idx = elements[0].index;
          const item = topData[idx];
          onBarClick(item.name, item.id);
        }
      },
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: colors.foreground,
            font: {
              family: font.family,
              size: 11,
            },
            usePointStyle: true,
            padding: 16,
          },
        },
        tooltip: {
          callbacks: {
            title: (context: TooltipTitleContext[]) => {
              const index = context[0].dataIndex;
              const item = topData[index];
              if (!item) return "";
              return `${item.name}: ${item.activities} activities, ${item.opportunities} opportunities`;
            },
            label: () => "",
          },
        },
      },
      scales: {
        x: createAxisConfig(colors, font, { display: false }),
        y: createAxisConfig(colors, font, { beginAtZero: true }),
      },
    };
  }, [topData, font, colors, onBarClick]);

  // Limit drilldown links to top 5
  const drilldownItems = useMemo(() => topData.slice(0, 5), [topData]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No rep performance data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 min-h-0">
        <Bar
          data={chartData}
          options={options}
          datasetIdKey="id"
          aria-label={ariaLabel}
          role="img"
        />
      </div>
      {showDrilldownLinks && drilldownItems.length > 0 && (
        <ul
          className="flex flex-wrap gap-2 mt-2 list-none p-0 m-0 shrink-0"
          aria-label="Rep performance drill-down links"
        >
          {drilldownItems.map((item) => (
            <li key={item.name}>
              <button
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5 h-auto"
                onClick={() => onBarClick?.(item.name, item.id)}
              >
                {item.name}: {item.activities}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
