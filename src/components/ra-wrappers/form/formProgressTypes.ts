/**
 * Form Progress Types
 *
 * Type definitions for the form progress system.
 */

export interface FieldProgress {
  name: string;
  isValid: boolean;
  isRequired: boolean;
}

export interface FormProgressContextValue {
  fields: Record<string, FieldProgress>;
  totalRequired: number;
  completedRequired: number;
  percentage: number;
  registerField: (name: string, isRequired: boolean) => void;
  markFieldValid: (name: string, isValid: boolean) => void;
}

export interface FormProgressProviderProps {
  children: React.ReactNode;
  initialProgress?: number;
}
