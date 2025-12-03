import { SimpleForm } from "@/components/admin/simple-form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useDataProvider, useNotify, useRedirect } from "ra-core";
import { useFormState } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { SalesService } from "../services";
import type { SalesFormData } from "../types";
import { createSalesSchema } from "../validation/sales";
import { SalesInputs } from "./SalesInputs";

export default function SalesCreate() {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();

  const salesService = new SalesService(dataProvider);

  const formDefaults = {
    ...createSalesSchema.partial().parse({}),
  };

  const { mutate } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SalesFormData) => {
      return salesService.salesCreate(data);
    },
    onSuccess: () => {
      notify("User created. They will soon receive an email to set their password.");
      redirect("/sales");
    },
    onError: () => {
      notify("An error occurred while creating the user.", {
        type: "error",
      });
    },
  });
  const onSubmit: SubmitHandler<SalesFormData> = async (data) => {
    mutate(data);
  };

  return (
    <div className="max-w-lg w-full mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Create a new user</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleForm onSubmit={onSubmit as SubmitHandler<any>} defaultValues={formDefaults}>
            <SalesFormContent />
          </SimpleForm>
        </CardContent>
      </Card>
    </div>
  );
}

const SalesFormContent = () => {
  const { errors } = useFormState();

  return (
    <>
      <FormErrorSummary errors={errors} />
      <SalesInputs />
    </>
  );
};
