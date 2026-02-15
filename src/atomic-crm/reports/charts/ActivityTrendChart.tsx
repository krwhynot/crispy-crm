import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
import type { TooltipContextY } from "./chartUtils";
import { createAxisConfig, createBaseChartOptions, withOklchAlpha } from "./chartUtils";
import "./chartSetup";

interface ActivityTrendChartProps {
  data: Array<{ date: string; count: number }>;
  onPointClick?: (date: string) => void;
}

/**
 * Activity Trend Chart
 *
 * Shows activity counts over time as a line chart.
 * Used in the Overview tab to visualize engagement trends.
 */
export function ActivityTrendChart({ data, onPointClick }: ActivityTrendChartProps) {
  const { colors, font } = useChartTheme();

  // Memoize chart data to prevent recalculation on every render
  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.date),
      datasets: [
        {
          id: "activities",
          label: "Activities",
          data: data.map((d) => d.count),
          borderColor: colors.chart4,
          backgroundColor: withOklchAlpha(colors.chart4, 0.14),
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHitRadius: 12,
        },
      ],
    };
  }, [data, colors.chart4]);

  const ariaLabel = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const dateRange =
      data.length > 0 ? `from ${data[0].date} to ${data[data.length - 1].date}` : "";
    return `Activity trend chart showing ${total} activities over ${data.length} time periods ${dateRange}`;
  }, [data]);

  // Memoize chart options to prevent recalculation on every render
  const options = useMemo(() => {
    return {
      ...createBaseChartOptions(colors, font),
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
      },
      onClick: (_event: unknown, elements: Array<{ index: number }>) => {
        if (elements.length > 0 && onPointClick) {
          const idx = elements[0].index;
          onPointClick(data[idx].date);
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipContextY) => {
              return `${context.parsed.y} activities`;
            },
          },
        },
      },
      scales: {
        x: createAxisConfig(colors, font, { display: false }),
        y: createAxisConfig(colors, font, { beginAtZero: true }),
      },
    };
  }, [font, colors, onPointClick, data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No activity data available
      </div>
    );
  }

  return (
    <Line data={chartData} options={options} datasetIdKey="id" aria-label={ariaLabel} role="img" />
  );
}
