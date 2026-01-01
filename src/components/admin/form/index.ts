// Re-export original form utilities (maintains backward compatibility)
export * from "./form-primitives";

// New form improvement components
export { FormGrid } from "./FormGrid";
export { FormSection } from "./FormSection";
export { FormActions } from "./FormActions";
export { SaveButtonGroup } from "./SaveButtonGroup";
export { FormLoadingSkeleton } from "./FormLoadingSkeleton";
export { useFormShortcuts } from "./useFormShortcuts";

// Compact form components
export { CollapsibleSection } from "./CollapsibleSection";
export { CompactFormRow } from "./CompactFormRow";
export { CompactFormFieldWithButton } from "./CompactFormFieldWithButton";
export { ButtonPlaceholder } from "./ButtonPlaceholder";

// Form progress system
export { FormProgressProvider } from "./FormProgressProvider";
export { useFormProgress } from "./formProgressUtils";
export { FormProgressBar } from "./FormProgressBar";
export { FormFieldWrapper } from "./FormFieldWrapper";
export { FormSectionWithProgress } from "./FormSectionWithProgress";

// Multi-step wizard system
export { FormWizard } from "./FormWizard";
export { useWizard } from "./wizardUtils";
export { WizardStep } from "./WizardStep";
export { WizardNavigation } from "./WizardNavigation";
export { StepIndicator } from "./StepIndicator";

// Types
export type { FormProgressBarProps } from "./FormProgressBar";
export type { FormFieldWrapperProps } from "./FormFieldWrapper";
export type { FormSectionProps } from "./FormSection";
export type { FormSectionWithProgressProps } from "./FormSectionWithProgress";
export type { WizardStepConfig, WizardContextValue } from "./wizard-types";
export type { FormWizardProps } from "./FormWizard";
export type { WizardStepProps } from "./WizardStep";
export type { WizardNavigationProps } from "./WizardNavigation";
export type { StepIndicatorProps } from "./StepIndicator";
