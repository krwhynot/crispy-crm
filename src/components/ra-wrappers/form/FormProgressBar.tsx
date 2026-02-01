import * as React from "react";
import type { z } from "zod";
import { cn } from "@/lib/utils";
import { useFormProgress } from "./formProgressUtils";

interface FormProgressBarProps {
  schema?: z.ZodObject<z.ZodRawShape>;
  showStepInfo?: boolean;
  currentStep?: number;
  totalSteps?: number;
  stepName?: string;
  className?: string;
}

function FormProgressBar({
  schema,
  showStepInfo = true,
  currentStep,
  totalSteps,
  stepName,
  className,
}: FormProgressBarProps) {
  const { percentage, completedRequired, totalRequired } = useFormProgress();

  const isWizardMode = currentStep !== undefined && totalSteps !== undefined;
  const isDotMode = schema !== undefined && !isWizardMode;

  // Use totalRequired from context - reflects actual FormFieldWrapper registrations
  const fieldCount = totalRequired;

  const ariaValueText = isWizardMode
    ? `Step ${currentStep} of ${totalSteps}${stepName ? `: ${stepName}` : ""}`
    : `${completedRequired} of ${fieldCount} required fields complete`;

  return (
    <div className={cn("space-y-2", className)}>
      {showStepInfo && (
        <div className="flex items-center justify-between text-sm text-foreground/70">
          {isWizardMode ? (
            <span>
              Step {currentStep} of {totalSteps}
              {stepName && `: ${stepName}`}
            </span>
          ) : (
            <span>
              {completedRequired} of {fieldCount} required fields
            </span>
          )}
          {!isDotMode && <span className="tabular-nums">{percentage}%</span>}
        </div>
      )}

      {isDotMode ? (
        // Dot indicator mode - one dot per required field
        <div className="flex items-center gap-1.5" role="group" aria-label={ariaValueText}>
          {Array.from({ length: fieldCount }).map((_, i) => (
            <svg
              key={i}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              aria-label={i < completedRequired ? "Completed" : "Pending"}
              role="img"
            >
              {i < completedRequired ? (
                <circle cx="6" cy="6" r="5" className="fill-primary" />
              ) : (
                <circle
                  cx="6"
                  cy="6"
                  r="4"
                  className="fill-none stroke-muted-foreground stroke-2"
                />
              )}
            </svg>
          ))}
        </div>
      ) : (
        // Percentage bar mode (existing behavior)
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Form completion progress"
          aria-valuetext={ariaValueText}
          className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary transition-all duration-200 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export { FormProgressBar };
export type { FormProgressBarProps };
