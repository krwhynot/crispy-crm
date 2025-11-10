import { Edit } from "@/components/admin/edit";
import { SimpleForm } from "@/components/admin/simple-form";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { contactOptionText } from "../misc/ContactOption";

/**
 * TaskEdit Component
 *
 * Edit form for tasks - standalone page version
 * For inline dialog version, see Task.tsx
 */
export default function TaskEdit() {
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
            defaultValue="medium"
            helperText="Task priority level"
          />

          <SelectInput
            source="type"
            label="Type"
            choices={taskTypes.map((type) => ({ id: type, name: type }))}
            defaultValue="None"
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
