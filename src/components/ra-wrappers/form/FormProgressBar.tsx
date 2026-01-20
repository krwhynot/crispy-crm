import * as React from "react";
import { cn } from "@/lib/utils";
import { useFormProgress } from "./formProgressUtils";

interface FormProgressBarProps {
  showStepInfo?: boolean;
  currentStep?: number;
  totalSteps?: number;
  stepName?: string;
  className?: string;
}

function FormProgressBar({
  showStepInfo = true,
  currentStep,
  totalSteps,
  stepName,
  className,
}: FormProgressBarProps) {
  const { percentage, completedRequired, totalRequired } = useFormProgress();

  const isWizardMode = currentStep !== undefined && totalSteps !== undefined;

  const ariaValueText = isWizardMode
    ? `Step ${currentStep} of ${totalSteps}${stepName ? `: ${stepName}` : ""}`
    : `${completedRequired} of ${totalRequired} required fields complete`;

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
              {completedRequired} of {totalRequired} required fields
            </span>
          )}
          <span className="tabular-nums">{percentage}%</span>
        </div>
      )}

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
    </div>
  );
}

export { FormProgressBar };
export type { FormProgressBarProps };
