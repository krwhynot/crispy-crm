import { TextInput } from "@/components/admin/text-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";

export const OrganizationOtherTab = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <TextInput source="website" helperText="Format: https://example.com" label="Website" />
      <TextInput
        source="linkedin_url"
        label="LinkedIn URL"
        helperText="Format: https://linkedin.com/company/name"
      />
      <div className="lg:col-span-2">
        <ArrayInput source="context_links" helperText={false} label="Context Links">
          <SimpleFormIterator disableReordering fullWidth getItemLabel={false}>
            <TextInput source="" label={false} helperText="Enter a valid URL" />
          </SimpleFormIterator>
        </ArrayInput>
      </div>
    </div>
  );
};
