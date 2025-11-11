import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface StaleOpportunity {
  id: number;
  name: string;
  customer_organization_name?: string;
  lastActivityDate: string | null;
  daysInactive: number;
}

interface StaleLeadsViewProps {
  campaignName: string;
  threshold: number;
  staleOpportunities: StaleOpportunity[];
}

export const StaleLeadsView: React.FC<StaleLeadsViewProps> = ({
  campaignName,
  threshold,
  staleOpportunities,
}) => {
  const navigate = useNavigate();

  const formatLastActivity = (date: string | null): string => {
    if (!date) return "Never";
    return format(new Date(date), "MMM d, yyyy");
  };

  const getDaysInactiveDisplay = (days: number): string => {
    if (days >= 999999) return "Never contacted";
    return `${days} days`;
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          Stale Leads Report: {campaignName}
        </h3>
        <p className="text-sm text-muted-foreground">
          Showing {staleOpportunities.length} {staleOpportunities.length === 1 ? 'opportunity' : 'opportunities'} with no activity in the last {threshold} days
        </p>
      </div>

      {staleOpportunities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No stale leads found! All opportunities have been contacted within the last {threshold} days.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opportunities Requiring Follow-up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th scope="col" className="text-left py-3 px-3 font-semibold sticky left-0 bg-card">Opportunity</th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">Organization</th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">Last Activity</th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">Days Inactive</th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staleOpportunities.map((opp) => (
                    <tr key={opp.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-3 truncate max-w-xs sticky left-0 bg-card">
                        {opp.name || `Opportunity ${opp.id}`}
                      </td>
                      <td className="py-3 px-3 truncate max-w-xs">
                        {opp.customer_organization_name || "—"}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {formatLastActivity(opp.lastActivityDate)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={
                            opp.daysInactive >= 999999
                              ? "text-red-600 font-semibold"
                              : opp.daysInactive >= threshold * 2
                              ? "text-amber-600 font-semibold"
                              : "text-muted-foreground"
                          }
                        >
                          {getDaysInactiveDisplay(opp.daysInactive)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => navigate(`/opportunities/${opp.id}/show`)}
                          className="h-auto p-0 min-w-[44px] min-h-[44px]"
                          aria-label={`View opportunity ${opp.name || opp.id}`}
                        >
                          View Opportunity
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
