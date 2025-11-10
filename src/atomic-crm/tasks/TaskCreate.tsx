import { Create } from "@/components/admin/create";
import { SimpleForm } from "@/components/admin/simple-form";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { useGetIdentity } from "ra-core";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { contactOptionText } from "../misc/ContactOption";
import { getTaskDefaultValues } from "../validation/task";

/**
 * TaskCreate Component
 *
 * Quick-add task form - minimal fields to get started
 * Pre-fills: today's due date, current user, medium priority
 */
export default function TaskCreate() {
  const { identity } = useGetIdentity();
  const { taskTypes } = useConfigurationContext();

  const defaultValues = {
    ...getTaskDefaultValues(),
    sales_id: identity?.id,
  };

  return (
    <Create redirect="list" record={defaultValues}>
      <SimpleForm>
        <TextInput
          source="title"
          label="Task Title"
          isRequired
          helperText="What needs to be done?"
        />

        <TextInput
          source="description"
          label="Description"
          multiline
          rows={2}
          helperText="Optional details"
        />

        <div className="grid grid-cols-2 gap-4">
          <TextInput
            source="due_date"
            label="Due Date"
            type="date"
            isRequired
            helperText="When is this due?"
          />

          <SelectInput
            source="type"
            label="Type"
            choices={taskTypes.map((type) => ({ id: type, name: type }))}
            helperText="Category of task"
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
            helperText="How urgent?"
          />

          <ReferenceInput source="opportunity_id" reference="opportunities">
            <AutocompleteInput
              label="Opportunity"
              optionText="title"
              helperText="Link to opportunity (optional)"
            />
          </ReferenceInput>
        </div>

        <ReferenceInput source="contact_id" reference="contacts_summary">
          <AutocompleteInput
            label="Contact"
            optionText={contactOptionText}
            helperText="Link to contact (optional)"
          />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
}
