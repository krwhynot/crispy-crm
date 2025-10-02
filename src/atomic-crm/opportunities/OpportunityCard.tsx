import { ReferenceField } from "@/components/admin/reference-field";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRedirect } from "ra-core";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
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
      className="cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <Card className="py-2 transition-all duration-200 shadow-sm hover:shadow-md">
        <CardContent className="px-3 flex">
          <ReferenceField
            source="customer_organization_id"
            record={opportunity}
            reference="organizations"
            link={false}
          >
            <OrganizationAvatar width={16} height={16} />
          </ReferenceField>
          <div className="ml-2 flex-1">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs font-medium line-clamp-2">{opportunity.name}</p>
              <Badge
                variant={getPriorityVariant(opportunity.priority)}
                className="text-xs ml-1 px-1 py-0"
              >
                {opportunity.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-0.5">
              {opportunity.amount.toLocaleString("en-US", {
                notation: "compact",
                style: "currency",
                currency: "USD",
                currencyDisplay: "narrowSymbol",
                minimumSignificantDigits: 3,
              })}
              {opportunity.opportunity_context ? `, ${opportunity.opportunity_context}` : ""}
            </p>
            {opportunity.products && opportunity.products.length > 0 && (
              <p className="text-xs text-muted-foreground mb-0.5">
                Products: {opportunity.products.length === 1
                  ? opportunity.products[0].product_name
                  : `${opportunity.products[0].product_name} +${opportunity.products.length - 1} more`}
              </p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {opportunity.probability}%
              </span>
              {opportunity.principal_organization_id && (
                <Badge variant="outline" className="text-xs px-1 py-0">
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
