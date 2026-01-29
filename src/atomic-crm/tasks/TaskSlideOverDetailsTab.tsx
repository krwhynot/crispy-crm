import { useState } from "react";
import { useUpdate, useNotify, RecordContextProvider } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { Form } from "react-admin";
import { logger } from "@/lib/logger";
import { taskUpdateSchema } from "@/atomic-crm/validation/task";
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";
import { taskKeys } from "../queryKeys";
import { TaskCompletionDialog } from "./TaskCompletionDialog";
import { SnoozeIndicator } from "@/components/ui/snooze-badge";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { DateField } from "@/components/ra-wrappers/date-field";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { DateInput } from "@/components/ra-wrappers/date-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { BooleanInput } from "@/components/ra-wrappers/boolean-input";
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
  const [update, { isLoading }] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { taskTypes } = useFormOptions();
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  // Handle save in edit mode
  const handleSave = async (data: Partial<Task>) => {
    try {
      // PRE-VALIDATE before API call (passthrough preserves id, created_at, etc.)
      const result = taskUpdateSchema.safeParse({ ...data, id: record.id });

      if (!result.success) {
        const firstError = result.error.issues[0];
        notify(`${firstError.path.join(".")}: ${firstError.message}`, { type: "error" });
        logger.error("Task validation failed", result.error, {
          feature: "TaskSlideOverDetailsTab",
          taskId: record.id,
        });
        return;
      }

      // Use result.data for the update
      await update("tasks", {
        id: record.id,
        data: result.data,
        previousData: record,
      });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      notify(notificationMessages.updated("Task"), { type: "success" });
      onModeToggle?.(); // Return to view mode after successful save
    } catch (error: unknown) {
      notify("Error updating task", { type: "error" });
      logger.error("Error updating task", error, {
        feature: "TaskSlideOverDetailsTab",
        taskId: record.id,
      });
    }
  };

  // Handle inline completion toggle in view mode
  const handleCompletionToggle = async (checked: boolean) => {
    if (checked) {
      setShowCompletionDialog(true);
    } else {
      try {
        await update("tasks", {
          id: record.id,
          data: { completed: false, completed_at: null },
          previousData: record,
        });
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
        notify("Task marked incomplete", { type: "success" });
      } catch (error: unknown) {
        notify("Error updating task", { type: "error" });
        logger.error("Completion toggle error", error, {
          feature: "TaskSlideOverDetailsTab",
          taskId: record.id,
        });
      }
    }
  };

  const handleDialogComplete = async () => {
    try {
      await update("tasks", {
        id: record.id,
        data: { completed: true, completed_at: new Date().toISOString() },
        previousData: record,
      });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      notify("Task marked complete", { type: "success" });
      setShowCompletionDialog(false);
    } catch (error: unknown) {
      notify("Error updating task", { type: "error" });
      logger.error("Completion toggle error", error, {
        feature: "TaskSlideOverDetailsTab",
        taskId: record.id,
      });
      setShowCompletionDialog(false);
    }
  };

  if (mode === "edit") {
    return (
      <RecordContextProvider value={record}>
        <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
          <DirtyStateTracker onDirtyChange={onDirtyChange} />
          <div className="space-y-6" role="form" aria-label="Edit task form">
            <div className="space-y-4">
              <TextInput source="title" label="Task Title" disabled={isLoading} />
              <TextInput
                source="description"
                label="Description"
                multiline
                rows={3}
                disabled={isLoading}
              />
              <DateInput source="due_date" label="Due Date" disabled={isLoading} />
              <DateInput source="reminder_date" label="Reminder Date" disabled={isLoading} />

              <SelectInput
                source="priority"
                label="Priority"
                choices={[
                  { id: "low", name: "Low" },
                  { id: "medium", name: "Medium" },
                  { id: "high", name: "High" },
                  { id: "critical", name: "Critical" },
                ]}
                disabled={isLoading}
              />

              <SelectInput
                source="type"
                label="Type"
                choices={taskTypes.map((type) => ({ id: type, name: type }))}
                disabled={isLoading}
              />

              <BooleanInput source="completed" label="Completed" disabled={isLoading} />

              <ReferenceInput source="sales_id" reference="sales" disabled={isLoading}>
                <AutocompleteInput label="Assigned To" />
              </ReferenceInput>

              <ReferenceInput source="contact_id" reference="contacts_summary" disabled={isLoading}>
                <AutocompleteInput label="Contact" optionText={contactOptionText} />
              </ReferenceInput>

              <ReferenceInput
                source="opportunity_id"
                reference="opportunities"
                disabled={isLoading}
              >
                <AutocompleteInput label="Opportunity" optionText="name" />
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
              {/* Snooze indicator - prominent icon indicator per Carbon Design System */}
              <SnoozeIndicator snoozeUntil={record.snooze_until} />
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

      <TaskCompletionDialog
        task={{
          id: Number(record.id),
          subject: record.title,
          taskType: record.type || "",
          relatedTo: {
            id: Number(record.contact_id || record.opportunity_id || 0),
            type: record.contact_id ? "contact" : "opportunity",
            name: "",
          },
        }}
        open={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        onComplete={handleDialogComplete}
      />
    </RecordContextProvider>
  );
}
