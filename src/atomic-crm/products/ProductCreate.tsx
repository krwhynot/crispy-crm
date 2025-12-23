import { CreateBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import {
  FormProgressProvider,
  FormProgressBar,
} from "@/components/admin/form";
import { CreateFormFooter } from "../components/CreateFormFooter";

import { ProductInputs } from "./ProductInputs";
import { productSchema } from "../validation/products";
import { ProductFormTutorial } from "./ProductFormTutorial";

const ProductCreate = () => {
  const { data: identity } = useGetIdentity();

  // Constitution Rule #4: Form state from schema
  const defaultValues = {
    ...productSchema.partial().parse({}),
    created_by: identity?.id,
  };

  return (
    <CreateBase redirect="show">
      <div className="bg-muted mt-2 flex lg:mr-72 px-6 py-6">
        <div className="flex-1">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar className="mb-6" />
            <Form defaultValues={defaultValues} mode="onBlur">
              <Card>
                <CardContent>
                  <ProductFormContent />
                </CardContent>
              </Card>
            </Form>
          </FormProgressProvider>
        </div>
      </div>
      <ProductFormTutorial />
    </CreateBase>
  );
};

const ProductFormContent = () => {
  return (
    <>
      <ProductInputs />
      <CreateFormFooter
        resourceName="product"
        redirectPath="/products"
        tutorialAttribute="product-save-btn"
      />
    </>
  );
};

export { ProductCreate };
export default ProductCreate;
