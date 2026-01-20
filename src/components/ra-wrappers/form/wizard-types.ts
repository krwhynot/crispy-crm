/**
 * Wizard Types - Shared interfaces for multi-step form wizard components
 *
 * These types are used by:
 * - FormWizard (context provider)
 * - WizardStep (step container)
 * - WizardNavigation (navigation buttons)
 * - StepIndicator (visual progress)
 */

/**
 * Configuration for a single wizard step
 */
export interface WizardStepConfig {
  /** Unique step identifier */
  id: string;
  /** Display title for step */
  title: string;
  /** Field names to validate before advancing (must be valid when calling goToNext) */
  fields: string[];
}

/**
 * Context value provided by FormWizard
 */
export interface WizardContextValue {
  /** Current step (1-indexed for display purposes) */
  currentStep: number;
  /** Total number of steps in the wizard */
  totalSteps: number;
  /** All step configurations */
  steps: WizardStepConfig[];
  /** Current step's configuration */
  currentStepConfig: WizardStepConfig;
  /** Advance to next step (validates current step fields first). Returns true if successful */
  goToNext: () => Promise<boolean>;
  /** Go back to previous step (no validation required) */
  goToPrevious: () => void;
  /** Whether the form is currently submitting (final step) */
  isSubmitting: boolean;
  /** Whether user can proceed to next step (for UI state) */
  canProceed: boolean;
}
