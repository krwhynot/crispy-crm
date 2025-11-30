import { TextInput } from "@/components/admin/text-input";
import { FormSection } from "@/components/admin/form";

export const ContactMoreTab = () => {
  return (
    <div className="space-y-6">
      <FormSection title="Professional Information">
        <div className="space-y-2">
          <TextInput source="title" helperText={false} />
          <TextInput source="department" label="Department" helperText={false} />
        </div>
      </FormSection>

      <FormSection title="Social Media">
        <TextInput
          source="linkedin_url"
          label="LinkedIn URL"
          helperText="Format: https://linkedin.com/in/username"
        />
      </FormSection>

      <FormSection title="Additional Information">
        <TextInput
          source="notes"
          label="Notes"
          multiline
          rows={4}
          helperText="Additional information about this contact"
        />
      </FormSection>
    </div>
  );
};
