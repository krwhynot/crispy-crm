import { useCallback } from "react";
import { CircleX } from "lucide-react";
import { Translate } from "ra-core";
import { useNavigate } from "react-router-dom";
import { useFormState } from "react-hook-form";

import { Button } from "../ui/button";

/**
 * CancelButton - Navigation button with dirty state protection
 *
 * When used inside a Form context (react-hook-form), this button will:
 * - Check if the form has unsaved changes via isDirty
 * - Show a browser confirmation dialog before navigating away
 * - Prevent accidental data loss
 *
 * Falls back to simple navigation if used outside form context.
 */
export function CancelButton(props: React.ComponentProps<"button">) {
  const navigate = useNavigate();

  // Try to get form state - will return undefined if outside form context
  // Using a try-catch pattern since useFormState throws outside FormProvider
  let isDirty = false;
  try {
    const formState = useFormState();
    isDirty = formState.isDirty;
  } catch {
    // Not inside a form context - proceed without dirty check
  }

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }
    navigate(-1);
  }, [isDirty, navigate]);

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleCancel}
      className="cursor-pointer"
      {...props}
    >
      <CircleX />
      <Translate i18nKey="ra.action.cancel">Cancel</Translate>
    </Button>
  );
}
