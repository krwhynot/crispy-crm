import { TextField, DateField, SelectField } from "react-admin";
import { List } from "@/components/ra-wrappers/list";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { UnifiedListPageLayout } from "@/components/layouts/UnifiedListPageLayout";
import { CreateButton } from "@/components/ra-wrappers/create-button";
import { PRODUCT_DISTRIBUTOR_STATUS_CHOICES } from "./constants";
import { ProductDistributorListFilter } from "./ProductDistributorListFilter";
import { PRODUCT_DISTRIBUTOR_FILTER_CONFIG } from "./productDistributorFilterConfig";

export const ProductDistributorList = () => (
  <List title={false} actions={false} perPage={25} sort={{ field: "created_at", order: "DESC" }}>
    <UnifiedListPageLayout
      resource="product_distributors"
      filterComponent={<ProductDistributorListFilter />}
      filterConfig={PRODUCT_DISTRIBUTOR_FILTER_CONFIG}
      sortFields={["created_at", "status", "valid_from"]}
      searchPlaceholder="Search product distributors..."
      primaryAction={<CreateButton />}
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
    </UnifiedListPageLayout>
  </List>
);

export default ProductDistributorList;
