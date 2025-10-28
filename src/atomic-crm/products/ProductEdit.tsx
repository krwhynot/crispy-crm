import { EditBase, Form, useRecordContext, useGetIdentity } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/admin/delete-button";
import { SaveButton } from "@/components/admin/form";
import { CancelButton } from "@/components/admin/cancel-button";
import { FormToolbar } from "@/components/admin/simple-form";
import { ProductInputs } from "./ProductInputs";
import type { Product } from "../types";

const ProductEdit = () => {
  const queryClient = useQueryClient();

  return (
    <EditBase
      redirect="show"
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          // Invalidate products cache
          queryClient.invalidateQueries({ queryKey: ["products"] });
        },
      }}
    >
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <ProductEditForm />
        </div>
      </div>
    </EditBase>
  );
};

const ProductEditForm = () => {
  const record = useRecordContext<Product>();
  const { identity } = useGetIdentity();

  // Wait for record to load before rendering form
  if (!record) return null;

  return (
    <Form
      defaultValues={{
        ...record,
        updated_by: identity?.id,
      }}
      key={record.id} // Force remount when record changes
    >
      <Card>
        <CardContent>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Edit {record.name}</h2>
            <p className="text-sm text-[color:var(--text-subtle)] mt-1">
              Update product information
            </p>
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
