import { CreateBase, Form, useGetIdentity } from "ra-core";
import { useFormState } from "react-hook-form";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import {
  FormProgressProvider,
  FormProgressBar,
  FormFieldWrapper,
} from "@/components/admin/form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { CreateFormFooter } from "@/atomic-crm/components";
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
              <TaskFormContent taskTypes={taskTypes} />
            </Form>
          </FormProgressProvider>
        </div>
      </div>
    </CreateBase>
  );
}

const TaskFormContent = ({
  taskTypes,
}: {
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

      <CreateFormFooter
        resourceName="task"
        redirectPath="/tasks"
        tutorialAttribute="task-save-btn"
      />
    </>
  );
};

