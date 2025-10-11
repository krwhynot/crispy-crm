import { format, startOfMonth } from "date-fns";
import { DollarSign } from "lucide-react";
import { useGetList } from "ra-core";
import { lazy, memo, Suspense, useMemo } from "react";
import { Card } from "@/components/ui/card";

const ResponsiveBar = lazy(() =>
  import("@nivo/bar").then(module => ({ default: module.ResponsiveBar }))
);

import type { Opportunity } from "../types";

const multiplier: Record<string, number> = {
  new_lead: 0.1,
  initial_outreach: 0.2,
  sample_visit_offered: 0.3,
  awaiting_response: 0.25,
  feedback_logged: 0.5,
  demo_scheduled: 0.7,
};

const threeMonthsAgo = new Date(
  new Date().setMonth(new Date().getMonth() - 6),
).toISOString();

const DEFAULT_LOCALE = "en-US";
const CURRENCY = "USD";

const trackDashboardEvent = (cardType: string) => {
  console.log(`dashboard_card_click: ${cardType}`, {
    timestamp: new Date().toISOString(),
    viewport: window.innerWidth < 768 ? 'mobile' : 'desktop'
  });
};

export const OpportunitiesChart = memo(() => {
  const acceptedLanguages = navigator
    ? navigator.languages || [navigator.language]
    : [DEFAULT_LOCALE];

  const { data, isPending } = useGetList<Opportunity>("opportunities", {
    pagination: { perPage: 100, page: 1 },
    sort: {
      field: "created_at",
      order: "ASC",
    },
    filter: {
      "created_at@gte": threeMonthsAgo,
    },
  });
  const months = useMemo(() => {
    if (!data) return [];
    const opportunitiesByMonth = data.reduce((acc, opportunity) => {
      const month = startOfMonth(
        opportunity.created_at ?? new Date(),
      ).toISOString();
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(opportunity);
      return acc;
    }, {} as any);

    const amountByMonth = Object.keys(opportunitiesByMonth).map((month) => {
      return {
        date: format(month, "MMM"),
        won: opportunitiesByMonth[month]
          .filter(
            (opportunity: Opportunity) => opportunity.stage === "closed_won",
          )
          .reduce((acc: number, opportunity: Opportunity) => {
            acc += opportunity.amount;
            return acc;
          }, 0),
        pending: opportunitiesByMonth[month]
          .filter(
            (opportunity: Opportunity) =>
              !["closed_won", "closed_lost"].includes(opportunity.stage),
          )
          .reduce((acc: number, opportunity: Opportunity) => {
            const stageMultiplier = multiplier[opportunity.stage] || 0.1;
            acc += opportunity.amount * stageMultiplier;
            return acc;
          }, 0),
        lost: opportunitiesByMonth[month]
          .filter(
            (opportunity: Opportunity) => opportunity.stage === "closed_lost",
          )
          .reduce((acc: number, opportunity: Opportunity) => {
            acc -= opportunity.amount;
            return acc;
          }, 0),
      };
    });

    return amountByMonth;
  }, [data]);

  if (isPending) return null; // FIXME return skeleton instead
  const range = months.reduce(
    (acc, month) => {
      acc.min = Math.min(acc.min, month.lost);
      acc.max = Math.max(acc.max, month.won + month.pending);
      return acc;
    },
    { min: 0, max: 0 },
  );
  return (
    <Card
      className="bg-card border border-border shadow-sm rounded-xl p-4 cursor-pointer"
      onClick={() => trackDashboardEvent('chart')}
    >
      <div className="flex items-center mb-4">
        <div className="mr-3 flex">
          <DollarSign className="text-muted-foreground w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-muted-foreground">
          Upcoming Opportunity Revenue
        </h2>
      </div>
      <div className="h-[400px]">
        <Suspense fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Loading chart...</div>}>
          <ResponsiveBar
          data={months}
          indexBy="date"
          keys={["won", "pending", "lost"]}
          colors={[
            "var(--success-default)",
            "var(--info-default)",
            "var(--error-default)",
          ]}
          margin={{ top: 30, right: 50, bottom: 30, left: 0 }}
          padding={0.3}
          valueScale={{
            type: "linear",
            min: range.min * 1.2,
            max: range.max * 1.2,
          }}
          indexScale={{ type: "band", round: true }}
          enableGridX={true}
          enableGridY={false}
          enableLabel={false}
          tooltip={({ value, indexValue }) => (
            <div className="p-2 bg-secondary rounded shadow flex items-center gap-1 text-secondary-foreground">
              <strong>{indexValue}: </strong>
              {value > 0 ? "+" : ""}
              {value.toLocaleString(acceptedLanguages.at(0) ?? DEFAULT_LOCALE, {
                style: "currency",
                currency: CURRENCY,
              })}
            </div>
          )}
          axisTop={{
            tickSize: 0,
            tickPadding: 12,
            style: {
              ticks: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
              legend: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
            },
          }}
          axisBottom={{
            legendPosition: "middle",
            legendOffset: 50,
            tickSize: 0,
            tickPadding: 12,
            style: {
              ticks: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
              legend: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
            },
          }}
          axisLeft={null}
          axisRight={{
            format: (v: any) => `${Math.abs(v / 1000)}k`,
            tickValues: 8,
            style: {
              ticks: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
              legend: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
            },
          }}
          markers={
            [
              {
                axis: "y",
                value: 0,
                lineStyle: { strokeOpacity: 0 },
                textStyle: { fill: "var(--success-default)" },
                legend: "Won",
                legendPosition: "top-left",
                legendOrientation: "vertical",
              },
              {
                axis: "y",
                value: 0,
                lineStyle: {
                  stroke: "var(--error-default)",
                  strokeWidth: 1,
                },
                textStyle: { fill: "var(--error-default)" },
                legend: "Lost",
                legendPosition: "bottom-left",
                legendOrientation: "vertical",
              },
            ] as any
          }
          />
        </Suspense>
      </div>
    </Card>
  );
});
