import * as React from "react";
import type {
  FieldProgress,
  FormProgressContextValue,
  FormProgressProviderProps,
} from "./formProgressTypes";

// Export context for use by formProgressUtils.ts hook
export const FormProgressContext = React.createContext<FormProgressContextValue | null>(null);

function FormProgressProvider({ children, initialProgress = 10 }: FormProgressProviderProps) {
  const [fields, setFields] = React.useState<Record<string, FieldProgress>>({});

  const registerField = React.useCallback((name: string, isRequired: boolean) => {
    setFields((prev) => ({
      ...prev,
      [name]: {
        name,
        isValid: false,
        isRequired,
      },
    }));
  }, []);

  const markFieldValid = React.useCallback((name: string, isValid: boolean) => {
    setFields((prev) => {
      const field = prev[name];
      if (!field) return prev;

      return {
        ...prev,
        [name]: {
          ...field,
          isValid,
        },
      };
    });
  }, []);

  const contextValue = React.useMemo(() => {
    const requiredFields = Object.values(fields).filter((field) => field.isRequired);
    const totalRequired = requiredFields.length;
    const completedRequired = requiredFields.filter((field) => field.isValid).length;

    const rawPercentage = totalRequired === 0 ? 0 : (completedRequired / totalRequired) * 100;
    const percentage =
      rawPercentage === 0
        ? initialProgress
        : initialProgress + (rawPercentage * (100 - initialProgress)) / 100;

    return {
      fields,
      totalRequired,
      completedRequired,
      percentage,
      registerField,
      markFieldValid,
    };
  }, [fields, initialProgress, registerField, markFieldValid]);

  return (
    <FormProgressContext.Provider value={contextValue}>{children}</FormProgressContext.Provider>
  );
}

export { FormProgressProvider };
// Types re-exported from formProgressTypes.ts for backward compatibility
export type { FormProgressContextValue, FormProgressProviderProps, FieldProgress } from "./formProgressTypes";
