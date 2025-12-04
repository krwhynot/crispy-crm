import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
import type { TooltipContextY } from "./chartUtils";
import "./chartSetup";

interface ActivityTrendChartProps {
  data: Array<{ date: string; count: number }>;
}

/**
 * Activity Trend Chart
 *
 * Shows activity counts over time as a line chart.
 * Used in the Overview tab to visualize engagement trends.
 */
export function ActivityTrendChart({ data }: ActivityTrendChartProps) {
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
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}20`,
          fill: true,
          tension: 0.3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHitRadius: 12,
        },
      ],
    };
  }, [data, colors.primary]);

  const ariaLabel = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const dateRange = data.length > 0 ? `from ${data[0].date} to ${data[data.length - 1].date}` : '';
    return `Activity trend chart showing ${total} activities over ${data.length} time periods ${dateRange}`;
  }, [data]);

  // Memoize chart options to prevent recalculation on every render
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
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
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: font.family,
              size: font.size,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "var(--chart-gridline)",
          },
          ticks: {
            font: {
              family: font.family,
              size: font.size,
            },
            stepSize: 1,
          },
        },
      },
    };
  }, [font]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No activity data available
      </div>
    );
  }

  return (
    <Line
      data={chartData}
      options={options}
      datasetIdKey="id"
      aria-label={ariaLabel}
      role="img"
    />
  );
}
