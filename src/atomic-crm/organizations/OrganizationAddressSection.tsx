import { TextInput } from "@/components/admin/text-input";
import { CollapsibleSection, CompactFormRow } from "@/components/admin/form";
import { StateComboboxInput } from "@/components/admin/state-combobox-input";

export const OrganizationAddressSection = () => {
  return (
    <CollapsibleSection title="Address">
      <div className="space-y-4">
        <TextInput source="shipping_street" label="Street" helperText={false} />
        <CompactFormRow>
          <TextInput source="shipping_city" label="City" helperText={false} />
          <StateComboboxInput source="shipping_state" label="State" />
        </CompactFormRow>
        <TextInput source="shipping_postal_code" label="ZIP Code" helperText={false} />
      </div>
    </CollapsibleSection>
  );
};
