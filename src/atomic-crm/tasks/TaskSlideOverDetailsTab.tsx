import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { Form } from "react-admin";
import { ReferenceField } from "@/components/admin/reference-field";
import { DateField } from "@/components/admin/date-field";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidepaneSection,
  SidepaneMetadata,
  DirtyStateTracker,
} from "@/components/layouts/sidepane";
import { SaleName } from "../sales/SaleName";
import { useFormOptions } from "../root/ConfigurationContext";
import { contactOptionText } from "../contacts/ContactOption";
import type { Task } from "../types";

interface TaskSlideOverDetailsTabProps {
  record: Task;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * Details tab for TaskSlideOver.
 *
 * **View Mode**: Displays all task fields:
 * - Title, Description
 * - Due Date, Reminder Date
 * - Priority (badge with semantic colors)
 * - Type (badge)
 * - Completed (checkbox - inline interactive)
 * - Assigned To (ReferenceField to sales)
 * - Related Contact, Opportunity
 *
 * **Edit Mode**: Full form with save/cancel buttons
 */
export function TaskSlideOverDetailsTab({
  record,
  mode,
  onModeToggle,
  onDirtyChange,
}: TaskSlideOverDetailsTabProps) {
  const [update] = useUpdate();
  const notify = useNotify();
  const { taskTypes } = useFormOptions();

  // Handle save in edit mode
  const handleSave = async (data: Partial<Task>) => {
    try {
      await update("tasks", {
        id: record.id,
        data,
        previousData: record,
      });
      notify("Task updated successfully", { type: "success" });
      onModeToggle?.(); // Return to view mode after successful save
    } catch (error: unknown) {
      notify("Error updating task", { type: "error" });
      console.error("Error updating task:", error instanceof Error ? error.message : String(error));
    }
  };

  // Handle inline completion toggle in view mode
  const handleCompletionToggle = async (checked: boolean) => {
    try {
      await update("tasks", {
        id: record.id,
        data: {
          completed: checked,
          completed_at: checked ? new Date().toISOString() : null,
        },
        previousData: record,
      });
      notify(checked ? "Task marked complete" : "Task marked incomplete", { type: "success" });
    } catch (error: unknown) {
      notify("Error updating task", { type: "error" });
      console.error("Completion toggle error:", error);
    }
  };

  if (mode === "edit") {
    return (
      <RecordContextProvider value={record}>
        <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
          <DirtyStateTracker onDirtyChange={onDirtyChange} />
          <div className="space-y-6" role="form" aria-label="Edit task form">
            <div className="space-y-4">
              <TextInput source="title" label="Task Title" />
              <TextInput source="description" label="Description" multiline rows={3} />
              <TextInput source="due_date" label="Due Date" type="date" />
              <TextInput source="reminder_date" label="Reminder Date" type="date" />

              <SelectInput
                source="priority"
                label="Priority"
                choices={[
                  { id: "low", name: "Low" },
                  { id: "medium", name: "Medium" },
                  { id: "high", name: "High" },
                  { id: "critical", name: "Critical" },
                ]}
              />

              <SelectInput
                source="type"
                label="Type"
                choices={taskTypes.map((type) => ({ id: type, name: type }))}
              />

              <BooleanInput source="completed" label="Completed" />

              <ReferenceInput source="sales_id" reference="sales">
                <AutocompleteInput label="Assigned To" />
              </ReferenceInput>

              <ReferenceInput source="contact_id" reference="contacts_summary">
                <AutocompleteInput label="Contact" optionText={contactOptionText} />
              </ReferenceInput>

              <ReferenceInput source="opportunity_id" reference="opportunities">
                <AutocompleteInput label="Opportunity" optionText="title" />
              </ReferenceInput>
            </div>
          </div>
        </Form>
      </RecordContextProvider>
    );
  }

  // View mode - display all task fields
  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4">
          {/* Task Info Section */}
          <SidepaneSection label="Task">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{record.title}</h3>
              {record.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {record.description}
                </p>
              )}

              {/* Completion status - Interactive checkbox even in view mode */}
              {/* min-h-11 ensures 44px touch target for WCAG AA compliance */}
              <label className="flex items-center gap-2 pt-2 min-h-11 cursor-pointer">
                <input
                  type="checkbox"
                  checked={record.completed || false}
                  onChange={(e) => handleCompletionToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                  aria-label={
                    record.completed ? "Mark task as incomplete" : "Mark task as complete"
                  }
                />
                <span className="text-sm font-medium">
                  {record.completed ? "Completed" : "Mark as complete"}
                </span>
                {record.completed_at && (
                  <span className="text-xs text-muted-foreground">
                    on <DateField source="completed_at" options={{ dateStyle: "short" }} />
                  </span>
                )}
              </label>
            </div>
          </SidepaneSection>

          {/* Schedule Section */}
          <SidepaneSection label="Schedule" showSeparator>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Due: </span>
                <DateField
                  source="due_date"
                  options={{ year: "numeric", month: "long", day: "numeric" }}
                  className="font-medium"
                />
              </div>
              {record.reminder_date && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Reminder: </span>
                  <DateField
                    source="reminder_date"
                    options={{ year: "numeric", month: "long", day: "numeric" }}
                    className="font-medium"
                  />
                </div>
              )}
            </div>
          </SidepaneSection>

          {/* Classification Section */}
          <SidepaneSection label="Classification" showSeparator>
            <div className="space-y-2">
              {record.priority && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Priority:</span>
                  <PriorityBadge priority={record.priority} />
                </div>
              )}
              {record.type && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge variant="outline">{record.type}</Badge>
                </div>
              )}
            </div>
          </SidepaneSection>

          {/* Assignment Section */}
          {record.sales_id && (
            <SidepaneSection label="Assigned To" showSeparator>
              <div className="text-sm">
                <ReferenceField source="sales_id" reference="sales">
                  <SaleName />
                </ReferenceField>
              </div>
            </SidepaneSection>
          )}

          {/* Metadata - replaces manual Timeline section */}
          <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}
