import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard } from "./FormWizard";

interface WizardNavigationProps {
  /** Label for submit button on final step (default: "Submit") */
  submitLabel?: string;
  /** Whether to show cancel button */
  showCancel?: boolean;
  /** Cancel button click handler */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Navigation buttons for wizard (Previous/Next/Submit).
 *
 * - Previous button only shows after step 1
 * - Next button shows on all steps except the last
 * - Submit button shows on the final step
 * - All buttons have 44px touch targets for accessibility
 *
 * @example
 * ```tsx
 * <WizardNavigation
 *   submitLabel="Create Opportunity"
 *   showCancel
 *   onCancel={() => navigate('/opportunities')}
 * />
 * ```
 */
function WizardNavigation({
  submitLabel = "Submit",
  showCancel = false,
  onCancel,
  className,
}: WizardNavigationProps) {
  const { currentStep, totalSteps, goToNext, goToPrevious, isSubmitting } =
    useWizard();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 pt-6 border-t border-border",
        className
      )}
      role="toolbar"
      aria-label="Form navigation"
    >
      {/* Cancel button - pushed to left with mr-auto */}
      {showCancel && onCancel && (
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="h-11 mr-auto" // 44px touch target, push to left
        >
          Cancel
        </Button>
      )}

      {/* Previous button - only shown after step 1 */}
      {!isFirstStep && (
        <Button
          type="button"
          variant="outline"
          onClick={goToPrevious}
          disabled={isSubmitting}
          className="h-11" // 44px touch target
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Previous
        </Button>
      )}

      {/* Next or Submit button */}
      <Button
        type="button"
        onClick={goToNext}
        disabled={isSubmitting}
        className="h-11" // 44px touch target
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Saving...
          </>
        ) : isLastStep ? (
          submitLabel
        ) : (
          <>
            Next
            <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </>
        )}
      </Button>
    </div>
  );
}

export { WizardNavigation };
export type { WizardNavigationProps };
