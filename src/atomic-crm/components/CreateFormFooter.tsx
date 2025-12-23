import { useNotify, useRedirect } from "ra-core";
import { useFormContext, useFormState } from "react-hook-form";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/admin/form";

interface CreateFormFooterProps {
  resourceName: string;
  redirectPath: string;
  tutorialAttribute?: string;
}

export const CreateFormFooter = ({
  resourceName,
  redirectPath,
  tutorialAttribute,
}: CreateFormFooterProps) => {
  const notify = useNotify();
  const redirect = useRedirect();
  const { reset } = useFormContext();
  const { isDirty } = useFormState();

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) return;
    }
    redirect(redirectPath);
  }, [isDirty, redirect, redirectPath]);

  const handleError = useCallback(
    (error: Error) => {
      notify(error.message || `Failed to create ${resourceName}`, { type: "error" });
    },
    [notify, resourceName]
  );

  return (
    <div className="sticky bottom-12 bg-card border-t border-border p-4 flex justify-between mt-6">
      <Button variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
      <div className="flex gap-2">
        <SaveButton
          type="button"
          label="Save & Close"
          alwaysEnable
          data-tutorial={tutorialAttribute}
          mutationOptions={{
            onSuccess: () => {
              notify(`${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} created successfully`, { type: "success" });
              redirect(redirectPath);
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
              notify(`${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} created successfully`, { type: "success" });
              reset();
            },
            onError: handleError,
          }}
        />
      </div>
    </div>
  );
};
