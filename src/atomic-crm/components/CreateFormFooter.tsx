import { useNotify, useRedirect } from "ra-core";
import { useFormContext, useFormState } from "react-hook-form";
import { useCallback, useState } from "react";

import { AdminButton } from "@/components/admin/AdminButton";
import { SaveButton } from "@/components/ra-wrappers/form";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { ucFirst } from "@/atomic-crm/utils";

interface CreateFormFooterProps {
  resourceName: string;
  redirectPath: string;
  redirect?: (resource: string, id: string | number, data: unknown) => string;
  tutorialAttribute?: string;
  preserveFields?: string[]; // Fields to preserve on "Save & Add Another"
}

export const CreateFormFooter = ({
  resourceName,
  redirectPath,
  redirect,
  tutorialAttribute,
  preserveFields = [],
}: CreateFormFooterProps) => {
  const notify = useNotify();
  const redirectFn = useRedirect();
  const { reset, getValues } = useFormContext();
  const { isDirty } = useFormState();
  const [showDialog, setShowDialog] = useState(false);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowDialog(true);
      return;
    }
    redirectFn(redirectPath);
  }, [isDirty, redirectFn, redirectPath]);

  const handleError = useCallback(
    (error: Error) => {
      notify(error.message || `Failed to create ${resourceName}`, { type: "error" });
    },
    [notify, resourceName]
  );

  return (
    <div className="sticky bottom-12 bg-card border-t border-border p-4 flex justify-between mt-6">
      <AdminButton variant="outline" onClick={handleCancel} className="h-11">
        Cancel
      </AdminButton>
      <div className="flex gap-2">
        <SaveButton
          type="button"
          label="Save & Close"
          alwaysEnable
          data-tutorial={tutorialAttribute}
          mutationOptions={{
            onSuccess: (data: { id: string | number }) => {
              notify(`${ucFirst(resourceName)} created successfully`, { type: "success" });
              if (redirect) {
                redirectFn(redirect(resourceName + "s", data.id, data));
              } else {
                redirectFn(redirectPath);
              }
            },
            onError: handleError,
          }}
        />
        <SaveButton
          type="button"
          label="Save & Add Another"
          alwaysEnable
          mutationOptions={{
            onSuccess: () => {
              notify(`${ucFirst(resourceName)} created successfully`, { type: "success" });
              // Preserve specified fields for rapid entry (e.g., organization_id)
              if (preserveFields.length > 0) {
                const currentValues = getValues();
                const valuesToPreserve = preserveFields.reduce<Record<string, unknown>>(
                  (acc, field) => {
                    if (currentValues[field] !== undefined) {
                      acc[field] = currentValues[field];
                    }
                    return acc;
                  },
                  {}
                );
                reset(valuesToPreserve);
              } else {
                reset();
              }
            },
            onError: handleError,
          }}
        />
      </div>
      <UnsavedChangesDialog
        open={showDialog}
        onConfirm={() => {
          setShowDialog(false);
          redirectFn(redirectPath);
        }}
        onCancel={() => setShowDialog(false)}
      />
    </div>
  );
};
