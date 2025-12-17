import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard } from "./FormWizard";

interface StepIndicatorProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Visual step progress indicator for wizard.
 * Shows all steps with their status (completed/current/future).
 *
 * Visual states:
 * - Completed: Primary background with checkmark
 * - Current: Primary border, number inside
 * - Future: Muted border, muted number
 *
 * @example
 * ```tsx
 * <StepIndicator className="mb-6" />
 * ```
 */
function StepIndicator({ className }: StepIndicatorProps) {
  const { currentStep, steps } = useWizard();

  return (
    <ol
      className={cn("flex items-center justify-center", className)}
      aria-label="Form steps"
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isFuture = stepNumber > currentStep;

        return (
          <li
            key={step.id}
            className="flex items-center"
            aria-current={isCurrent ? "step" : undefined}
          >
            {/* Connector line (not on first step) */}
            {index > 0 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2",
                  isComplete ? "bg-primary" : "bg-muted"
                )}
                aria-hidden="true"
              />
            )}

            {/* Step circle */}
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                isComplete && "bg-primary text-primary-foreground",
                isCurrent &&
                  "border-2 border-primary text-primary bg-background",
                isFuture &&
                  "border-2 border-muted text-foreground/70 bg-background"
              )}
            >
              {isComplete ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                stepNumber
              )}
            </div>

            {/* Step label (hidden on small screens, shown on md+) */}
            <span
              className={cn(
                "ml-2 text-sm hidden md:block",
                isCurrent
                  ? "font-medium text-foreground"
                  : "text-foreground/70"
              )}
            >
              {step.title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export { StepIndicator };
export type { StepIndicatorProps };
