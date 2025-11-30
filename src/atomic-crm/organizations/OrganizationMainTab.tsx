import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SegmentComboboxInput } from "@/components/admin/SegmentComboboxInput";
import { FormGrid, FormSection } from "@/components/admin/form";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";

const US_STATES = [
  { id: "AL", name: "Alabama" },
  { id: "AK", name: "Alaska" },
  { id: "AZ", name: "Arizona" },
  { id: "AR", name: "Arkansas" },
  { id: "CA", name: "California" },
  { id: "CO", name: "Colorado" },
  { id: "CT", name: "Connecticut" },
  { id: "DE", name: "Delaware" },
  { id: "FL", name: "Florida" },
  { id: "GA", name: "Georgia" },
  { id: "HI", name: "Hawaii" },
  { id: "ID", name: "Idaho" },
  { id: "IL", name: "Illinois" },
  { id: "IN", name: "Indiana" },
  { id: "IA", name: "Iowa" },
  { id: "KS", name: "Kansas" },
  { id: "KY", name: "Kentucky" },
  { id: "LA", name: "Louisiana" },
  { id: "ME", name: "Maine" },
  { id: "MD", name: "Maryland" },
  { id: "MA", name: "Massachusetts" },
  { id: "MI", name: "Michigan" },
  { id: "MN", name: "Minnesota" },
  { id: "MS", name: "Mississippi" },
  { id: "MO", name: "Missouri" },
  { id: "MT", name: "Montana" },
  { id: "NE", name: "Nebraska" },
  { id: "NV", name: "Nevada" },
  { id: "NH", name: "New Hampshire" },
  { id: "NJ", name: "New Jersey" },
  { id: "NM", name: "New Mexico" },
  { id: "NY", name: "New York" },
  { id: "NC", name: "North Carolina" },
  { id: "ND", name: "North Dakota" },
  { id: "OH", name: "Ohio" },
  { id: "OK", name: "Oklahoma" },
  { id: "OR", name: "Oregon" },
  { id: "PA", name: "Pennsylvania" },
  { id: "RI", name: "Rhode Island" },
  { id: "SC", name: "South Carolina" },
  { id: "SD", name: "South Dakota" },
  { id: "TN", name: "Tennessee" },
  { id: "TX", name: "Texas" },
  { id: "UT", name: "Utah" },
  { id: "VT", name: "Vermont" },
  { id: "VA", name: "Virginia" },
  { id: "WA", name: "Washington" },
  { id: "WV", name: "West Virginia" },
  { id: "WI", name: "Wisconsin" },
  { id: "WY", name: "Wyoming" },
];

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
            choices={[
              { id: "customer", name: "Customer" },
              { id: "prospect", name: "Prospect" },
              { id: "principal", name: "Principal" },
              { id: "distributor", name: "Distributor" },
              { id: "unknown", name: "Unknown" },
            ]}
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
