import { useShowContext, RecordRepresentation } from "ra-core";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { DateField } from "@/components/ra-wrappers/date-field";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { Badge } from "@/components/ui/badge";
import { NotFound } from "@/components/ui/not-found";
import { DataFetchError } from "@/components/ui/data-fetch-error";
import { PriorityBadge } from "@/components/ui/priority-badge";
import type { Task as TTask } from "./types";

/**
 * TaskShow Component
 *
 * Displays full task details in a modal or page.
 * Shows: title, description, dates, priority, type, linked opportunity/contact
 */
export default function TaskShow() {
  const { record, isPending, error, refetch } = useShowContext<TTask>();

  if (isPending) {
    return (
      <SectionCard contentClassName="p-8">
        <p className="text-muted-foreground">Loading task...</p>
      </SectionCard>
    );
  }
  if (error) return <DataFetchError message={error.message} onRetry={() => refetch()} />;
  if (!record) return <NotFound resource="task" />;

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          {record.title}
          {record.completed_at && <Badge variant="secondary">Completed</Badge>}
        </span>
      }
      contentClassName="space-y-4"
    >
      {record.description && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Description</h4>
          <p className="text-sm text-muted-foreground">{record.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold mb-1">Due Date</h4>
          <DateField source="due_date" record={record} />
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-1">Priority</h4>
          {record.priority && <PriorityBadge priority={record.priority} />}
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-1">Type</h4>
          <p className="text-sm">{record.type}</p>
        </div>

        {record.completed_at && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Completed</h4>
            <DateField source="completed_at" record={record} showTime />
          </div>
        )}
      </div>

      {record.opportunity_id && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Opportunity</h4>
          <ReferenceField
            source="opportunity_id"
            reference="opportunities"
            record={record}
            link="show"
          >
            <RecordRepresentation />
          </ReferenceField>
        </div>
      )}

      {record.contact_id && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Contact</h4>
          <ReferenceField source="contact_id" reference="contacts" record={record} link="show">
            <RecordRepresentation />
          </ReferenceField>
        </div>
      )}

      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created: <DateField source="created_at" record={record} showTime />
      </div>
    </SectionCard>
  );
}
