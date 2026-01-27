import { useMemo } from "react";
import { SimpleForm } from "@/components/ra-wrappers/simple-form";
import { CancelButton } from "@/components/ra-wrappers/cancel-button";
import { SaveButton } from "@/components/ra-wrappers/form";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saleKeys } from "@/atomic-crm/queryKeys";
import {
  useDataProvider,
  useEditController,
  useNotify,
  useRecordContext,
  useRedirect,
} from "ra-core";
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";
import type { SubmitHandler } from "react-hook-form";
import { SalesService } from "../services";
import type { Sale, SalesFormData } from "../types";
import { formatName } from "../utils/formatName";
import { SalesInputs } from "./SalesInputs";
import { updateSalesSchema } from "@/atomic-crm/validation/sales";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";

function EditToolbar() {
  return (
    <div className="flex justify-end gap-4">
      <CancelButton />
      <SaveButton />
    </div>
  );
}

export default function SalesEdit() {
  const { record } = useEditController();

  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();

  // Create service instance using the base data provider
  const salesService = new SalesService(dataProvider);
  const queryClient = useQueryClient();

  const defaultValues = useMemo(() => updateSalesSchema.partial().parse(record), [record]);

  const { mutate } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SalesFormData) => {
      if (!record) {
        throw new Error("Record not found");
      }
      return salesService.salesUpdate(record.id, data);
    },
    onSuccess: () => {
      // SS-002 FIX: Invalidate sales caches before redirect
      queryClient.invalidateQueries({ queryKey: saleKeys.all });
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(record?.id ?? 0) });

      redirect("/sales");
      notify(notificationMessages.updated("User"), { type: "success" });
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
          <SimpleForm<SalesFormData>
            toolbar={<EditToolbar />}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            key={record?.id}
          >
            <SalesFormContent />
          </SimpleForm>
        </CardContent>
      </Card>
    </div>
  );
}

const SalesFormContent = () => {
  useUnsavedChangesWarning();

  return (
    <>
      <SaleEditTitle />
      <SalesInputs />
    </>
  );
};

const SaleEditTitle = () => {
  const record = useRecordContext<Sale>();
  if (!record) return null;
  return (
    <h2 className="text-lg font-semibold mb-4">
      Edit {formatName(record?.first_name, record?.last_name)}
    </h2>
  );
};
