import { TextInput } from "@/components/ra-wrappers/text-input";
import {
  CollapsibleSection,
  CompactFormRow,
  FormFieldWrapper,
} from "@/components/ra-wrappers/form";
import { StateComboboxInput } from "@/components/ra-wrappers/state-combobox-input";

export const OrganizationAddressSection = () => {
  return (
    <CollapsibleSection title="Address">
      <div className="space-y-4">
        <FormFieldWrapper name="shipping_street">
          <TextInput source="shipping_street" label="Street" helperText={false} />
        </FormFieldWrapper>
        <CompactFormRow>
          <FormFieldWrapper name="shipping_city">
            <TextInput source="shipping_city" label="City" helperText={false} />
          </FormFieldWrapper>
          <FormFieldWrapper name="shipping_state">
            <StateComboboxInput source="shipping_state" label="State" />
          </FormFieldWrapper>
        </CompactFormRow>
        <FormFieldWrapper name="shipping_postal_code">
          <TextInput source="shipping_postal_code" label="ZIP Code" helperText={false} />
        </FormFieldWrapper>
      </div>
    </CollapsibleSection>
  );
};
