import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { CollapsibleSection, CompactFormRow } from "@/components/admin/form";
import { ContactManagerInput } from "./ContactManagerInput";
import { DEPARTMENT_CHOICES } from "./constants";

export const ContactAdditionalDetails = () => {
  return (
    <>
      <CollapsibleSection title="Additional Details">
        <div className="space-y-4">
          <CompactFormRow>
            <TextInput source="title" label="Job Title" helperText={false} />
            <SelectInput
              source="department"
              label="Department"
              choices={DEPARTMENT_CHOICES}
              helperText={false}
              emptyText="Select department"
            />
          </CompactFormRow>
          <TextInput
            source="linkedin_url"
            label="LinkedIn URL"
            helperText="Format: https://linkedin.com/in/username"
          />
          <TextInput source="notes" label="Notes" multiline rows={3} helperText={false} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Organization & Territory">
        <div className="space-y-4">
          <ContactManagerInput />
          <CompactFormRow>
            <TextInput
              source="district_code"
              label="District Code"
              helperText="e.g., D1, D73"
            />
            <TextInput
              source="territory_name"
              label="Territory"
              helperText="e.g., Western Suburbs"
            />
          </CompactFormRow>
        </div>
      </CollapsibleSection>
    </>
  );
};
