import { TextInput } from "@/components/admin/text-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { CompactFormRow, CollapsibleSection } from "@/components/admin/form";
import { SegmentComboboxInput } from "@/components/admin/SegmentComboboxInput";
import { StateComboboxInput } from "@/components/admin/state-combobox-input";
import { ParentOrganizationInput } from "./ParentOrganizationInput";
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES } from "./constants";
import { saleOptionRenderer } from "../utils/saleOptionRenderer";
import { OrganizationHierarchySection } from "./OrganizationHierarchySection";
import { OrganizationAddressSection } from "./OrganizationAddressSection";
import { OrganizationStatusSection } from "./OrganizationStatusSection";

export const OrganizationCompactForm = () => {
  return (
    <div className="space-y-4">
      <CompactFormRow>
        <div data-tutorial="org-name">
          <TextInput
            source="name"
            label="Organization Name *"
            helperText={false}
            placeholder="Organization name"
          />
        </div>
        <div data-tutorial="org-type">
          <SelectInput
            source="organization_type"
            label="Type"
            choices={ORGANIZATION_TYPE_CHOICES}
            helperText={false}
            emptyText="Select organization type"
          />
        </div>
      </CompactFormRow>

      <CompactFormRow>
        <SelectInput
          source="priority"
          label="Priority"
          choices={PRIORITY_CHOICES}
          helperText={false}
          emptyText="Select priority"
        />
        <ReferenceInput
          reference="sales"
          source="sales_id"
          sort={{ field: "last_name", order: "ASC" }}
          filter={{ "disabled@neq": true, "user_id@not.is": null }}
        >
          <SelectInput helperText={false} label="Account Manager" optionText={saleOptionRenderer} />
        </ReferenceInput>
        <SegmentComboboxInput source="segment_id" label="Segment" helperText={false} />
      </CompactFormRow>

      <CompactFormRow>
        <TextInput source="address" label="Street" helperText={false} />
        <TextInput source="city" label="City" helperText={false} />
      </CompactFormRow>

      <CompactFormRow>
        <StateComboboxInput source="state" label="State" />
        <TextInput source="postal_code" label="Zip Code" helperText={false} />
      </CompactFormRow>

      <CollapsibleSection title="Additional Details">
        <div className="space-y-4">
          <div data-tutorial="org-website">
            <TextInput source="website" label="Website" helperText="Format: https://example.com" />
          </div>
          <TextInput source="phone" label="Phone" helperText="Format: (555) 123-4567" />
          <TextInput
            source="linkedin_url"
            label="LinkedIn URL"
            helperText="Format: https://linkedin.com/company/name"
          />
          <ParentOrganizationInput />
          <TextInput
            source="description"
            label="Description"
            multiline
            rows={3}
            helperText={false}
          />
        </div>
      </CollapsibleSection>

      <OrganizationHierarchySection />
      <OrganizationAddressSection />
      <OrganizationStatusSection />
    </div>
  );
};
