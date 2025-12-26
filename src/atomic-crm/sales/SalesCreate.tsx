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
  // ═══════════════════════════════════════════════════════════════════════════
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  // React's Rules of Hooks: Hooks must run in the same order on every render
  // ═══════════════════════════════════════════════════════════════════════════

  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();

  // RBAC Guard: Only admins can access the create form
  const { canAccess, isPending: isCheckingAccess } = useCanAccess({
    resource: "sales",
    action: "create",
  });

  // Service and defaults (not hooks, but needed for useMutation below)
  const salesService = new SalesService(dataProvider);
  const formDefaults = {
    ...createSalesSchema.partial().parse({}),
  };

  // useMutation MUST be called before any early returns (Rules of Hooks)
  const { mutate, isPending: isCreating } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SalesFormData) => {
      return salesService.salesCreate(data);
    },
    onSuccess: () => {
      notify("User created. They will soon receive an email to set their password.");
      redirect("/sales");
    },
    onError: (error: Error) => {
      // Log for debugging
      console.error("[SalesCreate] Creation failed:", error);

      // Provide specific messages based on error type
      let message = "An error occurred while creating the user.";

      if (error.message?.includes("Not authenticated")) {
        message = "Your session has expired. Please log in again.";
        redirect("/login");
        return;
      }

      if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
        message = "A user with this email already exists.";
      }

      if (error.message?.includes("403") || error.message?.includes("Forbidden")) {
        message = "You don't have permission to create users.";
      }

      if (error.message?.includes("validation") || error.message?.includes("invalid")) {
        message = "Please check your input. Some fields may be invalid.";
      }

      notify(message, { type: "error" });
    },
  });

  // Redirect unauthorized users after permission check completes
  useEffect(() => {
    if (!isCheckingAccess && !canAccess) {
      notify("You don't have permission to create team members.", { type: "warning" });
      redirect("/sales");
    }
  }, [isCheckingAccess, canAccess, notify, redirect]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDITIONAL RETURNS - Safe to use AFTER all hooks are called
  // ═══════════════════════════════════════════════════════════════════════════

  // Show loading skeleton while checking permissions
  if (isCheckingAccess) {
    return <SalesListSkeleton />;
  }

  // Don't render form for unauthorized users
  if (!canAccess) {
    return null;
  }

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
          <SimpleForm<SalesFormData>
            onSubmit={onSubmit}
            defaultValues={formDefaults}
            disabled={isCreating}
          >
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
