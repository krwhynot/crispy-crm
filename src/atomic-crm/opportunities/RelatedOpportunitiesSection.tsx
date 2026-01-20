import { Link } from "react-router-dom";
import { useGetList, useGetOne } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowRight } from "lucide-react";
import type { Opportunity } from "../types";
import { STAGE } from "@/atomic-crm/opportunities/constants/stageConstants";

interface RelatedOpportunitiesSectionProps {
  opportunity: Opportunity;
}

/**
 * Displays related opportunities section on opportunity detail page.
 * Shows:
 * - Parent opportunity (if related_opportunity_id exists)
 * - Child opportunities (opportunities that reference this one)
 */
export const RelatedOpportunitiesSection = ({ opportunity }: RelatedOpportunitiesSectionProps) => {
  // Fetch parent opportunity if this is a related/child opportunity
  const { data: parentOpportunity } = useGetOne<Opportunity>(
    "opportunities",
    { id: opportunity.related_opportunity_id || 0 },
    { enabled: !!opportunity.related_opportunity_id }
  );

  // Fetch child opportunities (opportunities that reference this one)
  const { data: childOpportunities } = useGetList<Opportunity>("opportunities", {
    filter: { related_opportunity_id: opportunity.id, "deleted_at@is": null },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "created_at", order: "DESC" },
  });

  // Only render if there's a parent or children
  if (!parentOpportunity && (!childOpportunities || childOpportunities.length === 0)) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-base font-semibold text-foreground">Related Opportunities</h3>

      {/* Parent Opportunity */}
      {parentOpportunity && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tracking-wide uppercase">
              Parent Opportunity
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
            <Link
              to={`/opportunities/${parentOpportunity.id}/show`}
              className="flex-1 font-medium text-sm text-primary hover:underline flex items-center gap-2"
            >
              {parentOpportunity.name}
              <ExternalLink className="w-3 h-3" />
            </Link>
            <div className="flex items-center gap-2">
              {parentOpportunity.principal_organization_name && (
                <Badge variant="outline" className="text-xs">
                  {parentOpportunity.principal_organization_name}
                </Badge>
              )}
              <Badge
                variant={
                  parentOpportunity.stage === "closed_won"
                    ? "default"
                    : parentOpportunity.stage === "closed_lost"
                      ? "destructive"
                      : "secondary"
                }
                className="text-xs"
              >
                {parentOpportunity.stage?.replace(/_/g, " ")}
              </Badge>
              {parentOpportunity.status && (
                <Badge
                  variant={
                    parentOpportunity.status === "active"
                      ? "default"
                      : parentOpportunity.status === "completed"
                        ? "outline"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {parentOpportunity.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Child Opportunities */}
      {childOpportunities && childOpportunities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tracking-wide uppercase">
              Follow-up Opportunities ({childOpportunities.length})
            </span>
          </div>
          <div className="space-y-2">
            {childOpportunities.map((childOpp) => (
              <div
                key={childOpp.id}
                className="flex items-center gap-3 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Link
                  to={`/opportunities/${childOpp.id}/show`}
                  className="flex-1 font-medium text-sm text-primary hover:underline flex items-center gap-2"
                >
                  {childOpp.name}
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <div className="flex items-center gap-2">
                  {childOpp.principal_organization_name && (
                    <Badge variant="outline" className="text-xs">
                      {childOpp.principal_organization_name}
                    </Badge>
                  )}
                  <Badge
                    variant={
                      childOpp.stage === "closed_won"
                        ? "default"
                        : childOpp.stage === "closed_lost"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {childOpp.stage?.replace(/_/g, " ")}
                  </Badge>
                  {childOpp.status && (
                    <Badge
                      variant={
                        childOpp.status === "active"
                          ? "default"
                          : childOpp.status === "completed"
                            ? "outline"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {childOpp.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
