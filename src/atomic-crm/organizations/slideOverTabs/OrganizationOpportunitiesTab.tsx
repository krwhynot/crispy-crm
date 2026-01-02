import { useGetList, RecordContextProvider } from "ra-core";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidepaneEmptyState, EMPTY_STATE_CONTENT } from "@/components/layouts/sidepane";
import type { OrganizationWithHierarchy } from "../../types";
import type { Identifier } from "ra-core";
import { getOpportunityStageLabel } from "../../opportunities/constants/stageConstants";
import { MAX_RELATED_ITEMS } from "../constants";
import { parseDateSafely } from "@/lib/date-utils";

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
  const navigate = useNavigate();
  const {
    data: opportunities = [],
    isLoading,
    error,
  } = useGetList<Opportunity>(
    "opportunities",
    {
      filter: {
        $or: [
          { customer_organization_id: record.id },
          { principal_organization_id: record.id },
          { distributor_organization_id: record.id },
        ],
      },
      pagination: { page: 1, perPage: MAX_RELATED_ITEMS },
      sort: { field: "created_at", order: "DESC" },
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const errorMessage = error ? String(error) : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="px-6 py-4">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <SidepaneEmptyState
        title={EMPTY_STATE_CONTENT.opportunities.title}
        description={EMPTY_STATE_CONTENT.opportunities.description}
      />
    );
  }

  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4 space-y-3">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <button
                  type="button"
                  onClick={() => navigate(`/opportunities?view=${opportunity.id}`)}
                  className="text-sm font-medium text-primary hover:underline text-left"
                >
                  {opportunity.name}
                </button>
                <StageBadge stage={opportunity.stage} />
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {opportunity.estimated_value && (
                  <span>${opportunity.estimated_value.toLocaleString()}</span>
                )}
                {opportunity.estimated_close_date && (
                  <span>
                    Close:{" "}
                    {parseDateSafely(opportunity.estimated_close_date)?.toLocaleDateString() ??
                      "N/A"}
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
      </ScrollArea>
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
