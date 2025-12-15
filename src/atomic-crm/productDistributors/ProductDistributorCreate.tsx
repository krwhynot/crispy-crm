import { Create, SimpleForm } from "react-admin";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { PRODUCT_DISTRIBUTOR_STATUS_CHOICES } from "./constants";

export const ProductDistributorCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <ReferenceInput source="product_id" reference="products" isRequired>
        <AutocompleteInput
          optionText="name"
          label="Product *"
          filterToQuery={(q) => ({ "name@ilike": `%${q}%` })}
          helperText="Select the product"
        />
      </ReferenceInput>

      <ReferenceInput source="distributor_id" reference="organizations" isRequired>
        <AutocompleteInput
          optionText="name"
          label="Distributor *"
          filterToQuery={(q) => ({ "name@ilike": `%${q}%`, organization_type: "distributor" })}
          helperText="Select the distributor"
        />
      </ReferenceInput>

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
        defaultValue="pending"
        helperText={false}
      />

      <TextInput
        source="valid_from"
        label="Valid From"
        type="date"
        defaultValue={new Date().toISOString().split("T")[0]}
        helperText={false}
      />

      <TextInput source="valid_to" label="Valid To" type="date" helperText="Leave empty if ongoing" />

      <TextInput
        source="notes"
        label="Notes"
        multiline
        rows={3}
        fullWidth
        helperText={false}
      />
    </SimpleForm>
  </Create>
);

export default ProductDistributorCreate;
