import * as React from "react";
import { useEffect } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useFormProgress } from "./FormProgressProvider";
import { Check, X } from "lucide-react";

interface FormFieldWrapperProps {
  name: string;
  isRequired?: boolean;
  children: React.ReactNode;
  className?: string;
}

function FormFieldWrapper({
  name,
  isRequired = false,
  children,
  className,
}: FormFieldWrapperProps) {
  const { registerField, markFieldValid } = useFormProgress();
  const value = useWatch({ name });
  const { errors } = useFormState({ name });

  const hasError = !!errors[name];
  const hasValue = value !== undefined && value !== null && value !== "";
  const isValid = hasValue && !hasError;

  // Register field on mount
  useEffect(() => {
    registerField(name, isRequired);
  }, [name, isRequired, registerField]);

  // Update validity when value or error state changes
  useEffect(() => {
    markFieldValid(name, isValid);
  }, [name, isValid, markFieldValid]);

  return (
    <div className={cn("relative", className)}>
      {children}
      {isValid && (
        <Check className="absolute right-3 top-9 h-4 w-4 text-primary animate-in fade-in duration-100" />
      )}
      {hasError && <X className="absolute right-3 top-9 h-4 w-4 text-destructive" />}
    </div>
  );
}

export { FormFieldWrapper };
export type { FormFieldWrapperProps };
