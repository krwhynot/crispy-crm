import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { STAGE_STALE_THRESHOLDS } from "@/atomic-crm/utils/stalenessCalculation";
import { parseDateSafely } from "@/lib/date-utils";

/**
 * Stale opportunity with per-stage threshold info
 * Used by StaleLeadsView to display opportunities exceeding their stage-specific thresholds
 */
interface StaleOpportunity {
  id: number;
  name: string;
  stage?: string;
  customer_organization_name?: string;
  lastActivityDate: string | null;
  daysInactive: number;
  /** Per-stage threshold in days (undefined for closed stages) */
  stageThreshold?: number;
  /** Whether this opportunity is stale per its stage threshold */
  isStale: boolean;
}

interface StaleLeadsViewProps {
  campaignName: string;
  staleOpportunities: StaleOpportunity[];
}

export const StaleLeadsView: React.FC<StaleLeadsViewProps> = ({
  campaignName,
  staleOpportunities,
}) => {
  const navigate = useNavigate();

  const formatLastActivity = (date: string | null): string => {
    if (!date) return "Never";
    const dateObj = parseDateSafely(date);
    if (!dateObj) return "Never";
    return format(dateObj, "MMM d, yyyy");
  };

  /** Format stage name for display (e.g., "new_lead" -> "New Lead") */
  const formatStageName = (stage: string | undefined): string => {
    if (!stage) return "Unknown";
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  /** Get days over threshold for urgency display */
  const getDaysOverThreshold = (opp: StaleOpportunity): number => {
    if (!opp.stageThreshold) return 0;
    return Math.max(0, opp.daysInactive - opp.stageThreshold);
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Stale Leads Report: {campaignName}</h3>
        <p className="text-sm text-muted-foreground">
          Showing {staleOpportunities.length}{" "}
          {staleOpportunities.length === 1 ? "opportunity" : "opportunities"} exceeding per-stage
          activity thresholds (PRD Section 6.3)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Thresholds: New Lead {STAGE_STALE_THRESHOLDS.new_lead}d • Outreach/Sample/Demo{" "}
          {STAGE_STALE_THRESHOLDS.initial_outreach}d • Feedback{" "}
          {STAGE_STALE_THRESHOLDS.feedback_logged}d • Closed stages excluded
        </p>
      </div>

      {staleOpportunities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No stale leads found! All open opportunities are within their stage-specific activity
              thresholds.
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
                    <th
                      scope="col"
                      className="text-left py-3 px-3 font-semibold sticky left-0 bg-card"
                    >
                      Opportunity
                    </th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">
                      Organization
                    </th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">
                      Stage
                    </th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">
                      Last Activity
                    </th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">
                      Days Over Threshold
                    </th>
                    <th scope="col" className="text-center py-3 px-3 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staleOpportunities.map((opp) => {
                    const daysOver = getDaysOverThreshold(opp);
                    return (
                      <tr key={opp.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-3 truncate max-w-xs sticky left-0 bg-card">
                          {opp.name || `Opportunity ${opp.id}`}
                        </td>
                        <td className="py-3 px-3 truncate max-w-xs">
                          {opp.customer_organization_name || "—"}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge variant="outline" className="text-xs">
                            {formatStageName(opp.stage)}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({opp.stageThreshold}d threshold)
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {formatLastActivity(opp.lastActivityDate)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={
                              opp.daysInactive >= 999999
                                ? "text-destructive font-semibold"
                                : daysOver >= (opp.stageThreshold || 7)
                                  ? "text-destructive font-semibold"
                                  : daysOver >= Math.floor((opp.stageThreshold || 7) / 2)
                                    ? "text-warning font-semibold"
                                    : "text-muted-foreground"
                            }
                          >
                            {opp.daysInactive >= 999999
                              ? "Never contacted"
                              : `+${daysOver}d over (${opp.daysInactive}d inactive)`}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
