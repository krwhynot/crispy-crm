/**
 * Form Progress Utilities
 *
 * Hook for accessing form progress context.
 * Extracted to separate file to satisfy react-refresh/only-export-components.
 */
import * as React from "react";
import { FormProgressContext } from "./FormProgressContext";
import type { FormProgressContextValue } from "./formProgressTypes";

/**
 * Hook to access form progress context.
 * Must be used within a FormProgressProvider.
 *
 * @throws Error if used outside FormProgressProvider
 */
export function useFormProgress(): FormProgressContextValue {
  const context = React.useContext(FormProgressContext);
  if (!context) {
    throw new Error("useFormProgress must be used within a FormProgressProvider");
  }
  return context;
}
