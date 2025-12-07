import { TextInput } from "@/components/admin/text-input";
import { CollapsibleSection, CompactFormRow } from "@/components/admin/form";

export const ContactAdditionalDetails = () => {
  return (
    <CollapsibleSection title="Additional Details">
      <div className="space-y-3">
        <CompactFormRow>
          <TextInput source="title" label="Job Title" helperText={false} />
          <TextInput source="department" label="Department" helperText={false} />
        </CompactFormRow>
        <TextInput
          source="linkedin_url"
          label="LinkedIn URL"
          helperText="Format: https://linkedin.com/in/username"
        />
        <TextInput source="notes" label="Notes" multiline rows={3} helperText={false} />
      </div>
    </CollapsibleSection>
  );
};
