import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { FormSection, CompactFormRow, FormFieldWrapper } from "@/components/admin/form";
import { ContactManagerInput } from "./ContactManagerInput";
import { DEPARTMENT_CHOICES } from "./constants";

export const ContactAdditionalDetails = () => {
  return (
    <>
      <FormSection title="Additional Details">
        <div className="space-y-4">
          <CompactFormRow>
            <FormFieldWrapper name="title">
              <TextInput source="title" label="Job Title" helperText={false} />
            </FormFieldWrapper>
            <FormFieldWrapper name="department">
              <SelectInput
                source="department"
                label="Department"
                choices={DEPARTMENT_CHOICES}
                helperText={false}
                emptyText="Select department"
              />
            </FormFieldWrapper>
          </CompactFormRow>
          <FormFieldWrapper name="linkedin_url">
            <TextInput
              source="linkedin_url"
              label="LinkedIn URL"
              helperText="Format: https://linkedin.com/in/username"
            />
          </FormFieldWrapper>
          <FormFieldWrapper name="notes">
            <TextInput source="notes" label="Notes" multiline rows={3} helperText={false} />
          </FormFieldWrapper>
        </div>
      </FormSection>

      <FormSection title="Organization & Territory">
        <div className="space-y-4">
          <ContactManagerInput />
          <CompactFormRow>
            <FormFieldWrapper name="district_code">
              <TextInput source="district_code" label="District Code" helperText="e.g., D1, D73" />
            </FormFieldWrapper>
            <FormFieldWrapper name="territory_name">
              <TextInput
                source="territory_name"
                label="Territory"
                helperText="e.g., Western Suburbs"
              />
            </FormFieldWrapper>
          </CompactFormRow>
        </div>
      </FormSection>
    </>
  );
};
