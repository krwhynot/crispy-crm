import { CreateBase, Form, useGetIdentity, useNotify, useRedirect } from "ra-core";
import { useFormContext, useFormState } from "react-hook-form";
import { useCallback } from "react";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import {
  SaveButton,
  FormProgressProvider,
  FormProgressBar,
  FormFieldWrapper,
} from "@/components/admin/form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { Button } from "@/components/ui/button";
import { useFormOptions } from "../root/ConfigurationContext";
import { contactOptionText } from "../contacts/ContactOption";
import { getTaskDefaultValues } from "../validation/task";

/**
 * TaskCreate Component
 *
 * Full-page create form following unified design system:
 * - bg-muted page background
 * - Centered card with create-form-card styling
 * - Sticky footer with Cancel, Save & Close, Save & Add Another
 * - Dirty state confirmation on cancel
 *
 * Pre-fills: today's due date, current user, medium priority
 */
export default function TaskCreate() {
  const { data: identity } = useGetIdentity();
  const { taskTypes } = useFormOptions();
  const notify = useNotify();
  const redirect = useRedirect();

  const defaultValues = {
    ...getTaskDefaultValues(),
    sales_id: identity?.id,
  };

  return (
    <CreateBase redirect="list">
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar className="mb-6" />
            <Form defaultValues={defaultValues} mode="onBlur">
              <TaskFormContent notify={notify} redirect={redirect} taskTypes={taskTypes} />
            </Form>
          </FormProgressProvider>
        </div>
      </div>
    </CreateBase>
  );
}

const TaskFormContent = ({
  notify,
  redirect,
  taskTypes,
}: {
  notify: ReturnType<typeof useNotify>;
  redirect: ReturnType<typeof useRedirect>;
  taskTypes: string[];
}) => {
  const { errors } = useFormState();

  return (
    <>
      <FormErrorSummary errors={errors} />
      <div className="space-y-6">
        <div data-tutorial="task-title">
          <FormFieldWrapper name="title" isRequired>
            <TextInput
              source="title"
              label="Task Title"
              isRequired
              helperText="What needs to be done?"
            />
          </FormFieldWrapper>
        </div>

        <FormFieldWrapper name="description">
          <TextInput
            source="description"
            label="Description"
            multiline
            rows={2}
            helperText="Optional details"
          />
        </FormFieldWrapper>

        <div className="grid grid-cols-2 gap-4">
          <div data-tutorial="task-due-date">
            <FormFieldWrapper name="due_date" isRequired>
              <TextInput
                source="due_date"
                label="Due Date"
                type="date"
                isRequired
                helperText="When is this due?"
              />
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper name="type">
            <SelectInput
              source="type"
              label="Type"
              choices={taskTypes.map((type) => ({ id: type, name: type }))}
              helperText="Category of task"
            />
          </FormFieldWrapper>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormFieldWrapper name="priority">
            <SelectInput
              source="priority"
              label="Priority"
              choices={[
                { id: "low", name: "Low" },
                { id: "medium", name: "Medium" },
                { id: "high", name: "High" },
                { id: "critical", name: "Critical" },
              ]}
              helperText="How urgent?"
            />
          </FormFieldWrapper>

          <FormFieldWrapper name="opportunity_id">
            <ReferenceInput source="opportunity_id" reference="opportunities">
              <AutocompleteInput
                label="Opportunity"
                optionText="title"
                helperText="Link to opportunity (optional)"
              />
            </ReferenceInput>
          </FormFieldWrapper>
        </div>

        <FormFieldWrapper name="contact_id">
          <ReferenceInput source="contact_id" reference="contacts_summary">
            <AutocompleteInput
              label="Contact"
              optionText={contactOptionText}
              helperText="Link to contact (optional)"
            />
          </ReferenceInput>
        </FormFieldWrapper>
      </div>

      <TaskCreateFooter notify={notify} redirect={redirect} />
    </>
  );
};

const TaskCreateFooter = ({
  notify,
  redirect,
}: {
  notify: ReturnType<typeof useNotify>;
  redirect: ReturnType<typeof useRedirect>;
}) => {
  const { reset } = useFormContext();
  const { isDirty } = useFormState();

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) return;
    }
    redirect("/tasks");
  }, [isDirty, redirect]);

  const handleError = useCallback(
    (error: Error) => {
      notify(error.message || "Failed to create task", { type: "error" });
    },
    [notify]
  );

  return (
    <div className="sticky bottom-12 bg-card border-t border-border p-4 flex justify-between mt-6">
      <Button variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
      <div className="flex gap-2">
        <SaveButton
          type="button"
          label="Save & Close"
          data-tutorial="task-save-btn"
          mutationOptions={{
            onSuccess: () => {
              notify("Task created successfully", { type: "success" });
              redirect("/tasks");
            },
            onError: handleError,
          }}
        />
        <SaveButton
          type="button"
          label="Save & Add Another"
          mutationOptions={{
            onSuccess: () => {
              notify("Task created successfully", { type: "success" });
              reset();
            },
            onError: handleError,
          }}
        />
      </div>
    </div>
  );
};
