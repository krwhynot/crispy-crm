import { useGetList } from "ra-core";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Opportunity } from "../types";
import { DashboardWidget } from "./DashboardWidget";

/**
 * PipelineByStage Widget
 *
 * Visual representation of the sales pipeline showing opportunity distribution across stages.
 * - Fetches active opportunities
 * - Groups by stage
 * - Renders horizontal bar chart
 * - Click bar navigates to opportunities filtered by that stage
 * - Responsive on iPad/desktop
 * - Uses semantic colors from design system
 *
 * Engineering Constitution compliance:
 * - Uses semantic CSS variables for colors (--primary, --brand-500, etc.)
 * - Fail fast error handling via DashboardWidget
 * - No over-engineering: simple data grouping in JavaScript
 */
export const PipelineByStage = () => {
  const navigate = useNavigate();
  const { opportunityStages } = useConfigurationContext();

  const {
    data: opportunities,
    isPending,
    error,
    refetch,
  } = useGetList<Opportunity>("opportunities", {
    pagination: { page: 1, perPage: 10000 },
    filter: {
      status: "active",
      "deleted_at@is": null,
    },
  });

  // Group opportunities by stage
  const chartData = useMemo(() => {
    if (!opportunities) return [];

    // Count opportunities by stage
    const stageCounts = new Map<string, number>();

    opportunities.forEach((opp) => {
      const stage = opp.stage || "unknown";
      stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);
    });

    // Map stage counts to chart data with labels
    return opportunityStages.map((stageConfig) => {
      const count = stageCounts.get(stageConfig.value) || 0;
      return {
        stage: stageConfig.value,
        label: stageConfig.label,
        count,
      };
    });
  }, [opportunities, opportunityStages]);

  // Calculate total for percentage display
  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.count, 0),
    [chartData]
  );

  // Handle bar click - navigate to opportunities filtered by stage
  const handleBarClick = (data: { stage: string }) => {
    navigate(
      `/opportunities?filter=${encodeURIComponent(
        JSON.stringify({
          stage: data.stage,
          status: "active",
          "deleted_at@is": null,
        })
      )}`
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-foreground">{data.label}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} {data.count === 1 ? "opportunity" : "opportunities"} ({percentage}%)
          </p>
          <p className="text-xs text-muted-foreground mt-1">Click to filter</p>
        </div>
      );
    }
    return null;
  };

  // Dynamic bar colors using semantic variables
  const getBarColor = (index: number) => {
    const colors = [
      "hsl(var(--brand-500))",    // Primary brand green
      "hsl(var(--brand-650))",    // Hover state green
      "hsl(var(--accent))",       // Clay orange
      "hsl(var(--accent-clay-600))", // Medium-dark clay
      "hsl(var(--brand-300))",    // Soft sage
      "hsl(var(--accent-clay-400))", // Light clay
      "hsl(var(--brand-700))",    // Darker emphasis
      "hsl(var(--accent-clay-700))", // Dark clay
    ];
    return colors[index % colors.length];
  };

  return (
    <DashboardWidget
      title="Pipeline by Stage"
      isLoading={isPending}
      error={error}
      onRetry={refetch}
      icon={<BarChart3 className="h-6 w-6 md:h-8 md:h-8" />}
      className="md:col-span-2 lg:col-span-2 max-h-[200px] md:max-h-[240px]"
    >
      <div className="w-full h-full flex items-center justify-center">
        {total === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No active opportunities</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={150}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                onClick={handleBarClick}
                cursor="pointer"
                data-testid="pipeline-bar"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardWidget>
  );
};

export default PipelineByStage;
