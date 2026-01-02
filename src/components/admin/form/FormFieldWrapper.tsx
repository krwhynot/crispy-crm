import * as React from "react";
import { useEffect } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useFormProgress } from "./formProgressUtils";
import { Check, X } from "lucide-react";

interface FormFieldWrapperProps {
  name: string;
  isRequired?: boolean;
  children: React.ReactNode;
  className?: string;
  /**
   * When true, field counts as "filled" even if it has a default value.
   * Use for fields where schema defaults are meaningful user choices.
   * Default: false (only user-modified fields count for progress)
   */
  countDefaultAsFilled?: boolean;
}

function FormFieldWrapper({
  name,
  isRequired = false,
  children,
  className,
  countDefaultAsFilled = false,
}: FormFieldWrapperProps) {
  const { registerField, markFieldValid } = useFormProgress();
  const value = useWatch({ name });
  const { errors, dirtyFields } = useFormState({ name });

  const hasError = !!errors[name];
  // Trim string values to prevent whitespace-only inputs showing as valid
  const hasValue =
    value !== undefined &&
    value !== null &&
    (typeof value === "string" ? value.trim() !== "" : value !== "");

  // For progress tracking: field is "filled" only if user has modified it
  // OR if countDefaultAsFilled is true and it has a value
  // This prevents schema defaults from inflating progress
  const isDirty = !!dirtyFields[name];
  const isFilledForProgress = hasValue && (isDirty || countDefaultAsFilled);

  // For visual validation: show checkmark if field has value and no error
  const isVisuallyValid = hasValue && !hasError;

  // Register field on mount
  useEffect(() => {
    registerField(name, isRequired);
  }, [name, isRequired, registerField]);

  // Update validity for progress tracking based on user interaction
  useEffect(() => {
    markFieldValid(name, isFilledForProgress && !hasError);
  }, [name, isFilledForProgress, hasError, markFieldValid]);

  // Clone child elements with aria-required for WCAG 3.3.2 compliance
  // This allows screen readers to announce which fields are required
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(
        child as React.ReactElement<{ "aria-required"?: "true" | undefined }>,
        {
          "aria-required": isRequired ? "true" : undefined,
        }
      );
    }
    return child;
  });

  return (
    <div className={cn("relative", className)}>
      {enhancedChildren}
      {isVisuallyValid && (
        <Check className="absolute right-3 top-9 h-4 w-4 text-primary animate-in fade-in duration-100" />
      )}
      {hasError && <X className="absolute right-3 top-9 h-4 w-4 text-destructive" />}
    </div>
  );
}

export { FormFieldWrapper };
export type { FormFieldWrapperProps };
