/**
 * SubmitButtonGroup - Standardized form submission button group
 *
 * Encapsulates common form submission UI patterns:
 * - Loading state with Loader2 spinner
 * - Cancel, Save, and optional Save & New buttons
 * - 44px minimum touch targets (h-11)
 * - Semantic colors (primary, outline, secondary)
 *
 * @example
 * // Standard variant (Cancel + Save)
 * <SubmitButtonGroup
 *   isSubmitting={formState.isSubmitting}
 *   onCancel={() => navigate(-1)}
 * />
 *
 * @example
 * // Extended variant (Cancel + Save + Save & New)
 * <SubmitButtonGroup
 *   isSubmitting={isPending}
 *   onCancel={handleClose}
 *   showSaveAndNew
 *   onSaveAndNew={() => { reset(); focusFirstField(); }}
 * />
 */

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SubmitButtonGroupProps {
  /** Loading state - disables buttons, shows spinner on primary */
  isSubmitting: boolean;

  /** Cancel handler - typically closes form/dialog */
  onCancel: () => void;

  /** Optional: Show "Save & New" button for continuous entry */
  showSaveAndNew?: boolean;

  /** Optional: Handler for Save & New (resets form after save) */
  onSaveAndNew?: () => void;

  /** Optional: Custom labels */
  labels?: {
    cancel?: string;
    save?: string;
    saveAndNew?: string;
  };

  /** Optional: Compact mode for popovers (still min 44px) */
  compact?: boolean;
}

const DEFAULT_LABELS = {
  cancel: "Cancel",
  save: "Save",
  saveAndNew: "Save & Add Another",
};

/**
 * SubmitButtonGroup provides consistent form submission UI.
 *
 * Touch targets: All buttons use h-11 (44px) per accessibility guidelines.
 * Loading state: Primary save button shows Loader2 spinner with "Saving..." text.
 */
export const SubmitButtonGroup = ({
  isSubmitting,
  onCancel,
  showSaveAndNew = false,
  onSaveAndNew,
  labels = {},
  compact = false,
}: SubmitButtonGroupProps) => {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  // Compact mode uses smaller padding but maintains h-11 touch target
  const buttonClassName = compact ? "h-11 px-3" : "h-11";

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Cancel button - type="button" prevents form submission */}
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className={buttonClassName}
      >
        {mergedLabels.cancel}
      </Button>

      {/* Save & New button - only shown when showSaveAndNew is true */}
      {showSaveAndNew && onSaveAndNew && (
        <Button
          type="button"
          variant="secondary"
          onClick={onSaveAndNew}
          disabled={isSubmitting}
          className={buttonClassName}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              <span>Saving...</span>
            </>
          ) : (
            mergedLabels.saveAndNew
          )}
        </Button>
      )}

      {/* Primary Save button - type="submit" triggers form submission */}
      <Button type="submit" variant="default" disabled={isSubmitting} className={buttonClassName}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span>Saving...</span>
          </>
        ) : (
          mergedLabels.save
        )}
      </Button>
    </div>
  );
};

export default SubmitButtonGroup;
