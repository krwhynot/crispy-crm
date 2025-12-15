import * as React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { WizardStepConfig, WizardContextValue } from "./wizard-types";

interface FormWizardProps {
  /** Step configurations defining the wizard flow */
  steps: WizardStepConfig[];
  /** Children components (typically WizardStep and WizardNavigation) */
  children: React.ReactNode;
  /** Handler called when wizard is submitted on final step */
  onSubmit: (data: unknown) => void | Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

const WizardContext = React.createContext<WizardContextValue | null>(null);

/**
 * Multi-step form wizard container.
 * Manages step state, validation, and navigation.
 *
 * Must be used inside a react-hook-form FormProvider context.
 *
 * @example
 * ```tsx
 * <FormProvider {...methods}>
 *   <FormWizard steps={steps} onSubmit={handleSubmit}>
 *     <WizardStep step={1}>...</WizardStep>
 *     <WizardStep step={2}>...</WizardStep>
 *     <WizardNavigation />
 *   </FormWizard>
 * </FormProvider>
 * ```
 */
function FormWizard({ steps, children, onSubmit, className }: FormWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { trigger, getValues } = useFormContext();

  const currentStepConfig = steps[currentStep - 1];

  const goToNext = React.useCallback(async (): Promise<boolean> => {
    // Validate current step fields
    const fieldsToValidate = currentStepConfig.fields;
    const isValid =
      fieldsToValidate.length === 0 ? true : await trigger(fieldsToValidate);

    if (!isValid) return false;

    if (currentStep === steps.length) {
      // Final step - submit the form
      setIsSubmitting(true);
      try {
        await onSubmit(getValues());
        return true;
      } finally {
        setIsSubmitting(false);
      }
    }

    // Advance to next step
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // Focus first field in new step (accessibility)
    // Using setTimeout to wait for DOM update after step render
    setTimeout(() => {
      const nextPanel = document.getElementById(`wizard-step-${nextStep}`);
      const firstInput = nextPanel?.querySelector(
        "input, select, textarea"
      ) as HTMLElement;
      firstInput?.focus();
    }, 100);

    return true;
  }, [currentStep, steps.length, currentStepConfig.fields, trigger, getValues, onSubmit]);

  const goToPrevious = React.useCallback(() => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      // Focus first field in previous step
      setTimeout(() => {
        const prevPanel = document.getElementById(`wizard-step-${prevStep}`);
        const firstInput = prevPanel?.querySelector(
          "input, select, textarea"
        ) as HTMLElement;
        firstInput?.focus();
      }, 100);
    }
  }, [currentStep]);

  const contextValue = React.useMemo<WizardContextValue>(
    () => ({
      currentStep,
      totalSteps: steps.length,
      steps,
      currentStepConfig,
      goToNext,
      goToPrevious,
      isSubmitting,
      canProceed: true, // Could be enhanced with real-time validation state
    }),
    [currentStep, steps, currentStepConfig, goToNext, goToPrevious, isSubmitting]
  );

  return (
    <WizardContext.Provider value={contextValue}>
      <div className={cn("space-y-6", className)}>
        {/* Screen reader announcement for step changes */}
        <div aria-live="polite" className="sr-only">
          Step {currentStep} of {steps.length}: {currentStepConfig.title}
        </div>

        {children}
      </div>
    </WizardContext.Provider>
  );
}

/**
 * Hook to access wizard context.
 * Must be used within a FormWizard component.
 *
 * @throws Error if used outside FormWizard
 */
function useWizard(): WizardContextValue {
  const context = React.useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within FormWizard");
  }
  return context;
}

export { FormWizard, useWizard };
export type { FormWizardProps };
