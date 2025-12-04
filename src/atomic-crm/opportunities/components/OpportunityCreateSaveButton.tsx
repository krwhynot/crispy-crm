/**
 * OpportunityCreateSaveButton
 *
 * Custom SaveButton for opportunity creation that integrates with the
 * Levenshtein fuzzy match warning system. Intercepts form submission
 * to check for similar opportunities before saving.
 *
 * Follows the existing SaveButton pattern from src/components/admin/form.tsx
 * but adds pre-submission validation for duplicate detection.
 */

import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { setSubmissionErrors, useSaveContext, useTranslate, useRecordFromLocation } from "ra-core";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SimilarityCheckResult } from "../../utils/levenshtein";

export interface OpportunityCreateSaveButtonProps {
  /** Function to check for similar opportunities */
  checkForSimilar: (name: string) => SimilarityCheckResult;
  /** Whether user has confirmed to proceed despite warning */
  hasConfirmed: boolean;
  /** Reset confirmation state when form values change */
  resetConfirmation: () => void;
  /** Button label (default: "Create Opportunity") */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SaveButton that checks for similar opportunities before submission.
 *
 * When clicked:
 * 1. Gets the current "name" field value from the form
 * 2. Runs Levenshtein similarity check against existing opportunities
 * 3. If similar found AND not confirmed: blocks submission, shows dialog
 * 4. If no similar OR already confirmed: proceeds with normal save
 */
export function OpportunityCreateSaveButton({
  checkForSimilar,
  hasConfirmed,
  resetConfirmation,
  label = "Create Opportunity",
  className,
}: OpportunityCreateSaveButtonProps) {
  const translate = useTranslate();
  const form = useFormContext();
  const saveContext = useSaveContext();
  const { dirtyFields, isValidating, isSubmitting } = useFormState();

  // Track previous name value to reset confirmation when name changes
  const previousNameRef = useRef<string | null>(null);

  // Watch the name field for changes
  const currentName = form.watch("name");

  // Reset confirmation when name changes significantly
  useEffect(() => {
    if (previousNameRef.current !== null && previousNameRef.current !== currentName) {
      resetConfirmation();
    }
    previousNameRef.current = currentName;
  }, [currentName, resetConfirmation]);

  // Calculate disabled state (same logic as standard SaveButton)
  const isDirty = Object.keys(dirtyFields).length > 0;
  const recordFromLocation = useRecordFromLocation();
  const disabled = (!isDirty && recordFromLocation == null) || isValidating || isSubmitting;

  /**
   * Handle form submission through React Admin's save context
   */
  const handleSubmit = useCallback(
    async (values: any) => {
      let errors;
      if (saveContext?.save) {
        errors = await saveContext.save(values, {});
      }
      if (errors != null) {
        setSubmissionErrors(errors, form.setError);
      }
    },
    [form.setError, saveContext]
  );

  /**
   * Intercept click to check for similar opportunities first
   */
  const handleClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      // Get current form values
      const values = form.getValues();
      const name = values.name;

      // Skip check if already confirmed or name is empty
      if (!hasConfirmed && name && name.trim().length > 0) {
        const result = checkForSimilar(name);

        // If similar opportunities found, don't submit - dialog will show
        if (result.hasSimilar) {
          return;
        }
      }

      // No similar opportunities or already confirmed - proceed with save
      // Trigger form validation and submission
      await form.handleSubmit(handleSubmit)(event);
    },
    [form, hasConfirmed, checkForSimilar, handleSubmit]
  );

  const displayedLabel = translate(label, { _: label });

  return (
    <Button
      type="button" // Use button type to prevent default form submission
      variant="default"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "h-11 min-w-[160px]", // 44px height for touch target
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      {isSubmitting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      {displayedLabel}
    </Button>
  );
}
