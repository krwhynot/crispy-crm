import { useGetList } from "ra-core";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";
import type { Opportunity } from "../types";

export const MiniPipeline = () => {
  const { data, isPending } = useGetList<Opportunity>("opportunities", {
    pagination: { page: 1, perPage: 100 },
    filter: { "deleted_at@is": null },
  });

  const stageCounts = useMemo(() => {
    if (!data) return [];

    const active = data.filter(
      (opp) => !["closed_won", "closed_lost"].includes(opp.stage),
    ).length;

    const won = data.filter((opp) => opp.stage === "closed_won").length;
    const lost = data.filter((opp) => opp.stage === "closed_lost").length;

    return [
      { label: "Active Opportunities", count: active },
      { label: "Closed Won", count: won },
      { label: "Closed Lost", count: lost },
    ];
  }, [data]);

  if (isPending) return null;

  return (
    <Card className="bg-card border border-border shadow-sm rounded-xl p-4">
      <div className="flex items-center mb-3">
        <div className="mr-3 flex">
          <TrendingUp className="text-muted-foreground w-6 h-6" />
        </div>
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Pipeline
        </h2>
      </div>
      <div className="space-y-2">
        {stageCounts.map((stage) => (
          <div key={stage.label} className="flex items-center justify-between">
            <span className="text-sm">{stage.label}</span>
            <span className="text-sm font-medium">{stage.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
