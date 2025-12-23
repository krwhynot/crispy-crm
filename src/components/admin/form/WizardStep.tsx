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
 * All steps remain mounted to preserve React Hook Form state.
 * Inactive steps are hidden via CSS and made inert for accessibility.
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
  const { currentStep, steps } = useWizard();
  const isActive = step === currentStep;
  const stepConfig = steps[step - 1]; // Get THIS step's config, not current step's

  // Keep all steps mounted to preserve React Hook Form state.
  // Use CSS visibility + inert to hide inactive steps.
  return (
    <div
      id={`wizard-step-${step}`}
      role="tabpanel"
      aria-labelledby={`wizard-step-${step}-trigger`}
      aria-hidden={!isActive}
      // @ts-expect-error - inert is valid HTML attribute, React 19 types lagging
      inert={!isActive ? "" : undefined}
      className={cn("space-y-6", !isActive && "hidden", className)}
    >
      {/* Step heading for accessibility */}
      <h2 className="text-lg font-semibold text-foreground">
        Step {step}: {stepConfig.title}
      </h2>

      {children}
    </div>
  );
}

export { WizardStep };
export type { WizardStepProps };
