import { DeleteButton } from "@/components/admin/delete-button";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
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
// Validation removed per Engineering Constitution - single-point validation at API boundary only
import { useConfigurationContext } from "../root/ConfigurationContext";

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
                autoFocus
                source="text"
                label="Description *"
                multiline
                helperText="Required field"
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
