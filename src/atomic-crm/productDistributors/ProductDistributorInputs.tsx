import { TextInput } from "@/components/ra-wrappers/text-input";
import { DateInput } from "@/components/ra-wrappers/date-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { PRODUCT_DISTRIBUTOR_STATUS_CHOICES } from "./constants";

/**
 * ProductDistributorInputs
 *
 * Shared form inputs for ProductDistributor Create and Edit forms.
 * Follows Module Standardization Checklist Rule #3: Input Separation.
 *
 * Note: product_id and distributor_id are NOT included here because:
 * - Create: Uses ReferenceInput with AutocompleteInput (editable)
 * - Edit: Shows read-only ReferenceField (immutable after creation)
 */
export const ProductDistributorInputs = () => (
  <>
    <TextInput
      source="vendor_item_number"
      label="DOT Number (Vendor Item #)"
      helperText="e.g., USF# 4587291, Sysco# 1092847"
      fullWidth
    />

    <SelectInput
      source="status"
      label="Status"
      choices={PRODUCT_DISTRIBUTOR_STATUS_CHOICES}
      helperText={false}
    />

    <DateInput source="valid_from" label="Valid From" helperText={false} />

    <DateInput source="valid_to" label="Valid To" helperText="Leave empty if ongoing" />

    <TextInput source="notes" label="Notes" multiline rows={3} fullWidth helperText={false} />
  </>
);

export default ProductDistributorInputs;
