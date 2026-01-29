import { EditBase, Form, useRecordContext, useGetIdentity } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { createFormResolver } from "@/lib/zodErrorFormatting";
import { productKeys, organizationKeys } from "../queryKeys";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/ra-wrappers/delete-button";
import { SaveButton } from "@/components/ra-wrappers/form";
import { CancelButton } from "@/components/ra-wrappers/cancel-button";
import { FormToolbar } from "@/components/ra-wrappers/simple-form";
import { ProductInputs } from "./ProductInputs";
import { productUpdateSchema } from "@/atomic-crm/validation/products";
import type { Product } from "../types";

const ProductEdit = () => {
  const queryClient = useQueryClient();

  return (
    <EditBase
      redirect="show"
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: (data) => {
          // Invalidate products cache
          queryClient.invalidateQueries({ queryKey: productKeys.all });

          // Invalidate linked distributors if present
          if (data?.distributor_ids && Array.isArray(data.distributor_ids)) {
            data.distributor_ids.forEach((distributorId) => {
              queryClient.invalidateQueries({
                queryKey: organizationKeys.detail(distributorId),
              });
            });
          }
        },
      }}
    >
      <div className="mt-2">
        <ProductEditForm />
      </div>
    </EditBase>
  );
};

const ProductEditForm = () => {
  const record = useRecordContext<Product>();
  const { data: identity } = useGetIdentity();

  const defaultValues = useMemo(
    () => ({
      ...productUpdateSchema.partial().parse(record ?? {}),
      updated_by: identity?.id,
    }),
    [record, identity?.id]
  );

  // Wait for record to load before rendering form
  if (!record) return null;

  return (
    <Form defaultValues={defaultValues} mode="onBlur" resolver={createFormResolver(productUpdateSchema)} key={record.id}>
      <Card>
        <CardContent>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Edit {record.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">Update product information</p>
          </div>

          <ProductInputs />

          <FormToolbar>
            <div className="flex flex-row gap-2 justify-between w-full">
              <DeleteButton />
              <div className="flex gap-2">
                <CancelButton />
                <SaveButton label="Save Changes" />
              </div>
            </div>
          </FormToolbar>
        </CardContent>
      </Card>
    </Form>
  );
};

export { ProductEdit };
export default ProductEdit;
