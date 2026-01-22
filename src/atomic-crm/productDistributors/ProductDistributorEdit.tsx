import { Edit, SimpleForm, ReferenceField, TextField } from "react-admin";
import { ProductDistributorInputs } from "./ProductDistributorInputs";

/**
 * ProductDistributorEdit
 *
 * Edit form for product-distributor authorizations.
 * Product and Distributor are displayed read-only (immutable after creation).
 * Uses shared ProductDistributorInputs for consistent form fields.
 */
export const ProductDistributorEdit = () => (
  <Edit redirect="list">
    <SimpleForm>
      {/* Read-only display of Product/Distributor (immutable after creation) */}
      <div className="space-y-4 mb-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-medium text-muted-foreground">
          Product-Distributor Relationship
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-muted-foreground">Product</span>
            <ReferenceField source="product_id" reference="products">
              <TextField source="name" className="font-medium" />
            </ReferenceField>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Distributor</span>
            <ReferenceField source="distributor_id" reference="organizations">
              <TextField source="name" className="font-medium" />
            </ReferenceField>
          </div>
        </div>
      </div>

      {/* Shared editable inputs */}
      <ProductDistributorInputs />
    </SimpleForm>
  </Edit>
);

export default ProductDistributorEdit;
