import { TextInput } from "@/components/ra-wrappers/text-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import {
  CollapsibleSection,
  CompactFormRow,
  FormFieldWrapper,
} from "@/components/ra-wrappers/form";
import { ContactManagerInput } from "./ContactManagerInput";
import { DEPARTMENT_CHOICES } from "./constants";

interface ContactAdditionalDetailsProps {
  disabled?: boolean;
}

export const ContactAdditionalDetails = ({ disabled }: ContactAdditionalDetailsProps) => {
  return (
    <>
      <CollapsibleSection title="Professional Details">
        <div className="space-y-4">
          <CompactFormRow>
            <FormFieldWrapper name="title">
              <TextInput source="title" label="Job Title" helperText={false} disabled={disabled} />
            </FormFieldWrapper>
            <FormFieldWrapper name="department">
              <SelectInput
                source="department"
                label="Department"
                choices={DEPARTMENT_CHOICES}
                helperText={false}
                emptyText="Select department"
                disabled={disabled}
              />
            </FormFieldWrapper>
          </CompactFormRow>
          <FormFieldWrapper name="linkedin_url">
            <TextInput
              source="linkedin_url"
              label="LinkedIn URL"
              helperText="Format: https://linkedin.com/in/username"
              disabled={disabled}
            />
          </FormFieldWrapper>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Organization & Territory">
        <div className="space-y-4">
          <ContactManagerInput disabled={disabled} />
          <CompactFormRow>
            <FormFieldWrapper name="district_code">
              <TextInput
                source="district_code"
                label="District Code"
                helperText="e.g., D1, D73"
                disabled={disabled}
              />
            </FormFieldWrapper>
            <FormFieldWrapper name="territory_name">
              <TextInput
                source="territory_name"
                label="Territory"
                helperText="e.g., Western Suburbs"
                disabled={disabled}
              />
            </FormFieldWrapper>
          </CompactFormRow>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Notes">
        <FormFieldWrapper name="notes">
          <TextInput
            source="notes"
            label="Notes"
            multiline
            rows={3}
            helperText={false}
            disabled={disabled}
          />
        </FormFieldWrapper>
      </CollapsibleSection>
    </>
  );
};
