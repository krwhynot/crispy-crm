import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SegmentComboboxInput } from "@/components/admin/SegmentComboboxInput";
import { FormGrid, FormSection } from "@/components/admin/form";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";
import { US_STATES, ORGANIZATION_TYPE_CHOICES } from "./constants";

export const OrganizationMainTab = () => {
  return (
    <div className="space-y-6">
      <FormSection title="Organization Information">
        <FormGrid columns={2}>
          <TextInput
            source="name"
            helperText="Required field"
            placeholder="Organization name"
            label="Name *"
          />
          <SelectInput
            source="organization_type"
            label="Organization Type *"
            choices={ORGANIZATION_TYPE_CHOICES}
            helperText="Required field"
            emptyText="Select organization type"
          />
          <ReferenceInput
            source="sales_id"
            reference="sales"
            filter={{
              "disabled@neq": true,
              "user_id@not.is": null,
            }}
          >
            <SelectInput
              label="Account manager"
              helperText={false}
              optionText={saleOptionRenderer}
            />
          </ReferenceInput>
          <SegmentComboboxInput source="segment_id" label="Segment" />
        </FormGrid>
      </FormSection>

      <FormSection title="Address Information">
        <FormGrid columns={2}>
          <TextInput source="street" helperText={false} label="Street" />
          <TextInput source="city" helperText={false} label="City" />
          <SelectInput
            source="state"
            label="State"
            helperText={false}
            choices={US_STATES}
            emptyText="Select state"
          />
          <TextInput source="zip" label="Zip" helperText={false} />
        </FormGrid>
      </FormSection>
    </div>
  );
};

const saleOptionRenderer = (choice: Sale) => formatName(choice.first_name, choice.last_name);
