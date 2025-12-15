import { useCallback } from "react";
import { CircleX } from "lucide-react";
import { Translate } from "ra-core";
import { useNavigate } from "react-router-dom";
import { useFormState } from "react-hook-form";

import { Button } from "../ui/button";

interface CancelButtonProps extends React.ComponentProps<"button"> {
  /**
   * Skip dirty state check. Use when CancelButton is outside a Form context
   * or when you want to allow navigation without confirmation.
   * @default false
   */
  skipDirtyCheck?: boolean;
}

/**
 * CancelButton - Navigation button with dirty state protection
 *
 * When used inside a Form context (react-hook-form), this button will:
 * - Check if the form has unsaved changes via isDirty
 * - Show a browser confirmation dialog before navigating away
 * - Prevent accidental data loss
 *
 * Use skipDirtyCheck={true} when used outside form context.
 */
export function CancelButton({ skipDirtyCheck = false, ...props }: CancelButtonProps) {
  const navigate = useNavigate();

  // Get form state for dirty check
  // Note: Must be inside FormProvider context. Use skipDirtyCheck=true if not.
  const { isDirty } = useFormState({ disabled: skipDirtyCheck });

  const handleCancel = useCallback(() => {
    if (!skipDirtyCheck && isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }
    navigate(-1);
  }, [skipDirtyCheck, isDirty, navigate]);

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
