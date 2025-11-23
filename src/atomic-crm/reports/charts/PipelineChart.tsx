import { Doughnut } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
import "./chartSetup";

interface PipelineChartProps {
  data: Array<{ stage: string; count: number }>;
}

export function PipelineChart({ data }: PipelineChartProps) {
  const theme = useChartTheme();

  const chartData = {
    labels: data.map((d) => d.stage),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: [
          theme.colors.primary,
          theme.colors.brand700,
          theme.colors.brand600,
          theme.colors.success,
          theme.colors.warning,
          theme.colors.muted,
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          font: {
            family: theme.font.family,
            size: theme.font.size,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}
