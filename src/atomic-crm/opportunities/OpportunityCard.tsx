import { ReferenceField } from "@/components/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Draggable } from "@hello-pangea/dnd";
import { useRedirect } from "ra-core";
import { CompanyAvatar } from "../companies/CompanyAvatar";
import type { Opportunity } from "../types";

export const OpportunityCard = ({ opportunity, index }: { opportunity: Opportunity; index: number }) => {
  if (!opportunity) return null;

  return (
    <Draggable draggableId={String(opportunity.id)} index={index}>
      {(provided, snapshot) => (
        <OpportunityCardContent provided={provided} snapshot={snapshot} opportunity={opportunity} />
      )}
    </Draggable>
  );
};

export const OpportunityCardContent = ({
  provided,
  snapshot,
  opportunity,
}: {
  provided?: any;
  snapshot?: any;
  opportunity: Opportunity;
}) => {
  const redirect = useRedirect();
  const handleClick = () => {
    redirect(`/opportunities/${opportunity.id}/show`, undefined, undefined, undefined, {
      _scrollToTop: false,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div
      className="cursor-pointer"
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <Card
        className={`py-4 transition-all duration-200 ${
          snapshot?.isDragging
            ? "opacity-90 transform rotate-1 shadow-lg"
            : "shadow-sm hover:shadow-md"
        }`}
      >
        <CardContent className="px-4 flex">
          <ReferenceField
            source="customer_organization_id"
            record={opportunity}
            reference="companies"
            link={false}
          >
            <CompanyAvatar width={20} height={20} />
          </ReferenceField>
          <div className="ml-3 flex-1">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium">{opportunity.name}</p>
              <Badge variant={getPriorityVariant(opportunity.priority)} className="text-xs">
                {opportunity.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              {opportunity.amount.toLocaleString("en-US", {
                notation: "compact",
                style: "currency",
                currency: "USD",
                currencyDisplay: "narrowSymbol",
                minimumSignificantDigits: 3,
              })}
              {opportunity.category ? `, ${opportunity.category}` : ""}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {opportunity.probability}% probability
              </span>
              {opportunity.principal_organization_id && (
                <Badge variant="outline" className="text-xs">
                  Principal
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};