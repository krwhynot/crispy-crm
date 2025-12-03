import { CreateBase, Form, useGetIdentity } from "ra-core";
import { useFormState } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { FormToolbar } from "@/components/admin/simple-form";

import { ProductInputs } from "./ProductInputs";
import { productSchema } from "../validation/products";

const ProductCreate = () => {
  const { data: identity } = useGetIdentity();

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
                <ProductFormContent />
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
};

const ProductFormContent = () => {
  const { errors } = useFormState();

  return (
    <>
      <FormErrorSummary errors={errors} />
      <ProductInputs />
      <FormToolbar>
        <div className="flex flex-row gap-2 justify-end">
          <CancelButton />
          <SaveButton label="Create Product" />
        </div>
      </FormToolbar>
    </>
  );
};

export { ProductCreate };
export default ProductCreate;
