import * as React from "react";

interface FieldProgress {
  name: string;
  isValid: boolean;
  isRequired: boolean;
}

interface FormProgressContextValue {
  fields: Record<string, FieldProgress>;
  totalRequired: number;
  completedRequired: number;
  percentage: number;
  registerField: (name: string, isRequired: boolean) => void;
  markFieldValid: (name: string, isValid: boolean) => void;
}

interface FormProgressProviderProps {
  children: React.ReactNode;
  initialProgress?: number;
}

const FormProgressContext = React.createContext<FormProgressContextValue | null>(null);

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

function useFormProgress(): FormProgressContextValue {
  const context = React.useContext(FormProgressContext);
  if (!context) {
    throw new Error("useFormProgress must be used within a FormProgressProvider");
  }
  return context;
}

export { FormProgressProvider, useFormProgress };
export type { FormProgressContextValue, FormProgressProviderProps, FieldProgress };
