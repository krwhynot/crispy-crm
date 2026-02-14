import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useChartTheme } from "../hooks/useChartTheme";
import type { TooltipContextX } from "./chartUtils";
import { createBaseChartOptions, createAxisConfig } from "./chartUtils";
import "./chartSetup";

interface PipelineChartProps {
  data: Array<{ stage: string; count: number }>;
  onBarClick?: (stage: string) => void;
  showDrilldownLinks?: boolean;
}

/**
 * Pipeline Chart
 *
 * Horizontal bar chart showing opportunity distribution by stage.
 * Replaces the previous Doughnut for better readability and comparison.
 * Sorted descending by count for quick visual scanning.
 */
export function PipelineChart({ data, onBarClick, showDrilldownLinks = true }: PipelineChartProps) {
  const { colors, font } = useChartTheme();

  // Sort descending by count for visual hierarchy
  const sortedData = useMemo(() => [...data].sort((a, b) => b.count - a.count), [data]);

  const total = useMemo(() => sortedData.reduce((sum, d) => sum + d.count, 0), [sortedData]);

  // Chart palette — one color per stage bar
  const chartPalette = useMemo(
    () => [
      colors.chart1,
      colors.chart2,
      colors.chart3,
      colors.chart4,
      colors.chart5,
      colors.chart6,
      colors.chart7,
    ],
    [
      colors.chart1,
      colors.chart2,
      colors.chart3,
      colors.chart4,
      colors.chart5,
      colors.chart6,
      colors.chart7,
    ]
  );

  const chartData = useMemo(() => {
    return {
      labels: sortedData.map((d) => d.stage),
      datasets: [
        {
          id: "pipeline-stages",
          label: "Opportunities",
          data: sortedData.map((d) => d.count),
          backgroundColor: sortedData.map((_, i) => chartPalette[i % chartPalette.length]),
          borderRadius: 4,
        },
      ],
    };
  }, [sortedData, chartPalette]);

  const ariaLabel = useMemo(() => {
    const breakdown = sortedData.map((d) => `${d.stage}: ${d.count}`).join(", ");
    return `Pipeline chart showing ${total} opportunities across ${sortedData.length} stages. ${breakdown}`;
  }, [sortedData, total]);

  const options = useMemo(() => {
    return {
      ...createBaseChartOptions(colors, font),
      indexAxis: "y" as const,
      onClick: (_event: unknown, elements: Array<{ index: number }>) => {
        if (elements.length > 0 && onBarClick) {
          const idx = elements[0].index;
          onBarClick(sortedData[idx].stage);
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipContextX) => {
              const count = context.parsed.x ?? 0;
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
              return `${count} opportunities (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: createAxisConfig(colors, font, { beginAtZero: true, stepSize: 1 }),
        y: createAxisConfig(colors, font, { display: false }),
      },
    };
  }, [colors, font, total, onBarClick, sortedData]);

  // Limit drilldown links to max 7 items
  const drilldownItems = useMemo(() => sortedData.slice(0, 7), [sortedData]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No pipeline data available
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
          aria-label="Pipeline drill-down links"
        >
          {drilldownItems.map((item) => (
            <li key={item.stage}>
              <button
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5 h-auto"
                onClick={() => onBarClick?.(item.stage)}
              >
                {item.stage}: {item.count}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
