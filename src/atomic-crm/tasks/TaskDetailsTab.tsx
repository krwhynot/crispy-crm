import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { FormFieldWrapper, FormSectionWithProgress } from "@/components/admin/form";
import { useFormOptions } from "../root/ConfigurationContext";
import { contactOptionText } from "../contacts/ContactOption";
import {
  getAutocompleteProps,
  getQSearchAutocompleteProps,
  enableGetChoices,
} from "@/atomic-crm/utils/autocompleteDefaults";

export const TaskDetailsTab = () => {
  const { taskTypes } = useFormOptions();

  return (
    <FormSectionWithProgress
      id="details-section"
      title="Details"
      requiredFields={["type", "sales_id"]}
    >
      <FormFieldWrapper name="priority" countDefaultAsFilled>
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
      </FormFieldWrapper>
      <FormFieldWrapper name="type" isRequired countDefaultAsFilled>
        <SelectInput
          source="type"
          label="Type *"
          choices={taskTypes.map((type) => ({ id: type, name: type }))}
          helperText="Category of task"
        />
      </FormFieldWrapper>
      <FormFieldWrapper name="organization_id">
        <ReferenceInput
          source="organization_id"
          reference="organizations"
          enableGetChoices={enableGetChoices}
        >
          <AutocompleteInput
            {...getAutocompleteProps("name")}
            label="Organization"
            optionText="name"
            helperText="Link to organization"
          />
        </ReferenceInput>
      </FormFieldWrapper>
      <FormFieldWrapper name="opportunity_id">
        <ReferenceInput
          source="opportunity_id"
          reference="opportunities"
          enableGetChoices={enableGetChoices}
        >
          <AutocompleteInput
            {...getAutocompleteProps("title")}
            label="Opportunity"
            optionText="title"
            helperText="Link to opportunity"
          />
        </ReferenceInput>
      </FormFieldWrapper>
      <FormFieldWrapper name="contact_id">
        <ReferenceInput
          source="contact_id"
          reference="contacts_summary"
          enableGetChoices={enableGetChoices}
        >
          <AutocompleteInput
            {...getQSearchAutocompleteProps()}
            label="Contact"
            optionText={contactOptionText}
            helperText="Link to contact"
          />
        </ReferenceInput>
      </FormFieldWrapper>
      <FormFieldWrapper name="sales_id" isRequired countDefaultAsFilled>
        <ReferenceInput source="sales_id" reference="sales" enableGetChoices={enableGetChoices}>
          <AutocompleteInput
            {...getQSearchAutocompleteProps()}
            label="Assigned To *"
            helperText="Who owns this task (defaults to you)"
          />
        </ReferenceInput>
      </FormFieldWrapper>
    </FormSectionWithProgress>
  );
};
