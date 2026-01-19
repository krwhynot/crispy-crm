/**
 * OpportunityCreateFormFooter
 *
 * Custom footer for opportunity creation that follows the CreateFormFooter pattern
 * (Cancel, Save & Close, Save & Add Another) while integrating the Levenshtein
 * fuzzy match warning system for duplicate detection.
 *
 * This component wraps the standard footer pattern but intercepts save actions
 * to check for similar opportunities before proceeding.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNotify, useRedirect } from "ra-core";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { setSubmissionErrors, useSaveContext, useTranslate } from "ra-core";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { cn } from "@/lib/utils";
import type { SimilarityCheckResult } from "../../utils/levenshtein";

interface OpportunityCreateFormFooterProps {
  checkForSimilar: (name: string) => Promise<SimilarityCheckResult>;
  hasConfirmed: boolean;
  resetConfirmation: () => void;
  redirectPath?: string;
  preserveFields?: string[];
  tutorialAttribute?: string;
}

export function OpportunityCreateFormFooter({
  checkForSimilar,
  hasConfirmed,
  resetConfirmation,
  redirectPath = "/opportunities",
  preserveFields = ["customer_organization_id", "principal_id"],
  tutorialAttribute = "opp-save-btn",
}: OpportunityCreateFormFooterProps) {
  const translate = useTranslate();
  const notify = useNotify();
  const redirectFn = useRedirect();
  const form = useFormContext();
  const saveContext = useSaveContext();
  const { isDirty, isSubmitting, isValidating, dirtyFields } = useFormState();
  const { reset, getValues } = useFormContext();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Track previous name value to reset confirmation when name changes
  const previousNameRef = useRef<string | null>(null);

  // Watch the name field for changes
  const currentName = useWatch({ control: form.control, name: "name" });

  // Reset confirmation when name changes significantly
  useEffect(() => {
    if (previousNameRef.current !== null && previousNameRef.current !== currentName) {
      resetConfirmation();
    }
    previousNameRef.current = currentName;
  }, [currentName, resetConfirmation]);

  // Calculate disabled state
  const hasDirtyFields = Object.keys(dirtyFields).length > 0;
  const disabled = !hasDirtyFields || isValidating || isSubmitting;

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelDialog(true);
      return;
    }
    redirectFn(redirectPath);
  }, [isDirty, redirectFn, redirectPath]);

  const handleError = useCallback(
    (error: Error) => {
      notify(error.message || "Failed to create opportunity", { type: "error" });
    },
    [notify]
  );

  /**
   * Base submit handler that goes through React Admin's save context
   */
  const handleSubmit = useCallback(
    async (
      values: Record<string, unknown>,
      onSuccessCallback?: (data: { id: string | number }) => void
    ) => {
      let errors;
      if (saveContext?.save) {
        errors = await saveContext.save(values, {
          onSuccess: onSuccessCallback,
          onError: handleError,
        });
      }
      if (errors != null) {
        setSubmissionErrors(errors, form.setError);
      }
    },
    [form.setError, saveContext, handleError]
  );

  /**
   * Check for similar opportunities before submitting
   * Returns true if we should proceed with save, false if blocked by dialog
   */
  const checkBeforeSubmit = useCallback(async (): Promise<boolean> => {
    const values = form.getValues();
    const name = values.name;

    // Skip check if already confirmed or name is empty
    if (!hasConfirmed && name && name.trim().length > 0) {
      const result = await checkForSimilar(name);

      // If similar opportunities found, don't submit - dialog will show
      if (result.hasSimilar) {
        return false;
      }
    }

    return true;
  }, [form, hasConfirmed, checkForSimilar]);

  /**
   * Save & Close handler
   */
  const handleSaveAndClose = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      // Check for similar opportunities first
      if (!(await checkBeforeSubmit())) {
        return;
      }

      // Proceed with save
      await form.handleSubmit(async (values) => {
        await handleSubmit(values, () => {
          notify("Opportunity created successfully", { type: "success" });
          redirectFn(redirectPath);
        });
      })(event);
    },
    [checkBeforeSubmit, form, handleSubmit, notify, redirectFn, redirectPath]
  );

  /**
   * Save & Add Another handler
   */
  const handleSaveAndAddAnother = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      // Check for similar opportunities first
      if (!(await checkBeforeSubmit())) {
        return;
      }

      // Proceed with save
      await form.handleSubmit(async (values) => {
        await handleSubmit(values, () => {
          notify("Opportunity created successfully", { type: "success" });

          // Preserve specified fields for rapid entry
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

          // Reset confirmation state for next entry
          resetConfirmation();
        });
      })(event);
    },
    [
      checkBeforeSubmit,
      form,
      handleSubmit,
      notify,
      preserveFields,
      getValues,
      reset,
      resetConfirmation,
    ]
  );

  return (
    <>
      <div className="sticky bottom-12 bg-card border-t border-border p-4 flex justify-between mt-6">
        <Button variant="outline" onClick={handleCancel} className="h-11">
          {translate("ra.action.cancel", { _: "Cancel" })}
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="default"
            disabled={disabled}
            onClick={handleSaveAndClose}
            data-tutorial={tutorialAttribute}
            className={cn(
              "h-11 min-w-[140px]",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {translate("ra.action.save", { _: "Save & Close" })}
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={disabled}
            onClick={handleSaveAndAddAnother}
            className={cn(
              "h-11 min-w-[160px]",
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save & Add Another
          </Button>
        </div>
      </div>
      <UnsavedChangesDialog
        open={showCancelDialog}
        onConfirm={() => {
          setShowCancelDialog(false);
          redirectFn(redirectPath);
        }}
        onCancel={() => setShowCancelDialog(false)}
      />
    </>
  );
}
