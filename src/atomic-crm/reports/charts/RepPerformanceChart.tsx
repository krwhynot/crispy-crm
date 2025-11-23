import { Bar } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
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
  const theme = useChartTheme();

  // Sort by total (activities + opportunities) and take top 5
  const topData = [...data]
    .sort((a, b) => b.activities + b.opportunities - (a.activities + a.opportunities))
    .slice(0, 5);

  const chartData = {
    labels: topData.map((d) => truncateLabel(d.name, 15)),
    datasets: [
      {
        label: "Activities",
        data: topData.map((d) => d.activities),
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
      },
      {
        label: "Opportunities",
        data: topData.map((d) => d.opportunities),
        backgroundColor: theme.colors.success,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            family: theme.font.family,
            size: theme.font.size,
          },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
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
        No rep performance data available
      </div>
    );
  }

  return <Bar data={chartData} options={options} />;
}

function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + "...";
}
