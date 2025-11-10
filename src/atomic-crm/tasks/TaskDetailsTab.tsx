import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { contactOptionText } from "../misc/ContactOption";

export const TaskDetailsTab = () => {
  const { taskTypes } = useConfigurationContext();

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
    </div>
  );
};
