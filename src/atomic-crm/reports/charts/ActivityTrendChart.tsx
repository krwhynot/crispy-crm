import { Line } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
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
  const theme = useChartTheme();

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Activities",
        data: data.map((d) => d.count),
        borderColor: theme.colors.primary,
        backgroundColor: `${theme.colors.primary}20`,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
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
            family: theme.font.family,
            size: theme.font.size,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            family: theme.font.family,
            size: theme.font.size,
          },
          stepSize: 1,
        },
      },
    },
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No activity data available
      </div>
    );
  }

  return <Line data={chartData} options={options} />;
}
