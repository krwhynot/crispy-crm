import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRedirect } from "ra-core";
import type { Opportunity } from "../types";

export const OpportunityCard = ({
  opportunity,
}: {
  opportunity: Opportunity;
}) => {
  if (!opportunity) return null;

  return <OpportunityCardContent opportunity={opportunity} />;
};

export const OpportunityCardContent = ({
  opportunity,
}: {
  opportunity: Opportunity;
}) => {
  const redirect = useRedirect();
  const handleClick = () => {
    redirect(
      `/opportunities/${opportunity.id}/show`,
      undefined,
      undefined,
      undefined,
      {
        _scrollToTop: false,
      },
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div
      className="cursor-pointer group rounded-lg"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <Card className="p-3 transition-[box-shadow,border-color,transform] duration-150 shadow-[var(--shadow-card-2)] group-hover:shadow-[var(--shadow-card-2-hover)] motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-[1.01] group-hover:border-[var(--primary)] group-focus-visible:shadow-[var(--shadow-card-2-hover)] motion-safe:group-focus-visible:-translate-y-0.5 motion-safe:group-focus-visible:scale-[1.01] group-focus-visible:border-[var(--primary)] group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-active:scale-[0.98] touch-manipulation border border-[var(--input)]">
        <CardContent className="flex flex-col gap-2">
          {/* Line 1: Opportunity Name */}
          <p
            className="text-sm font-semibold line-clamp-2 break-words leading-snug"
            title={opportunity.name}
            aria-label={opportunity.name}
          >
            {opportunity.name}
          </p>

          {/* Line 2: Customer Name */}
          <ReferenceField
            source="customer_organization_id"
            record={opportunity}
            reference="organizations"
            link={false}
          >
            <TextField
              source="name"
              className="text-xs text-[color:var(--text-subtle)] line-clamp-1"
            />
          </ReferenceField>

          {/* Line 3: Product Name */}
          {opportunity.principal_organization_id && (
            <ReferenceField
              source="principal_organization_id"
              record={opportunity}
              reference="organizations"
              link={false}
            >
              <TextField
                source="name"
                className="text-xs text-[color:var(--text-subtle)] line-clamp-1"
              />
            </ReferenceField>
          )}

          {/* Line 4: Priority */}
          <Badge
            variant={getPriorityVariant(opportunity.priority)}
            className="text-xs px-2 py-0.5 capitalize w-fit"
          >
            {opportunity.priority}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
