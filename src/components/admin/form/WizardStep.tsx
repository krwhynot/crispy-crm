import * as React from "react";
import { cn } from "@/lib/utils";
import { useWizard } from "./FormWizard";

interface WizardStepProps {
  /** Step number (1-indexed, must match position in steps array) */
  step: number;
  /** Step content (form fields) */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Container for wizard step content.
 * Only renders when the step matches the current wizard step.
 *
 * @example
 * ```tsx
 * <WizardStep step={1}>
 *   <TextInput source="name" label="Name" />
 *   <SelectInput source="stage" label="Stage" choices={choices} />
 * </WizardStep>
 * ```
 */
function WizardStep({ step, children, className }: WizardStepProps) {
  const { currentStep, currentStepConfig } = useWizard();

  // Only render if this is the active step
  if (step !== currentStep) return null;

  return (
    <div
      id={`wizard-step-${step}`}
      role="tabpanel"
      aria-labelledby={`wizard-step-${step}-trigger`}
      className={cn("space-y-6", className)}
    >
      {/* Step heading for accessibility */}
      <h2 className="text-lg font-semibold text-foreground">
        Step {step}: {currentStepConfig.title}
      </h2>

      {children}
    </div>
  );
}

export { WizardStep };
export type { WizardStepProps };
