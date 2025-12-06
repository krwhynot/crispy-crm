import { TextInput } from "@/components/admin/text-input";
import { FormGrid, FormSection } from "@/components/admin/form";
import { ParentOrganizationInput } from "./ParentOrganizationInput";

export const OrganizationMoreTab = () => {
  return (
    <div className="space-y-6">
      <FormSection title="Additional Information">
        <FormGrid columns={2}>
          <TextInput source="website" helperText="Format: https://example.com" label="Website" data-tutorial="org-website" />
          <TextInput
            source="linkedin_url"
            label="LinkedIn URL"
            helperText="Format: https://linkedin.com/company/name"
          />
          <div className="col-span-full">
            <TextInput source="description" multiline helperText={false} label="Description" />
          </div>
          <div className="col-span-full">
            <ParentOrganizationInput />
          </div>
        </FormGrid>
      </FormSection>
    </div>
  );
};
