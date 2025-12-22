import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { useFormOptions } from "../root/ConfigurationContext";
import { contactOptionText } from "../contacts/ContactOption";

export const TaskDetailsTab = () => {
  const { taskTypes } = useFormOptions();

  return (
    <div className="space-y-2">
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
      <ReferenceInput source="organization_id" reference="organizations">
        <AutocompleteInput
          label="Organization"
          optionText="name"
          helperText="Link to organization"
        />
      </ReferenceInput>
      <ReferenceInput source="opportunity_id" reference="opportunities">
        <AutocompleteInput
          label="Opportunity"
          optionText="title"
          helperText="Link to opportunity"
        />
      </ReferenceInput>
      <ReferenceInput source="contact_id" reference="contacts_summary">
        <AutocompleteInput
          label="Contact"
          optionText={contactOptionText}
          helperText="Link to contact"
        />
      </ReferenceInput>
    </div>
  );
};
