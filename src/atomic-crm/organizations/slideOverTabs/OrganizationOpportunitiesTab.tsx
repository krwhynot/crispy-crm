import { useEffect, useState } from "react";
import { useDataProvider, RecordContextProvider } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AsideSection } from "@/components/ui";
import { Target } from "lucide-react";
import type { OrganizationWithHierarchy } from "../../types";
import type { Identifier } from "ra-core";
import { getOpportunityStageLabel } from "../../opportunities/constants/stageConstants";
import { MAX_RELATED_ITEMS } from "../constants";

interface Opportunity {
  id: Identifier;
  name: string;
  stage: string;
  estimated_value?: number;
  estimated_close_date?: string;
  status?: string;
}

interface OrganizationOpportunitiesTabProps {
  record: OrganizationWithHierarchy;
}

export function OrganizationOpportunitiesTab({ record }: OrganizationOpportunitiesTabProps) {
  const dataProvider = useDataProvider();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // DEBUG: Log filter before dataProvider call
        const filterPayload = {
          $or: [
            { customer_organization_id: record.id },
            { principal_organization_id: record.id },
            { distributor_organization_id: record.id },
          ],
        };

        const result = await dataProvider.getList("opportunities", {
          filter: filterPayload,
          pagination: { page: 1, perPage: MAX_RELATED_ITEMS },
          sort: { field: "created_at", order: "DESC" },
        });
        setOpportunities(result.data as Opportunity[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load opportunities");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, [record.id, dataProvider]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (opportunities.length === 0) {
    return (
      <RecordContextProvider value={record}>
        <AsideSection title="Opportunities">
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="size-11 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No opportunities yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create opportunities from the Opportunities module.
              </p>
            </CardContent>
          </Card>
        </AsideSection>
      </RecordContextProvider>
    );
  }

  return (
    <RecordContextProvider value={record}>
      <div className="space-y-6">
        <AsideSection title={`Opportunities (${opportunities.length})`}>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {opportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="p-3 rounded-lg hover:bg-accent/5 transition-colors border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <a
                        href={`/opportunities?view=${opportunity.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/opportunities?view=${opportunity.id}`;
                        }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {opportunity.name}
                      </a>
                      <StageBadge stage={opportunity.stage} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {opportunity.estimated_value && (
                        <span>${opportunity.estimated_value.toLocaleString()}</span>
                      )}
                      {opportunity.estimated_close_date && (
                        <span>
                          Close: {new Date(opportunity.estimated_close_date).toLocaleDateString()}
                        </span>
                      )}
                      {opportunity.status && (
                        <Badge variant="outline" className="text-xs">
                          {opportunity.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AsideSection>
      </div>
    </RecordContextProvider>
  );
}

function StageBadge({ stage }: { stage: string }) {
  // Map PRD's 8 official stages to Badge variants
  const stageColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    new_lead: "outline",
    initial_outreach: "secondary",
    sample_visit_offered: "secondary",
    feedback_logged: "secondary",
    demo_scheduled: "default",
    closed_won: "default",
    closed_lost: "destructive",
  };

  const variant = stageColors[stage] || "outline";

  return (
    <Badge variant={variant} className="text-xs">
      {getOpportunityStageLabel(stage)}
    </Badge>
  );
}
