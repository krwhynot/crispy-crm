import { List, Datagrid, TextField, ReferenceField, DateField, SelectField } from "react-admin";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { ReferenceInput } from "@/components/ra-wrappers/reference-input";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { PRODUCT_DISTRIBUTOR_STATUS_CHOICES } from "./constants";
import { AUTOCOMPLETE_DEBOUNCE_MS, shouldRenderSuggestions } from "../utils/autocompleteDefaults";

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
    <AutocompleteInput
      debounce={AUTOCOMPLETE_DEBOUNCE_MS}
      shouldRenderSuggestions={shouldRenderSuggestions}
      optionText="name"
      label="Product"
      filterToQuery={(q) => ({ "name@ilike": `%${q}%` })}
    />
  </ReferenceInput>,
  <ReferenceInput key="distributor_id" source="distributor_id" reference="organizations">
    <AutocompleteInput
      debounce={AUTOCOMPLETE_DEBOUNCE_MS}
      shouldRenderSuggestions={shouldRenderSuggestions}
      optionText="name"
      label="Distributor"
      filterToQuery={(q) => ({ "name@ilike": `%${q}%`, organization_type: "distributor" })}
    />
  </ReferenceInput>,
];

export const ProductDistributorList = () => (
  <List
    filters={productDistributorFilters}
    sort={{ field: "created_at", order: "DESC" }}
    perPage={25}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <ReferenceField source="product_id" reference="products" label="Product">
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField source="distributor_id" reference="organizations" label="Distributor">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="vendor_item_number" label="DOT Number" />
      <SelectField source="status" choices={PRODUCT_DISTRIBUTOR_STATUS_CHOICES} />
      <DateField source="valid_from" label="Valid From" />
      <DateField source="valid_to" label="Valid To" emptyText="-" />
    </Datagrid>
  </List>
);

export default ProductDistributorList;
