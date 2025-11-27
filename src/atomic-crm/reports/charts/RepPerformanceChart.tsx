import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
import type { TooltipTitleContext } from "./chartUtils";
import { truncateLabel } from "./chartUtils";
import "./chartSetup";

interface RepPerformanceChartProps {
  data: Array<{ name: string; activities: number; opportunities: number }>;
}

/**
 * Rep Performance Chart
 *
 * Grouped bar chart showing activities and opportunities per sales rep.
 * Helps managers compare team performance at a glance.
 */
export function RepPerformanceChart({ data }: RepPerformanceChartProps) {
  const { colors, font } = useChartTheme();

  // Memoize derived data - sort by total and take top 5
  const topData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.activities + b.opportunities - (a.activities + a.opportunities))
      .slice(0, 5);
  }, [data]);

  // Memoize chart data to prevent recalculation on every render
  const chartData = useMemo(() => {
    return {
      labels: topData.map((d) => truncateLabel(d.name, 15)),
      datasets: [
        {
          label: "Activities",
          data: topData.map((d) => d.activities),
          backgroundColor: colors.primary,
          borderRadius: 4,
        },
        {
          label: "Opportunities",
          data: topData.map((d) => d.opportunities),
          backgroundColor: colors.success,
          borderRadius: 4,
        },
      ],
    };
  }, [topData, colors.primary, colors.success]);

  // Memoize chart options to prevent recalculation on every render
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            font: {
              family: font.family,
              size: font.size,
            },
            usePointStyle: true,
            padding: 16,
          },
        },
        tooltip: {
          callbacks: {
            title: (context: TooltipTitleContext[]) => {
              const index = context[0].dataIndex;
              return topData[index]?.name || "";
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
  }, [topData, font]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No rep performance data available
      </div>
    );
  }

  return <Bar data={chartData} options={options} />;
}
