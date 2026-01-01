import { Edit, SimpleForm, ReferenceField, TextField } from "react-admin";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { PRODUCT_DISTRIBUTOR_STATUS_CHOICES } from "./constants";

export const ProductDistributorEdit = () => (
  <Edit redirect="list">
    <SimpleForm>
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

      <TextInput
        source="vendor_item_number"
        label="DOT Number"
        helperText="Distributor's internal product code"
        fullWidth
      />

      <SelectInput
        source="status"
        label="Status"
        choices={PRODUCT_DISTRIBUTOR_STATUS_CHOICES}
        helperText={false}
      />

      <TextInput source="valid_from" label="Valid From" type="date" helperText={false} />

      <TextInput
        source="valid_to"
        label="Valid To"
        type="date"
        helperText="Leave empty if ongoing"
      />

      <TextInput source="notes" label="Notes" multiline rows={3} fullWidth helperText={false} />
    </SimpleForm>
  </Edit>
);

export default ProductDistributorEdit;
