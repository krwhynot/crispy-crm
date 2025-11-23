import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
import { truncateLabel, TooltipContextX, TooltipTitleContext } from "./chartUtils";
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
  const theme = useChartTheme();

  // Color palette using available theme colors
  const colorPalette = [
    theme.colors.primary,
    theme.colors.brand700,
    theme.colors.success,
    theme.colors.warning,
    theme.colors.muted,
  ];

  // Take top 5 and sort descending
  const topData = [...data].sort((a, b) => b.count - a.count).slice(0, 5);

  const chartData = {
    labels: topData.map((d) => truncateLabel(d.name, 20)),
    datasets: [
      {
        label: "Opportunities",
        data: topData.map((d) => d.count),
        backgroundColor: topData.map((_, i) => colorPalette[i % colorPalette.length]),
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
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
            return `${context.parsed.x} opportunities`;
          },
 
  const topData = useMemo(() => {
    // Take top 5 and sort descending
    return [...data].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [data]);
 
  const chartData = useMemo(() => {
    // Color palette using available theme colors
    const colorPalette = [
      theme.colors.primary,
      theme.colors.brand700,
      theme.colors.success,
      theme.colors.warning,
      theme.colors.muted,
    ];
 
    return {
      labels: topData.map((d) => truncateLabel(d.name, 20)),
      datasets: [
        {
          label: "Opportunities",
          data: topData.map((d) => d.count),
          backgroundColor: topData.map((_, i) => colorPalette[i % colorPalette.length]),
          borderRadius: 4,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
      ],
    };
  }, [topData, theme]);
 
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y" as const,
      plugins: {
        legend: {
          display: false,
        },
        ticks: {
          font: {
            family: theme.font.family,
            size: theme.font.size,
        tooltip: {
          callbacks: {
            title: (context: TooltipTitleContext[]) => {
              // Show full name in tooltip
              const index = context[0].dataIndex;
              return topData[index]?.name || "";
            },
            label: (context: TooltipContextX) => {
              return `${context.parsed.x} opportunities`;
            },
          },
          stepSize: 1,
        },
      },
      y: {
        grid: {
          display: false,
      scales: {
        x: {
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
        ticks: {
          font: {
            family: theme.font.family,
            size: theme.font.size,
        y: {
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
      },
    },
  };
    };
  }, [topData, theme]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No principal data available
      </div>
    );
  }

  return <Bar data={chartData} options={options} />;
}
