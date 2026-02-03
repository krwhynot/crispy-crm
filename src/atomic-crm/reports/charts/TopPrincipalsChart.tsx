import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
import type { TooltipContextX, TooltipTitleContext } from "./chartUtils";
import { truncateLabel } from "./chartUtils";
import "./chartSetup";

interface TopPrincipalsChartProps {
  data: Array<{ name: string; count: number }>;
}

/**
 * Top Principals Chart
 *
 * Horizontal bar chart showing principals with most opportunities.
 * Limited to top 5 principals for readability.
 */
export function TopPrincipalsChart({ data }: TopPrincipalsChartProps) {
  const { colors, font } = useChartTheme();

  // Memoize derived data to prevent unnecessary recalculations
  const topData = useMemo(() => {
    // Take top 5 and sort descending
    return data.toSorted((a, b) => b.count - a.count).slice(0, 5);
  }, [data]);

  // Memoize chart data to prevent recalculation on every render
  const chartData = useMemo(() => {
    // Color palette using available theme colors
    const colorPalette = [
      colors.primary,
      colors.brand700,
      colors.success,
      colors.warning,
      colors.muted,
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
  }, [topData, colors]);

  const ariaLabel = useMemo(() => {
    const total = topData.reduce((sum, d) => sum + d.count, 0);
    const breakdown = topData.map((d) => `${d.name}: ${d.count}`).join(", ");
    return `Top principals chart showing ${total} opportunities across ${topData.length} principals. ${breakdown}`;
  }, [topData]);

  // Memoize chart options to prevent recalculation on every render
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y" as const,
      interaction: {
        mode: "nearest" as const,
        intersect: false,
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
              return `${context.parsed.x ?? 0} opportunities`;
            },
          },
        },
      },
      scales: {
        x: {
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
        y: {
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
      },
    };
  }, [topData, font]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No principal data available
      </div>
    );
  }

  return (
    <Bar data={chartData} options={options} datasetIdKey="id" aria-label={ariaLabel} role="img" />
  );
}
