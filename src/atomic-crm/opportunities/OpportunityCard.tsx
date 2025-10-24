import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { useRedirect, useUpdate, useNotify, useRefresh } from "ra-core";
import type { Opportunity } from "../types";
import { OPPORTUNITY_STAGES, getOpportunityStageLabel } from "./stageConstants";

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
  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();

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

  const handleMoveToStage = async (
    event: React.MouseEvent,
    newStage: string,
  ) => {
    event.stopPropagation();
    try {
      await update(
        "opportunities",
        {
          id: opportunity.id,
          data: { stage: newStage },
          previousData: opportunity,
        },
        {
          onSuccess: () => {
            notify(`Moved to ${getOpportunityStageLabel(newStage)}`, {
              type: "success",
            });
            refresh();
          },
          onError: () => {
            notify("Error moving opportunity", { type: "error" });
          },
        },
      );
    } catch (error) {
      notify("Error moving opportunity", { type: "error" });
    }
  };

  // Priority badge styling - follows urgency spectrum
  // Critical (red) → High (amber) → Medium (gray) → Low (outline)
  const getPriorityBadgeProps = (priority: string) => {
    switch (priority) {
      case "critical":
        return { variant: "destructive" as const, className: "" };
      case "high":
        return {
          variant: "default" as const,
          className: "border-transparent bg-[var(--warning-default)] text-white hover:bg-[var(--warning-hover)]"
        };
      case "medium":
        return { variant: "secondary" as const, className: "" };
      case "low":
        return { variant: "outline" as const, className: "" };
      default:
        return { variant: "outline" as const, className: "" };
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
            variant={getPriorityBadgeProps(opportunity.priority).variant}
            className={`text-xs px-2 py-0.5 capitalize w-fit ${getPriorityBadgeProps(opportunity.priority).className}`}
          >
            {opportunity.priority}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
