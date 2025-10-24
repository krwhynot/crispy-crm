import { SimpleForm } from "@/components/admin/simple-form";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import {
  useDataProvider,
  useEditController,
  useNotify,
  useRecordContext,
  useRedirect,
} from "ra-core";
import type { SubmitHandler } from "react-hook-form";
import { SalesService } from "../services";
import type { Sale, SalesFormData } from "../types";
import { formatName } from "../utils/formatName";
import { SalesInputs } from "./SalesInputs";

function EditToolbar() {
  return (
    <div className="flex justify-end gap-4">
      <CancelButton />
      <SaveButton />
    </div>
  );
}

export function SalesEdit() {
  const { record } = useEditController();

  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();

  // Create service instance using the base data provider
  const salesService = new SalesService(dataProvider);

  const { mutate } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SalesFormData) => {
      if (!record) {
        throw new Error("Record not found");
      }
      return salesService.salesUpdate(record.id, data);
    },
    onSuccess: () => {
      redirect("/sales");
      notify("User updated successfully");
    },
    onError: () => {
      notify("An error occurred. Please try again.");
    },
  });

  const onSubmit: SubmitHandler<SalesFormData> = async (data) => {
    mutate(data);
  };

  return (
    <div className="max-w-lg w-full mx-auto mt-8">
      <Card>
        <CardContent>
          <SimpleForm
            toolbar={<EditToolbar />}
            onSubmit={onSubmit as SubmitHandler<any>}
            record={record}
          >
            <SaleEditTitle />
            <SalesInputs />
          </SimpleForm>
        </CardContent>
      </Card>
    </div>
  );
}

const SaleEditTitle = () => {
  const record = useRecordContext<Sale>();
  if (!record) return null;
  return (
    <h2 className="text-lg font-semibold mb-4">
      Edit {formatName(record?.first_name, record?.last_name)}
    </h2>
  );
};
