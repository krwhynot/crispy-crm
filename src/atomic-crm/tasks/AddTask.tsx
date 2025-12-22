import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { SaveButton } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import {
  CreateBase,
  Form,
  RecordRepresentation,
  useDataProvider,
  useGetIdentity,
  useNotify,
  useRecordContext,
  useUpdate,
} from "ra-core";
// Validation removed per Engineering Constitution - single-point validation at API boundary only
import { useState } from "react";
import { contactOptionText } from "../contacts/ContactOption";
import { useFormOptions } from "../root/ConfigurationContext";
import { getTaskDefaultValues } from "../validation/task";

export const AddTask = ({
  selectContact,
  display = "chip",
}: {
  selectContact?: boolean;
  display?: "chip" | "icon";
}) => {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const dataProvider = useDataProvider();
  const [update] = useUpdate();
  const notify = useNotify();
  const { taskTypes } = useFormOptions();
  const contact = useRecordContext();
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };

  const handleSuccess = async (data: { contact_id?: string | number }) => {
    setOpen(false);

    // Phase 3: Add error handling to prevent unhandled promise rejections
    try {
      const contact = await dataProvider.getOne("contacts", {
        id: data.contact_id,
      });

      if (!contact.data) {
        notify("Task created, but couldn't update contact last_seen", { type: "warning" });
        return;
      }

      await update("contacts", {
        id: contact.data.id,
        data: { last_seen: new Date().toISOString() },
        previousData: contact.data,
      });

      notify("Task added");
    } catch (error) {
      // Task was created successfully, but contact update failed
      // This is non-critical - notify user but don't fail the operation
      console.error("Failed to update contact last_seen:", error);
      notify("Task created, but couldn't update contact", { type: "warning" });
    }
  };

  if (isIdentityPending || !identity) return null;

  return (
    <>
      {display === "icon" ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-11 w-11 p-0 cursor-pointer"
                onClick={handleOpen}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create task</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className="my-2">
          <Button variant="outline" className="h-11 cursor-pointer" onClick={handleOpen} size="sm">
            <Plus className="w-4 h-4" />
            Add task
          </Button>
        </div>
      )}

      <CreateBase
        resource="tasks"
        record={{
          ...getTaskDefaultValues(),
          contact_id: contact?.id,
          sales_id: identity.id,
        }}
        mutationOptions={{ onSuccess: handleSuccess }}
      >
        <Dialog open={open} onOpenChange={() => setOpen(false)}>
          <DialogContent className="lg:max-w-xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
            <Form className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>
                  {!selectContact ? "Create a new task for " : "Create a new task"}
                  {!selectContact && <RecordRepresentation record={contact} resource="contacts" />}
                </DialogTitle>
                <DialogDescription>
                  Add a new task with title, description, due date, and priority.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <TextInput
                  source="title"
                  label="Task Title *"
                  className="m-0"
                  helperText="Required field"
                />
                <TextInput
                  source="description"
                  label="Description"
                  multiline
                  className="m-0"
                  helperText="Optional details"
                />
                {selectContact && (
                  <ReferenceInput source="contact_id" reference="contacts_summary">
                    <AutocompleteInput
                      label="Contact *"
                      optionText={contactOptionText}
                      helperText="Required field"
                    />
                  </ReferenceInput>
                )}

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
              </div>
              <DialogFooter className="w-full justify-end">
                <SaveButton />
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </CreateBase>
    </>
  );
};
