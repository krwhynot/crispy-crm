import { CreateBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton, SaveButton, FormToolbar } from "@/components/admin";

import { ProductInputs } from "./ProductInputs";

const ProductCreate = () => {
  const { identity } = useGetIdentity();
  return (
    <CreateBase
      redirect="show"
      transform={(values) => {
        // Set default values if not provided
        if (!values.status) {
          values.status = "active";
        }
        if (!values.category) {
          values.category = "equipment";
        }
        // Ensure numeric fields are properly formatted
        if (values.list_price) {
          values.list_price = parseFloat(values.list_price);
        }
        if (values.cost_per_unit) {
          values.cost_per_unit = parseFloat(values.cost_per_unit);
        }
        return values;
      }}
    >
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form defaultValues={{
            status: "active",
            category: "equipment",
            created_by: identity?.id
          }}>
            <Card>
              <CardContent>
                <ProductInputs />
                <FormToolbar>
                  <div className="flex flex-row gap-2 justify-end">
                    <CancelButton />
                    <SaveButton label="Create Product" />
                  </div>
                </FormToolbar>
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
};

export { ProductCreate };
export default ProductCreate;