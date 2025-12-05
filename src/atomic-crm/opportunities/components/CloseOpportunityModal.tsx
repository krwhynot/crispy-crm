import { useCallback, useEffect } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trophy, XCircle, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { cn } from "@/lib/utils";

import {
  closeOpportunitySchema,
  WIN_REASONS,
  LOSS_REASONS,
  type CloseOpportunityInput,
  type WinReason,
  type LossReason,
} from "@/atomic-crm/validation/opportunities";

/**
 * Props for CloseOpportunityModal
 */
interface CloseOpportunityModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** The opportunity ID being closed */
  opportunityId: string | number;
  /** The opportunity name for display */
  opportunityName: string;
  /** Target stage: 'closed_won' or 'closed_lost' */
  targetStage: "closed_won" | "closed_lost";
  /** Callback when close is confirmed with reason data */
  onConfirm: (data: CloseOpportunityInput) => void;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
}

/**
 * CloseOpportunityModal Component
 *
 * Industry-standard modal for capturing win/loss reasons when closing opportunities.
 * Per PRD Section 5.3, MVP #12, #47 - matches Salesforce/HubSpot patterns.
 *
 * Features:
 * - Conditional SelectInput based on win vs loss
 * - Progressive disclosure: "Other" option reveals notes field
 * - Form validation via Zod (closeOpportunitySchema)
 * - Accessible: focus trap, ARIA attributes, keyboard navigation
 *
 * @example
 * ```tsx
 * <CloseOpportunityModal
 *   open={showCloseModal}
 *   onOpenChange={setShowCloseModal}
 *   opportunityId={record.id}
 *   opportunityName={record.name}
 *   targetStage="closed_won"
 *   onConfirm={handleCloseOpportunity}
 *   isSubmitting={isPending}
 * />
 * ```
 */
export const CloseOpportunityModal = ({
  open,
  onOpenChange,
  opportunityId,
  opportunityName,
  targetStage,
  onConfirm,
  isSubmitting = false,
}: CloseOpportunityModalProps) => {
  const isWin = targetStage === "closed_won";

  // P5: Form defaults from closeOpportunitySchema.partial().parse({})
  // This ensures Zod-defined defaults are used, not hardcoded values
  const defaultValues = closeOpportunitySchema.partial().parse({
    id: opportunityId,
    stage: targetStage,
  });

  const form = useForm<CloseOpportunityInput>({
    resolver: zodResolver(closeOpportunitySchema),
    defaultValues,
    mode: "onBlur", // Validate on blur for better performance
  });

  const { control, reset, handleSubmit, formState, trigger } = form;
  const { errors, isValid } = formState;

  // Watch reason fields for conditional "Other" field and to trigger validation
  const winReason = useWatch({ control, name: "win_reason" }) as WinReason | null | undefined;
  const lossReason = useWatch({ control, name: "loss_reason" }) as LossReason | null | undefined;
  const closeReasonNotes = useWatch({ control, name: "close_reason_notes" }) as string | null | undefined;

  // Trigger validation when relevant fields change
  // This is necessary because mode: "onBlur" doesn't auto-validate on change,
  // but Zod refinements require full form validation to determine isValid
  // We validate on ANY change (including clearing) to keep isValid accurate
  useEffect(() => {
    trigger();
  }, [winReason, lossReason, closeReasonNotes, trigger]);

  // Show notes field when "other" is selected
  const showNotesField = winReason === "other" || lossReason === "other";

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open) {
      reset({
        id: opportunityId,
        stage: targetStage,
        win_reason: null,
        loss_reason: null,
        close_reason_notes: null,
      });
    }
  }, [open, opportunityId, targetStage, reset]);

  // Handle form submission
  const onSubmit = useCallback(
    (data: CloseOpportunityInput) => {
      onConfirm(data);
    },
    [onConfirm]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-md sm:w-[calc(100%-2rem)]"
        aria-describedby="close-opportunity-description"
      >
        <DialogHeader className="gap-3">
          {/* Icon and title based on win/loss */}
          <div className="flex items-center gap-3">
            {isWin ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <Trophy className="h-5 w-5 text-success" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            )}
            <DialogTitle className="text-lg font-semibold">
              {isWin ? "Close as Won" : "Close as Lost"}
            </DialogTitle>
          </div>

          <DialogDescription id="close-opportunity-description" className="text-sm">
            {isWin
              ? `Congratulations! Please select the primary reason you won "${opportunityName}".`
              : `Please select the primary reason "${opportunityName}" was lost.`}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {/* Win/Loss Reason SelectInput - P7: react-admin SelectInput */}
            {isWin ? (
              <SelectInput
                source="win_reason"
                label="Win Reason *"
                choices={WIN_REASONS}
                helperText="Why did you win this opportunity?"
                className="w-full"
              />
            ) : (
              <SelectInput
                source="loss_reason"
                label="Loss Reason *"
                choices={LOSS_REASONS}
                helperText="Why was this opportunity lost?"
                className="w-full"
              />
            )}

            {/* Conditional "Other" notes field - progressive disclosure */}
            {showNotesField && (
              <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <TextInput
                  source="close_reason_notes"
                  label="Please specify *"
                  multiline
                  rows={3}
                  placeholder="Describe the specific reason..."
                  helperText="Required when selecting 'Other'"
                  className="w-full"
                />
              </div>
            )}

            {/* Form-level error display */}
            {Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  {errors.win_reason?.message ||
                    errors.loss_reason?.message ||
                    errors.close_reason_notes?.message ||
                    "Please complete all required fields"}
                </span>
              </div>
            )}

            <DialogFooter className="gap-2 pt-4 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="h-11 min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={cn(
                  "h-11 min-w-[120px]",
                  isWin
                    ? "bg-success text-success-foreground hover:bg-success/90"
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                )}
              >
                {isSubmitting ? "Saving..." : isWin ? "Close as Won" : "Close as Lost"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default CloseOpportunityModal;
