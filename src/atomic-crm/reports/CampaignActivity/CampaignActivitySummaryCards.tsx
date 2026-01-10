import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CampaignActivitySummaryCardsProps {
  isLoadingActivities: boolean;
  totalActivities: number;
  uniqueOrgs: number;
  coverageRate: number;
  avgActivitiesPerLead: string;
}

export const CampaignActivitySummaryCards: React.FC<CampaignActivitySummaryCardsProps> = ({
  isLoadingActivities,
  totalActivities,
  uniqueOrgs,
  coverageRate,
  avgActivitiesPerLead,
}) => {
  if (isLoadingActivities) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalActivities}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Organizations Contacted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueOrgs}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Coverage Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{coverageRate}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Activities per Lead
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgActivitiesPerLead}</div>
        </CardContent>
      </Card>
    </>
  );
};
