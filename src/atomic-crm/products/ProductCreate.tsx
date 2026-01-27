import { CreateBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormProgressProvider, FormProgressBar } from "@/components/ra-wrappers/form";
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
      <div className="bg-muted mt-2 px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar schema={productSchema} className="mb-6" />
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
