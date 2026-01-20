import { format, formatDistanceToNow, isPast } from "date-fns";
import { useRecordContext } from "react-admin";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { ReferenceManyField } from "@/components/ra-wrappers/reference-many-field";
import { DateField } from "@/components/ra-wrappers/date-field";
import { EditButton } from "@/components/ra-wrappers/edit-button";
import { ShowButton } from "@/components/ra-wrappers/show-button";
import { Badge } from "@/components/ui/badge";
import { getPriorityVariant } from "@/components/ui/priority-badge";
import { AsideSection } from "@/components/ui";
import { ucFirst, formatFieldLabel } from "@/atomic-crm/utils";
import { TasksIterator } from "../tasks/TasksIterator";
import { SaleName } from "../sales/SaleName";
import { SaleAvatar } from "../sales/SaleAvatar";
import type { Opportunity } from "../types";
import { getOpportunityStageLabel } from "./constants/stageConstants";
import { parseDateSafely } from "@/lib/date-utils";

export const OpportunityAside = ({ link = "edit" }: { link?: "edit" | "show" }) => {
  const record = useRecordContext<Opportunity>();

  if (!record) return null;

  const getStageBadgeVariant = (stage: string) => {
    if (stage === "closed_won") return "default";
    if (stage === "closed_lost") return "destructive";
    return "secondary";
  };

  return (
    <div className="hidden sm:block w-64 min-w-64 text-sm">
      <div className="mb-4 -ml-1">
        {link === "edit" ? (
          <EditButton label="Edit Opportunity" />
        ) : (
          <ShowButton label="Show Opportunity" />
        )}
      </div>

      <AsideSection title="Pipeline Status">
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-xs text-muted-foreground">Stage</span>
            <div className="mt-1">
              <Badge variant={getStageBadgeVariant(record.stage)}>
                {getOpportunityStageLabel(record.stage)}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Priority</span>
            <div className="mt-1">
              <Badge variant={getPriorityVariant(record.priority ?? "low")}>
                {record.priority ? ucFirst(record.priority) : "Unknown"}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Status</span>
            <div className="mt-1 text-sm">
              {record.status ? formatFieldLabel(record.status) : "Unknown"}
            </div>
          </div>
        </div>
      </AsideSection>

      <AsideSection title="Key Dates">
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-xs text-muted-foreground">Expected close</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm">
                {parseDateSafely(record.estimated_close_date)
                  ? format(parseDateSafely(record.estimated_close_date)!, "PP")
                  : "Invalid date"}
              </span>
              {parseDateSafely(record.estimated_close_date) && (
                <>
                  {isPast(parseDateSafely(record.estimated_close_date)!) ? (
                    <Badge variant="destructive" className="text-xs">
                      {formatDistanceToNow(parseDateSafely(record.estimated_close_date)!, {
                        addSuffix: true,
                      })}
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/30 text-xs"
                    >
                      {formatDistanceToNow(parseDateSafely(record.estimated_close_date)!, {
                        addSuffix: true,
                      })}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="text-muted-foreground">
            <span className="text-xs">Created on</span>{" "}
            <DateField
              source="created_at"
              options={{ year: "numeric", month: "long", day: "numeric" }}
            />
          </div>
          {record.stage_changed_at && (
            <div className="text-muted-foreground">
              <span className="text-xs">Stage changed</span>{" "}
              <DateField
                source="stage_changed_at"
                options={{ year: "numeric", month: "long", day: "numeric" }}
              />
            </div>
          )}
        </div>
      </AsideSection>

      <AsideSection title="Ownership">
        <div className="flex flex-col gap-2">
          {record.opportunity_owner_id && (
            <div>
              <span className="text-xs text-muted-foreground">Owner</span>
              <div className="flex items-center gap-2 mt-1">
                <ReferenceField source="opportunity_owner_id" reference="sales" link={false}>
                  <SaleAvatar size="sm" />
                </ReferenceField>
                <ReferenceField source="opportunity_owner_id" reference="sales" link={false}>
                  <SaleName />
                </ReferenceField>
              </div>
            </div>
          )}
          {record.account_manager_id && (
            <div>
              <span className="text-xs text-muted-foreground">Account Manager</span>
              <div className="flex items-center gap-2 mt-1">
                <ReferenceField source="account_manager_id" reference="sales" link={false}>
                  <SaleAvatar size="sm" />
                </ReferenceField>
                <ReferenceField source="account_manager_id" reference="sales" link={false}>
                  <SaleName />
                </ReferenceField>
              </div>
            </div>
          )}
          {record.created_by && (
            <div>
              <span className="text-xs text-muted-foreground">Created By</span>
              <div className="flex items-center gap-2 mt-1">
                <ReferenceField source="created_by" reference="sales" link={false}>
                  <SaleAvatar size="sm" />
                </ReferenceField>
                <ReferenceField source="created_by" reference="sales" link={false}>
                  <SaleName />
                </ReferenceField>
              </div>
            </div>
          )}
        </div>
      </AsideSection>

      {record.lead_source && (
        <AsideSection title="Lead Source">
          <div className="text-sm text-foreground">{formatFieldLabel(record.lead_source)}</div>
        </AsideSection>
      )}

      <AsideSection title="Tasks">
        <ReferenceManyField
          target="opportunity_id"
          reference="tasks"
          sort={{ field: "due_date", order: "ASC" }}
        >
          <TasksIterator />
        </ReferenceManyField>
      </AsideSection>

      {record.notes && (
        <AsideSection title="Quick Notes">
          <div className="text-sm text-foreground whitespace-pre-wrap bg-muted p-3 rounded-md border-l-[3px] border-border">
            {record.notes}
          </div>
        </AsideSection>
      )}
    </div>
  );
};
