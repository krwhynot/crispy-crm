import { CreateBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";

import { ProductInputs } from "./ProductInputs";
import { productSchema } from "../validation/products";

const ProductCreate = () => {
  const { identity } = useGetIdentity();

  // Constitution Rule #4: Form state from schema
  const defaultValues = {
    ...productSchema.partial().parse({}),
    created_by: identity?.id,
  };

  return (
    <CreateBase redirect="show">
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form defaultValues={defaultValues}>
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
