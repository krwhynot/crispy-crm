import { Edit } from "@/components/admin/edit";
import { SimpleForm } from "@/components/admin/simple-form";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { DeleteButton } from "@/components/admin/delete-button";
import { SaveButton } from "@/components/admin/form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Identifier } from "ra-core";
import { EditBase, Form, useNotify } from "ra-core";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { contactOptionText } from "../misc/ContactOption";

/**
 * TaskEdit - Inline Dialog Component
 *
 * Quick edit dialog used by Task row component.
 * Opens in a modal for fast inline editing.
 */
export const TaskEdit = ({
  open,
  close,
  taskId,
}: {
  taskId: Identifier;
  open: boolean;
  close: () => void;
}) => {
  const { taskTypes } = useConfigurationContext();
  const notify = useNotify();
  return (
    <Dialog open={open} onOpenChange={close}>
      {taskId && (
        <EditBase
          id={taskId}
          resource="tasks"
          className="mt-0"
          mutationOptions={{
            onSuccess: () => {
              close();
              notify("Task updated", {
                type: "info",
                undoable: true,
              });
            },
          }}
          redirect={false}
        >
          <DialogContent className="lg:max-w-xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
            <Form className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Edit task</DialogTitle>
              </DialogHeader>
              <TextInput
                source="title"
                label="Task Title *"
                helperText="Required field"
              />
              <TextInput
                source="description"
                label="Description"
                multiline
                helperText="Optional details"
              />
              <div className="flex flex-row gap-4">
                <TextInput
                  source="due_date"
                  label="Due Date *"
                  helperText="Required field"
                  type="date"
                />
                <SelectInput
                  source="type"
                  label="Type *"
                  choices={taskTypes.map((type) => ({
                    id: type,
                    name: type,
                  }))}
                  helperText="Required field"
                />
              </div>
              <DialogFooter className="w-full sm:justify-between gap-4">
                <DeleteButton
                  mutationOptions={{
                    onSuccess: () => {
                      close();
                      notify("Task deleted", {
                        type: "info",
                        undoable: true,
                      });
                    },
                  }}
                  redirect={false}
                />
                <SaveButton label="Save" />
              </DialogFooter>
            </Form>
          </DialogContent>
        </EditBase>
      )}
    </Dialog>
  );
};

/**
 * TaskEditPage - Standalone Edit Page
 *
 * Full edit page for /tasks/:id/edit route.
 * Provides comprehensive editing with all fields.
 */
export default function TaskEditPage() {
  const { taskTypes } = useConfigurationContext();

  return (
    <Edit>
      <SimpleForm>
        <TextInput
          source="title"
          label="Task Title"
          isRequired
          helperText="Brief description of the task"
        />

        <TextInput
          source="description"
          label="Description"
          multiline
          rows={3}
          helperText="Optional detailed description"
        />

        <div className="grid grid-cols-2 gap-4">
          <TextInput
            source="due_date"
            label="Due Date"
            type="date"
            isRequired
            helperText="When is this due?"
          />

          <TextInput
            source="reminder_date"
            label="Reminder Date"
            type="date"
            helperText="Optional reminder"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            source="priority"
            label="Priority"
            choices={[
              { id: "low", name: "Low" },
              { id: "medium", name: "Medium" },
              { id: "high", name: "High" },
              { id: "critical", name: "Critical" },
            ]}
            helperText="Task priority level"
          />

          <SelectInput
            source="type"
            label="Type"
            choices={taskTypes.map((type) => ({ id: type, name: type }))}
            helperText="Category of task"
          />
        </div>

        <ReferenceInput
          source="opportunity_id"
          reference="opportunities"
        >
          <AutocompleteInput
            label="Opportunity"
            optionText="title"
            helperText="Link to opportunity"
          />
        </ReferenceInput>

        <ReferenceInput
          source="contact_id"
          reference="contacts_summary"
        >
          <AutocompleteInput
            label="Contact"
            optionText={contactOptionText}
            helperText="Link to contact"
          />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
}
