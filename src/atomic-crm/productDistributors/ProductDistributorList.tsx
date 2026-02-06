import { List, TextField, DateField, SelectField } from "react-admin";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { PRODUCT_DISTRIBUTOR_STATUS_CHOICES } from "./constants";
import { getAutocompleteProps, getQSearchAutocompleteProps } from "../utils/autocompleteDefaults";

const productDistributorFilters = [
  <TextInput
    key="vendor_item_number"
    source="vendor_item_number@ilike"
    label="DOT Number"
    alwaysOn
    placeholder="Search DOT numbers..."
  />,
  <SelectInput
    key="status"
    source="status"
    label="Status"
    choices={PRODUCT_DISTRIBUTOR_STATUS_CHOICES}
    emptyText="All statuses"
  />,
  <ReferenceInput key="product_id" source="product_id" reference="products">
    <AutocompleteInput {...getAutocompleteProps("name")} optionText="name" label="Product" />
  </ReferenceInput>,
  <ReferenceInput
    key="distributor_id"
    source="distributor_id"
    reference="organizations"
    filter={{ organization_type: "distributor" }}
  >
    <AutocompleteInput {...getQSearchAutocompleteProps()} optionText="name" label="Distributor" />
  </ReferenceInput>,
];

export const ProductDistributorList = () => (
  <List
    filters={productDistributorFilters}
    sort={{ field: "created_at", order: "DESC" }}
    perPage={25}
  >
    <PremiumDatagrid rowClick="edit" bulkActionButtons={false}>
      {/* Use denormalized fields from summary view to eliminate N+1 queries */}
      <TextField source="product_name" label="Product" />
      <TextField source="distributor_name" label="Distributor" />
      <TextField source="vendor_item_number" label="DOT Number" />
      <SelectField source="status" choices={PRODUCT_DISTRIBUTOR_STATUS_CHOICES} />
      <DateField source="valid_from" label="Valid From" />
      <DateField source="valid_to" label="Valid To" emptyText="-" />
    </PremiumDatagrid>
  </List>
);

export default ProductDistributorList;
