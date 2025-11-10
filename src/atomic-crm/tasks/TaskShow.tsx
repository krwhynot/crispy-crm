import { useShowContext, RecordRepresentation } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { DateField } from "@/components/admin/date-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task as TTask } from "../types";

/**
 * TaskShow Component
 *
 * Displays full task details in a modal or page.
 * Shows: title, description, dates, priority, type, linked opportunity/contact
 */
export default function TaskShow() {
  const { record, isPending } = useShowContext<TTask>();

  if (isPending || !record) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-muted-foreground">Loading task...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {record.title}
          {record.completed_at && (
            <Badge variant="success">Completed</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Badge variant={getPriorityVariant(record.priority)}>
              {record.priority}
            </Badge>
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
            <ReferenceField
              source="contact_id"
              reference="contacts"
              record={record}
              link="show"
            >
              <RecordRepresentation />
            </ReferenceField>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-4 border-t">
          Created: <DateField source="created_at" record={record} showTime />
        </div>
      </CardContent>
    </Card>
  );
}

function getPriorityVariant(priority?: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "critical":
      return "destructive";
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}
