import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
import type { TooltipContextX, TooltipTitleContext } from "./chartUtils";
import { createAxisConfig, createBaseChartOptions, truncateLabel } from "./chartUtils";
import "./chartSetup";

interface TopPrincipalsChartProps {
  data: Array<{ name: string; count: number; id?: number }>;
  onBarClick?: (principalName: string, principalId?: number) => void;
  showDrilldownLinks?: boolean;
}

/**
 * Top Principals Chart
 *
 * Horizontal bar chart showing principals with most opportunities.
 * Limited to top 5 principals for readability.
 */
export function TopPrincipalsChart({
  data,
  onBarClick,
  showDrilldownLinks = true,
}: TopPrincipalsChartProps) {
  const { colors, font } = useChartTheme();

  // Memoize derived data to prevent unnecessary recalculations
  const topData = useMemo(() => {
    // Take top 5 and sort descending
    return data.toSorted((a, b) => b.count - a.count).slice(0, 5);
  }, [data]);

  // Memoize chart data to prevent recalculation on every render
  const chartData = useMemo(() => {
    // Color palette using design system chart tokens
    const colorPalette = [
      colors.chart1,
      colors.chart2,
      colors.chart3,
      colors.chart4,
      colors.chart5,
    ];

    return {
      labels: topData.map((d) => truncateLabel(d.name, 20)),
      datasets: [
        {
          id: "opportunities",
          label: "Opportunities",
          data: topData.map((d) => d.count),
          backgroundColor: topData.map((_, i) => colorPalette[i % colorPalette.length]),
          borderRadius: 4,
        },
      ],
    };
  }, [topData, colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5]);

  const ariaLabel = useMemo(() => {
    const total = topData.reduce((sum, d) => sum + d.count, 0);
    const breakdown = topData.map((d) => `${d.name}: ${d.count}`).join(", ");
    return `Top principals chart showing ${total} opportunities across ${topData.length} principals. ${breakdown}`;
  }, [topData]);

  const total = useMemo(() => topData.reduce((sum, d) => sum + d.count, 0), [topData]);

  // Memoize chart options to prevent recalculation on every render
  const options = useMemo(() => {
    return {
      ...createBaseChartOptions(colors, font),
      indexAxis: "y" as const,
      onClick: (_event: unknown, elements: Array<{ index: number }>) => {
        if (elements.length > 0 && onBarClick) {
          const idx = elements[0].index;
          const item = topData[idx];
          onBarClick(item.name, item.id);
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: (context: TooltipTitleContext[]) => {
              // Show full name in tooltip
              const index = context[0].dataIndex;
              return topData[index]?.name || "";
            },
            label: (context: TooltipContextX) => {
              const count = context.parsed.x ?? 0;
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
              return `${count} opportunities (${pct}% of total)`;
            },
          },
        },
      },
      scales: {
        x: createAxisConfig(colors, font, { beginAtZero: true, stepSize: 1 }),
        y: createAxisConfig(colors, font, { display: false }),
      },
    };
  }, [topData, font, colors, total, onBarClick]);

  // Limit drilldown links to top 5
  const drilldownItems = useMemo(() => topData.slice(0, 5), [topData]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No principal data available
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
          aria-label="Top principals drill-down links"
        >
          {drilldownItems.map((item) => (
            <li key={item.name}>
              <button
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5 h-auto"
                onClick={() => onBarClick?.(item.name, item.id)}
              >
                {item.name}: {item.count}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
