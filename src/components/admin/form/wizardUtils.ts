/**
 * Wizard Utilities
 *
 * Hook for accessing wizard context.
 * Extracted to separate file to satisfy react-refresh/only-export-components.
 */
import * as React from "react";
import { WizardContext } from "./FormWizard";
import type { WizardContextValue } from "./wizard-types";

/**
 * Hook to access wizard context.
 * Must be used within a FormWizard component.
 *
 * @throws Error if used outside FormWizard
 */
export function useWizard(): WizardContextValue {
  const context = React.useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within FormWizard");
  }
  return context;
}
