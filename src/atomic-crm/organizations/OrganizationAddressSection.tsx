import { TextInput } from "@/components/admin/text-input";
import { CollapsibleSection, CompactFormRow } from "@/components/admin/form";
import { StateComboboxInput } from "@/components/admin/state-combobox-input";

export const OrganizationAddressSection = () => {
  return (
    <CollapsibleSection title="Addresses">
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Billing Address</h4>
          <TextInput source="billing_street" label="Street" helperText={false} />
          <CompactFormRow>
            <TextInput source="billing_city" label="City" helperText={false} />
            <StateComboboxInput source="billing_state" label="State" />
          </CompactFormRow>
          <TextInput source="billing_postal_code" label="ZIP Code" helperText={false} />
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Shipping Address</h4>
          <TextInput source="shipping_street" label="Street" helperText={false} />
          <CompactFormRow>
            <TextInput source="shipping_city" label="City" helperText={false} />
            <StateComboboxInput source="shipping_state" label="State" />
          </CompactFormRow>
          <TextInput source="shipping_postal_code" label="ZIP Code" helperText={false} />
        </div>
      </div>
    </CollapsibleSection>
  );
};
