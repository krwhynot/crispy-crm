import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
import "./chartSetup";

interface PipelineChartProps {
  data: Array<{ stage: string; count: number }>;
}

/**
 * Pipeline Chart
 *
 * Doughnut chart showing opportunity distribution by stage.
 * Used in the Overview tab to visualize pipeline health.
 */
export function PipelineChart({ data }: PipelineChartProps) {
  const { colors, font } = useChartTheme();

  // Memoize chart data to prevent recalculation on every render
  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.stage),
      datasets: [
        {
          data: data.map((d) => d.count),
          backgroundColor: [
            colors.primary,
            colors.brand700,
            colors.brand600,
            colors.success,
            colors.warning,
            colors.muted,
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [data, colors]);

  // Memoize chart options to prevent recalculation on every render
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right" as const,
          labels: {
            font: {
              family: font.family,
              size: font.size,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: { dataset: { data: number[] }; parsed: number; label: string }) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            },
          },
        },
      },
    };
  }, [font]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No pipeline data available
      </div>
    );
  }

  return <Doughnut data={chartData} options={options} />;
}
