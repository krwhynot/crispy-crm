import { TextInput } from "@/components/admin/text-input";
import { DateInput } from "@/components/admin/date-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { FormFieldWrapper, FormSectionWithProgress, CompactFormRow } from "@/components/admin/form";
import { useFormOptions } from "../root/ConfigurationContext";
import { contactOptionText } from "../contacts/ContactOption";
import {
  getAutocompleteProps,
  getQSearchAutocompleteProps,
  enableGetChoices,
} from "@/atomic-crm/utils/autocompleteDefaults";

/**
 * TaskCompactForm Component
 *
 * Single-page task form following the unified design system:
 * - Uses FormSectionWithProgress for organized field groups
 * - "General" section: title, description, dates
 * - "Details" section: priority, type, linked entities
 * - Tracks completion status per section
 *
 * Replaces the previous tabbed TaskInputs component.
 */
export const TaskCompactForm = () => {
  const { taskTypes } = useFormOptions();

  return (
    <div className="space-y-6">
      {/* General Section: Core task information */}
      <FormSectionWithProgress
        id="general-section"
        title="General"
        requiredFields={["title", "due_date"]}
      >
        <div data-tutorial="task-title">
          <FormFieldWrapper name="title" isRequired>
            <TextInput source="title" label="Task Title *" helperText="Required field" />
          </FormFieldWrapper>
        </div>
        <FormFieldWrapper name="description">
          <TextInput
            source="description"
            label="Description"
            multiline
            rows={3}
            helperText="Optional detailed description"
          />
        </FormFieldWrapper>
        <CompactFormRow>
          <div data-tutorial="task-due-date">
            <FormFieldWrapper name="due_date" isRequired countDefaultAsFilled>
              <DateInput
                source="due_date"
                label="Due Date *"
                helperText="When is this due?"
              />
            </FormFieldWrapper>
          </div>
          <FormFieldWrapper name="reminder_date">
            <DateInput
              source="reminder_date"
              label="Reminder Date"
              helperText="Optional reminder"
            />
          </FormFieldWrapper>
        </CompactFormRow>
      </FormSectionWithProgress>

      {/* Details Section: Categorization and relationships */}
      <FormSectionWithProgress
        id="details-section"
        title="Details"
        requiredFields={["type", "sales_id"]}
      >
        <CompactFormRow columns="md:grid-cols-3">
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
              helperText={false}
            />
          </FormFieldWrapper>
          <FormFieldWrapper name="type" isRequired countDefaultAsFilled>
            <SelectInput
              source="type"
              label="Type *"
              choices={taskTypes.map((type) => ({ id: type, name: type }))}
              helperText={false}
            />
          </FormFieldWrapper>
          <FormFieldWrapper name="sales_id" isRequired countDefaultAsFilled>
            <ReferenceInput source="sales_id" reference="sales" enableGetChoices={enableGetChoices}>
              <AutocompleteInput
                {...getQSearchAutocompleteProps()}
                label="Assigned To *"
                helperText={false}
              />
            </ReferenceInput>
          </FormFieldWrapper>
        </CompactFormRow>

        <CompactFormRow>
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
        </CompactFormRow>

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
      </FormSectionWithProgress>
    </div>
  );
};
