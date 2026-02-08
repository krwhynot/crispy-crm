import { useMemo } from "react";
import { CreateBase, Form, useGetIdentity } from "ra-core";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { FormProgressProvider, FormProgressBar } from "@/components/ra-wrappers/form";
import { CreateFormFooter } from "../components/CreateFormFooter";
import { createFormResolver } from "@/lib/zodErrorFormatting";

import { ProductInputs } from "./ProductInputs";
import { productSchema } from "../validation/products";
import { ProductFormTutorial } from "./ProductFormTutorial";

const ProductCreate = () => {
  const { data: identity, isLoading: isIdentityLoading } = useGetIdentity();

  // Memoize defaultValues with stable identity.id to prevent form reset
  // when identity loads asynchronously (ra-core Form resets on defaultValues change)
  const defaultValues = useMemo(
    () => ({
      ...productSchema.partial().parse({}),
      created_by: identity?.id,
    }),
    [identity?.id]
  );

  // Guard: Wait for identity to load before rendering form
  // Prevents form reset when identity loads after user starts typing
  if (isIdentityLoading || !identity?.id) {
    return (
      <div className="bg-muted mt-2 px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted-foreground/10 rounded w-1/4" />
            <div className="h-10 bg-muted-foreground/10 rounded" />
            <div className="h-24 bg-muted-foreground/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <CreateBase redirect="show">
      <div className="bg-muted mt-2 px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar schema={productSchema} className="mb-6" />
            <Form
              defaultValues={defaultValues}
              mode="onBlur"
              resolver={createFormResolver(productSchema)}
            >
              <SectionCard>
                <ProductFormContent />
              </SectionCard>
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
