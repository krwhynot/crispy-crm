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
import { createFormResolver } from "@/lib/zodErrorFormatting";
import { SalesInputs } from "./SalesInputs";
import { SalesListSkeleton } from "@/components/ui/list-skeleton";
import { useEffect, useState } from "react";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { isHttpError } from "@/lib/type-guards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ServerValidationError extends Error {
  body?: {
    errors?: Record<string, string | { serverError?: string }>;
  };
}

export default function SalesCreate() {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();
  const queryClient = useQueryClient();

  const [serverError, setServerError] = useState<ServerValidationError | null>(null);
  const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { canAccess, isPending: isCheckingAccess } = useCanAccess({
    resource: "sales",
    action: "create",
  });

  const salesService = new SalesService(dataProvider);
  const formDefaults = {
    ...createSalesSchema.partial().parse({}),
  };

  const { mutate, isPending: isCreating } = useMutation({
    mutationKey: saleKeys.all,
    mutationFn: async (data: SalesFormData) => {
      setServerError(null);
      return salesService.salesCreate(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all });
      if (result.recoveryUrl) {
        setRecoveryUrl(result.recoveryUrl);
      } else {
        notify(
          "User created. Use 'Reset Password' on their profile to generate a login link.",
          { type: "success" }
        );
        redirect("/sales");
      }
    },
    onError: (error: Error) => {
      logger.error("SalesCreate failed", error, { feature: "SalesCreate" });

      if (error.message?.includes("Not authenticated")) {
        notify("Your session has expired. Please log in again.", { type: "error" });
        redirect("/login");
        return;
      }

      if (isHttpError(error) && error.body?.errors) {
        setServerError(error as ServerValidationError);
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

  useEffect(() => {
    if (!isCheckingAccess && !canAccess) {
      notify("You don't have permission to create team members.", { type: "warning" });
      redirect("/sales");
    }
  }, [isCheckingAccess, canAccess, notify, redirect]);

  if (isCheckingAccess) return <SalesListSkeleton />;
  if (!canAccess) return null;

  const onSubmit: SubmitHandler<SalesFormData> = async (data) => {
    mutate(data);
  };

  const handleCopyLink = () => {
    if (recoveryUrl) {
      navigator.clipboard.writeText(recoveryUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDialogClose = () => {
    setRecoveryUrl(null);
    redirect("/sales");
  };

  return (
    <>
      <div className="bg-muted max-w-lg w-full mx-auto mt-8 px-6 py-6">
        <SectionCard title="Create a new user">
          <SimpleForm<SalesFormData>
            onSubmit={onSubmit}
            defaultValues={formDefaults}
            disabled={isCreating}
            resolver={createFormResolver(createSalesSchema)}
          >
            <SalesFormContent serverError={serverError} />
          </SimpleForm>
        </SectionCard>
      </div>

      <Dialog open={!!recoveryUrl} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User Created Successfully</DialogTitle>
            <DialogDescription>
              Share this one-time link with the new user so they can set their password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              <input
                readOnly
                value={recoveryUrl ?? ""}
                className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm font-mono truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 cursor-pointer"
                onClick={handleCopyLink}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Some email or chat tools may consume the link when generating a preview.
              If the link doesn&apos;t work, use &quot;Reset Password&quot; on the user&apos;s
              profile page.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" className="cursor-pointer" onClick={handleDialogClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface SalesFormContentProps {
  serverError: ServerValidationError | null;
}

const SalesFormContent = ({ serverError }: SalesFormContentProps) => {
  useUnsavedChangesWarning();
  const { setError, clearErrors } = useFormContext<SalesFormData>();
  const { errors } = useFormState();

  useEffect(() => {
    if (serverError?.body?.errors) {
      clearErrors();
      Object.entries(serverError.body.errors).forEach(([field, errorValue]) => {
        if (field === "root") return;
        const message =
          typeof errorValue === "string"
            ? errorValue
            : typeof errorValue === "object" && errorValue?.serverError
              ? errorValue.serverError
              : "Invalid value";
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
