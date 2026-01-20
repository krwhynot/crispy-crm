import { TextInput } from "@/components/ra-wrappers/text-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { FormSection, CompactFormRow, FormFieldWrapper } from "@/components/ra-wrappers/form";
import { ContactManagerInput } from "./ContactManagerInput";
import { DEPARTMENT_CHOICES } from "./constants";

const LINKEDIN_URL_REGEX = /^https?:\/\/(?:www\.)?linkedin\.com\//;

const validateLinkedInUrl = (value: string | undefined | null) => {
  if (!value || value.trim() === "") return undefined; // Optional field

  try {
    const url = new URL(value);
    if (!LINKEDIN_URL_REGEX.test(url.href)) {
      return "URL must be from linkedin.com (e.g., https://linkedin.com/in/username)";
    }
  } catch {
    return "Please enter a valid URL";
  }

  return undefined;
};

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
              validate={validateLinkedInUrl}
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
