import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminButton } from "@/components/admin/AdminButton";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { parseDateSafely } from "@/lib/date-utils";
import { useScrollFadeRight } from "@/atomic-crm/reports/hooks";
import type { Opportunity } from "@/atomic-crm/types";

export interface PrincipalGroup {
  principalId: string | null;
  principalName: string;
  opportunities: Opportunity[];
  totalCount: number;
  stageBreakdown: Record<string, number>;
}

interface PrincipalGroupCardProps {
  group: PrincipalGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onOpportunityClick: (id: string | number) => void;
  salesMap: Map<string | number, string>;
}

export function PrincipalGroupCard({
  group,
  isExpanded,
  onToggle,
  onOpportunityClick,
  salesMap,
}: PrincipalGroupCardProps) {
  const scrollRef = useScrollFadeRight<HTMLDivElement>();
  // Get stage summary
  const stageSummary = Object.entries(group.stageBreakdown)
    .toSorted(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([stage, count]) => `${stage}: ${count}`)
    .join(", ");

  const principalGroupId = `principal-group-${group.principalId ?? "unknown"}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left cursor-pointer hover:bg-accent/50 transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={isExpanded}
          aria-controls={principalGroupId}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.principalName} with ${group.totalCount} ${group.totalCount === 1 ? "opportunity" : "opportunities"}`}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              )}
              <span>{group.principalName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {group.totalCount} {group.totalCount === 1 ? "opportunity" : "opportunities"}
              </Badge>
              {stageSummary && (
                <span className="text-sm text-muted-foreground hidden md:inline">
                  ({stageSummary})
                </span>
              )}
            </div>
          </CardTitle>
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent id={principalGroupId}>
          <div ref={scrollRef} className="overflow-x-auto scroll-fade-right">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-sm text-muted-foreground">
                  <th
                    scope="col"
                    className="text-left py-2 px-2 min-w-[200px] border-b sticky left-0 bg-card z-10 shadow-col-sticky"
                  >
                    Opportunity
                  </th>
                  <th scope="col" className="text-left py-2 px-2 min-w-[150px] border-b">
                    Organization
                  </th>
                  <th scope="col" className="text-left py-2 px-2 min-w-[120px] border-b">
                    Stage
                  </th>
                  <th scope="col" className="text-left py-2 px-2 min-w-[100px] border-b">
                    Close Date
                  </th>
                  <th scope="col" className="text-left py-2 px-2 min-w-[100px] border-b">
                    Sales Rep
                  </th>
                  <th scope="col" className="text-center py-2 px-2 min-w-[50px] border-b">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.opportunities.map((opp) => (
                  <tr key={opp.id} className="group hover:bg-accent/30 transition-colors">
                    <td className="py-2 px-2 border-b sticky left-0 bg-card z-10 shadow-col-sticky group-hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{opp.name}</span>
                        {opp.priority === "high" && (
                          <Badge variant="outline" className="text-xs bg-warning-light">
                            High
                          </Badge>
                        )}
                        {opp.priority === "critical" && (
                          <Badge variant="outline" className="text-xs bg-destructive-light">
                            Critical
                          </Badge>
                        )}
                        {opp.days_in_stage && opp.days_in_stage > 14 && (
                          <Badge variant="outline" className="text-xs">
                            {opp.days_in_stage} days
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 border-b">{opp.customer_organization_name || "-"}</td>
                    <td className="py-2 px-2 border-b">
                      <Badge variant="outline">{opp.stage}</Badge>
                    </td>
                    <td className="py-2 px-2 border-b">
                      {opp.estimated_close_date && parseDateSafely(opp.estimated_close_date)
                        ? format(parseDateSafely(opp.estimated_close_date)!, "MMM dd, yyyy")
                        : "-"}
                    </td>
                    <td className="py-2 px-2 border-b">
                      {salesMap.get(opp.opportunity_owner_id!) || "Unassigned"}
                    </td>
                    <td className="py-2 px-2 text-center border-b">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        aria-label="View opportunity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpportunityClick(opp.id);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
