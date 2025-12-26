import { SimpleForm } from "@/components/admin/simple-form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useCanAccess, useDataProvider, useNotify, useRedirect } from "ra-core";
import { useFormState } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { SalesService } from "../services";
import type { SalesFormData } from "../types";
import { createSalesSchema } from "../validation/sales";
import { SalesInputs } from "./SalesInputs";
import { SalesListSkeleton } from "@/components/ui/list-skeleton";
import { useEffect } from "react";

export default function SalesCreate() {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();

  // RBAC Guard: Only admins can access the create form
  const { canAccess, isPending: isCheckingAccess } = useCanAccess({
    resource: "sales",
    action: "create",
  });

  // Redirect unauthorized users after permission check completes
  useEffect(() => {
    if (!isCheckingAccess && !canAccess) {
      notify("You don't have permission to create team members.", { type: "warning" });
      redirect("/sales");
    }
  }, [isCheckingAccess, canAccess, notify, redirect]);

  // Show loading skeleton while checking permissions
  if (isCheckingAccess) {
    return <SalesListSkeleton />;
  }

  // Don't render form for unauthorized users
  if (!canAccess) {
    return null;
  }

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
    <div className="bg-muted max-w-lg w-full mx-auto mt-8 px-6 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a new user</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleForm<SalesFormData> onSubmit={onSubmit} defaultValues={formDefaults}>
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
