import { useListContext, RecordContextProvider } from "ra-core";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance, format } from "date-fns";
import type { Opportunity } from "../types";
import { getOpportunityStageLabel, getOpportunityStageColor } from "./stageConstants";

export const OpportunityRowListView = () => {
  const {
    data: opportunities,
    error,
    isPending,
    onToggleItem,
    selectedIds,
  } = useListContext<Opportunity>();

  if (isPending) {
    return <Skeleton className="w-full h-9" />;
  }

  if (error) {
    return null;
  }

  return (
    <Card className="bg-card border border-border shadow-sm rounded-xl p-2">
      <div className="space-y-2">
        {opportunities.map((opportunity) => (
          <RecordContextProvider key={opportunity.id} value={opportunity}>
            <div
              className="group relative flex items-center justify-between gap-3 rounded-lg border border-transparent bg-card px-3 py-1.5 transition-all duration-150 hover:border-border hover:shadow-md motion-safe:hover:-translate-y-0.5 active:scale-[0.98] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            >
              {/* Left cluster: Checkbox + Main Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Checkbox
                  checked={selectedIds.includes(opportunity.id)}
                  onCheckedChange={() => onToggleItem(opportunity.id)}
                  aria-label={`Select ${opportunity.name}`}
                  className="relative z-10 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  {/* Opportunity name as the semantic link with stretched overlay */}
                  <Link
                    to={`/opportunities/${opportunity.id}/show`}
                    className="font-medium text-sm text-primary hover:underline focus:outline-none block truncate"
                  >
                    {opportunity.name}
                    {/* Stretched link overlay: makes entire card clickable */}
                    <span className="absolute inset-0" aria-hidden="true" />
                  </Link>

                  {/* Second line: Customer → Principal relationship */}
                  <div className="text-xs text-[color:var(--text-subtle)] flex items-center gap-1 flex-wrap mt-0.5">
                    {opportunity.customer_organization_id && (
                      <>
                        <ReferenceField
                          source="customer_organization_id"
                          reference="organizations"
                          link={false}
                        >
                          <TextField source="name" className="font-medium" />
                        </ReferenceField>
                        <span className="opacity-60">→</span>
                      </>
                    )}
                    {opportunity.principal_organization_id && (
                      <ReferenceField
                        source="principal_organization_id"
                        reference="organizations"
                        link={false}
                      >
                        <TextField source="name" className="text-[color:var(--brand-600)]" />
                      </ReferenceField>
                    )}

                    {/* Interaction metrics */}
                    {(opportunity.nb_interactions !== undefined && opportunity.nb_interactions > 0) && (
                      <>
                        <span className="opacity-50 mx-0.5">·</span>
                        <span className="font-medium">
                          {opportunity.nb_interactions} interaction{opportunity.nb_interactions !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                    {opportunity.last_interaction_date && (
                      <>
                        <span className="opacity-50 mx-0.5">·</span>
                        <span className="opacity-75">
                          Last {formatDistance(new Date(opportunity.last_interaction_date), new Date(), { addSuffix: true })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right cluster: Stage, Priority, Close Date, Owner */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Stage Badge */}
                <Badge
                  className={`${getStageColor(opportunity.stage)} border-0 text-xs relative z-10`}
                >
                  {getOpportunityStageLabel(opportunity.stage)}
                </Badge>

                {/* Priority */}
                {opportunity.priority && (
                  <Badge
                    variant={
                      opportunity.priority === 'critical' ? 'destructive' :
                      opportunity.priority === 'high' ? 'default' :
                      opportunity.priority === 'medium' ? 'secondary' :
                      'outline'
                    }
                    className="text-xs relative z-10"
                  >
                    {opportunity.priority}
                  </Badge>
                )}

                {/* Close Date */}
                {opportunity.estimated_close_date && (
                  <div className="text-xs text-[color:var(--text-subtle)] relative z-10">
                    <span className="opacity-75">Close:</span>{' '}
                    <span className="font-medium">
                      {format(new Date(opportunity.estimated_close_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}

                {/* Owner */}
                {opportunity.opportunity_owner_id && (
                  <div className="text-xs text-[color:var(--text-subtle)] relative z-10">
                    <ReferenceField
                      source="opportunity_owner_id"
                      reference="sales"
                      link={false}
                    >
                      <span>
                        <TextField source="first_name" /> <TextField source="last_name" />
                      </span>
                    </ReferenceField>
                  </div>
                )}
              </div>
            </div>
          </RecordContextProvider>
        ))}
      </div>
    </Card>
  );
};