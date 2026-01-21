/**
 * OrganizationCreateFormFooter - Footer with duplicate check integration
 *
 * Combines the CreateFormFooter pattern (Cancel | Save & Close | Save & Add Another)
 * with the duplicate check logic required for organizations.
 *
 * Pattern: Each save button checks for duplicates before triggering the hidden submit.
 */
import { useRedirect, useCreate } from "ra-core";
import { useFormContext, useFormState } from "react-hook-form";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ra-wrappers/form";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";
import type { OrganizationFormValues, DuplicateCheckCallback } from "./types";

interface OrganizationCreateFormFooterProps {
  onDuplicateFound: DuplicateCheckCallback;
  checkForDuplicate: (name: string) => Promise<{ id: string | number; name: string } | null>;
  isChecking: boolean;
  redirectPath?: string;
  preserveFields?: string[];
  transformValues: (values: OrganizationFormValues) => OrganizationFormValues;
  bypassDuplicate: () => void;
}

type SaveAction = "close" | "addAnother";

export const OrganizationCreateFormFooter = ({
  onDuplicateFound,
  checkForDuplicate,
  isChecking,
  redirectPath = "/organizations",
  preserveFields = ["parent_organization_id", "organization_type", "segment_id", "sales_id"],
  transformValues,
  bypassDuplicate,
}: OrganizationCreateFormFooterProps) => {
  const notify = useNotify();
  const redirectFn = useRedirect();
  const { reset, getValues, trigger } = useFormContext();
  const { isDirty } = useFormState();
  const [create] = useCreate();
  const [isCreating, setIsCreating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Track which save action was clicked
  const pendingActionRef = useRef<SaveAction | null>(null);
  // Hidden submit button ref (not used for actual submission, but kept for pattern consistency)
  const hiddenSubmitRef = useRef<HTMLButtonElement>(null);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelDialog(true);
      return;
    }
    redirectFn(redirectPath);
  }, [isDirty, redirectFn, redirectPath]);

  /**
   * Core save logic after duplicate check passes or is bypassed.
   * Handles both "Save & Close" and "Save & Add Another" actions.
   */
  const performSave = useCallback(
    async (action: SaveAction) => {
      const values = getValues() as OrganizationFormValues;
      const transformedValues = transformValues(values);

      setIsCreating(true);
      try {
        await create(
          "organizations",
          { data: transformedValues },
          {
            onSuccess: (data: { id: string | number }) => {
              bypassDuplicate();
              notify("Organization created successfully", { type: "success" });

              if (action === "close") {
                redirectFn("show", "organizations", data.id);
              } else {
                // Save & Add Another - preserve specified fields
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
              }
            },
            onError: (error: unknown) => {
              notify(error instanceof Error ? error.message : "Failed to create organization", {
                type: "error",
              });
            },
          }
        );
      } finally {
        setIsCreating(false);
      }
    },
    [getValues, transformValues, create, bypassDuplicate, notify, redirectFn, preserveFields, reset]
  );

  /**
   * Handle save button click with duplicate check.
   * If duplicate found, stores the pending action and triggers dialog.
   * If no duplicate, proceeds with save immediately.
   */
  const handleSaveClick = useCallback(
    async (action: SaveAction, event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      // Validate form first
      const isValid = await trigger();
      if (!isValid) {
        return;
      }

      const values = getValues() as OrganizationFormValues;
      const name = values.name?.trim();

      if (!name) {
        return;
      }

      // Check for duplicates
      const duplicate = await checkForDuplicate(name);
      if (duplicate) {
        // Store the action for when user confirms
        pendingActionRef.current = action;
        onDuplicateFound(duplicate.name, values);
        return;
      }

      // No duplicate - save immediately
      await performSave(action);
    },
    [trigger, getValues, checkForDuplicate, onDuplicateFound, performSave]
  );

  const isButtonDisabled = isChecking || isCreating;
  const buttonLabel = (defaultLabel: string) => {
    if (isChecking) return "Checking...";
    if (isCreating) return "Saving...";
    return defaultLabel;
  };

  return (
    <>
      <div className="sticky bottom-12 bg-card border-t border-border p-4 flex justify-between mt-6">
        {/* Hidden native submit button for React Admin form integration */}
        <button
          ref={hiddenSubmitRef}
          type="submit"
          style={{ display: "none" }}
          aria-hidden="true"
          tabIndex={-1}
        />

        <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
          Cancel
        </Button>

        <div className="flex gap-2">
          <SaveButton
            type="button"
            label={buttonLabel("Save & Close")}
            alwaysEnable={!isButtonDisabled}
            disabled={isButtonDisabled}
            data-tutorial="org-save-btn"
            onClick={(e) => handleSaveClick("close", e as React.MouseEvent<HTMLButtonElement>)}
          />
          <SaveButton
            type="button"
            label={buttonLabel("Save & Add Another")}
            alwaysEnable={!isButtonDisabled}
            disabled={isButtonDisabled}
            onClick={(e) => handleSaveClick("addAnother", e as React.MouseEvent<HTMLButtonElement>)}
          />
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
};
