import { SimpleForm } from "@/components/ra-wrappers/simple-form";
import { FormErrorSummary } from "@/components/ra-wrappers/FormErrorSummary";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saleKeys } from "@/atomic-crm/queryKeys";
import { useCanAccess, useDataProvider, useNotify, useRedirect } from "ra-core";
import { logger } from "@/lib/logger";
import { useFormContext, useFormState } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { SalesService } from "../services";
import type { SalesFormData } from "../types";
import { createSalesSchema } from "../validation/sales";
import { SalesInputs } from "./SalesInputs";
import { SalesListSkeleton } from "@/components/ui/list-skeleton";
import { useEffect, useState } from "react";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { isHttpError } from "@/lib/type-guards";

interface ServerValidationError extends Error {
  body?: {
    errors?: Record<string, string | { serverError?: string }>;
  };
}

export default function SalesCreate() {
  // ═══════════════════════════════════════════════════════════════════════════
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  // React's Rules of Hooks: Hooks must run in the same order on every render
  // ═══════════════════════════════════════════════════════════════════════════

  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();
  const queryClient = useQueryClient();

  // Server error state for form field error surfacing
  const [serverError, setServerError] = useState<ServerValidationError | null>(null);

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
    mutationKey: saleKeys.all,
    mutationFn: async (data: SalesFormData) => {
      // Clear previous server errors before submitting
      setServerError(null);
      return salesService.salesCreate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all });
      notify("User created. They will soon receive an email to set their password.");
      redirect("/sales");
    },
    onError: (error: Error) => {
      logger.error("SalesCreate failed", error, { feature: "SalesCreate" });

      // Handle authentication errors with redirect
      if (error.message?.includes("Not authenticated")) {
        notify("Your session has expired. Please log in again.", { type: "error" });
        redirect("/login");
        return;
      }

      // Check if error has body.errors format (HttpError from service layer)
      if (isHttpError(error) && error.body?.errors) {
        // Store server error for form field mapping
        setServerError(error as ServerValidationError);

        // Extract root server error message for toast notification
        const rootError = error.body.errors.root;
        const rootMessage =
          typeof rootError === "object" && rootError?.serverError
            ? rootError.serverError
            : typeof rootError === "string"
              ? rootError
              : error.message;

        notify(rootMessage, { type: "error" });
        return;
      }

      // Fallback for errors without body.errors format
      let message = "An error occurred while creating the user.";

      if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
        message = "A user with this email already exists.";
      } else if (error.message?.includes("403") || error.message?.includes("Forbidden")) {
        message = "You don't have permission to create users.";
      } else if (error.message?.includes("validation") || error.message?.includes("invalid")) {
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
      <SectionCard title="Create a new user">
        <SimpleForm<SalesFormData>
          onSubmit={onSubmit}
          defaultValues={formDefaults}
          disabled={isCreating}
        >
          <SalesFormContent serverError={serverError} />
        </SimpleForm>
      </SectionCard>
    </div>
  );
}

interface SalesFormContentProps {
  serverError: ServerValidationError | null;
}

const SalesFormContent = ({ serverError }: SalesFormContentProps) => {
  useUnsavedChangesWarning();
  const { setError, clearErrors } = useFormContext<SalesFormData>();
  const { errors } = useFormState();

  // Apply server validation errors to form fields
  useEffect(() => {
    if (serverError?.body?.errors) {
      // Clear previous errors before setting new ones
      clearErrors();

      // Map server errors to form fields, setting aria-invalid via setError
      Object.entries(serverError.body.errors).forEach(([field, errorValue]) => {
        // Skip root error as it's shown in toast
        if (field === "root") return;

        // Extract message from error value (can be string or { serverError: string })
        const message =
          typeof errorValue === "string"
            ? errorValue
            : typeof errorValue === "object" && errorValue?.serverError
              ? errorValue.serverError
              : "Invalid value";

        // Set error on the field (this automatically sets aria-invalid on React Admin inputs)
        setError(field as keyof SalesFormData, { type: "server", message });
      });
    }
  }, [serverError, setError, clearErrors]);

  return (
    <>
      <FormErrorSummary errors={errors} />
      <SalesInputs />
    </>
  );
};
