import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminButton } from "@/components/admin/AdminButton";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { parseDateSafely } from "@/lib/date-utils";
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
  // Get stage summary
  const stageSummary = Object.entries(group.stageBreakdown)
    .toSorted(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([stage, count]) => `${stage}: ${count}`)
    .join(", ");

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
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
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left py-2 px-2 min-w-[200px]">Opportunity</th>
                  <th className="text-left py-2 px-2 min-w-[150px]">Organization</th>
                  <th className="text-left py-2 px-2 min-w-[120px]">Stage</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Close Date</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Sales Rep</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {group.opportunities.map((opp) => (
                  <tr key={opp.id} className="border-b hover:bg-accent/30 transition-colors">
                    <td className="py-2 px-2">
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
                    <td className="py-2 px-2">{opp.customer_organization_name || "-"}</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline">{opp.stage}</Badge>
                    </td>
                    <td className="py-2 px-2">
                      {opp.estimated_close_date && parseDateSafely(opp.estimated_close_date)
                        ? format(parseDateSafely(opp.estimated_close_date)!, "MMM dd, yyyy")
                        : "-"}
                    </td>
                    <td className="py-2 px-2">
                      {salesMap.get(opp.opportunity_owner_id!) || "Unassigned"}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpportunityClick(opp.id);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
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
