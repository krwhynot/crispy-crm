import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { FieldErrors } from "react-hook-form";
import { cn } from "@/lib/utils";
import { formatFieldLabel } from "@/atomic-crm/utils/formatters";

interface FormErrorSummaryProps {
  /**
   * Errors object from react-hook-form's formState.errors
   */
  errors: FieldErrors;
  /**
   * Optional custom class name
   */
  className?: string;
  /**
   * Whether to show expanded error list by default
   * @default false
   */
  defaultExpanded?: boolean;
  /**
   * Optional field label map for user-friendly error messages
   * Maps field names to display labels
   * @example { first_name: "First Name", organization_id: "Organization" }
   */
  fieldLabels?: Record<string, string>;
}

/**
 * Extracts all error messages from nested react-hook-form errors object.
 * Handles nested objects (like address.city) and arrays (like email[0].value).
 * Returns both fieldPath (for DOM focusing) and displayLabel (for user-friendly display).
 */
function extractErrors(
  errors: FieldErrors,
  fieldLabels: Record<string, string> = {},
  prefix = ""
): Array<{ fieldPath: string; displayLabel: string; message: string }> {
  const result: Array<{ fieldPath: string; displayLabel: string; message: string }> = [];

  for (const [key, value] of Object.entries(errors)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;

    if (value?.message && typeof value.message === "string") {
      const displayLabel = fieldLabels[fieldPath] || fieldLabels[key] || formatFormFieldLabel(key);
      result.push({ fieldPath, displayLabel, message: value.message });
    } else if (value && typeof value === "object") {
      result.push(...extractErrors(value as FieldErrors, fieldLabels, fieldPath));
    }
  }

  return result;
}

/**
 * Converts field_name to "Field Name" format for form errors.
 * Extends formatFieldLabel with camelCase handling and Id suffix removal.
 */
function formatFormFieldLabel(field: string): string {
  return formatFieldLabel(field)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/Id$/, "");
}

/**
 * FormErrorSummary - Accessible validation error banner for forms
 *
 * Displays a summary banner at the top of forms showing validation errors.
 * Features:
 * - Accessible aria-live region for screen readers
 * - Collapsible error list for forms with many errors
 * - Click to focus on errored field (scrollIntoView)
 * - Semantic error styling with destructive colors
 *
 * @example
 * ```tsx
 * const { formState: { errors } } = useForm();
 *
 * <FormErrorSummary
 *   errors={errors}
 *   fieldLabels={{ first_name: "First Name", organization_id: "Organization" }}
 * />
 * ```
 */
export function FormErrorSummary({
  errors,
  className,
  defaultExpanded = false,
  fieldLabels = {},
}: FormErrorSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Extract all errors from the nested errors object
  const errorList = extractErrors(errors, fieldLabels);

  // Don't render if no errors
  if (errorList.length === 0) {
    return null;
  }

  const errorCount = errorList.length;

  /**
   * Attempts to focus and scroll to the field with an error
   */
  const focusField = (fieldName: string) => {
    // Try to find the input by name attribute (react-hook-form pattern)
    const input = document.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(`[name="${fieldName}"], [id="${fieldName}"]`);

    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus();
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn("rounded-lg border border-destructive/50 bg-destructive/10 p-4", className)}
    >
      {/* Header with count and expand toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="font-medium text-sm">
            {errorCount === 1 ? "1 validation error" : `${errorCount} validation errors`}
          </span>
        </div>

        {errorCount > 1 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-destructive/80 hover:text-destructive transition-colors"
            aria-expanded={isExpanded}
            aria-controls="error-list"
          >
            {isExpanded ? (
              <>
                Hide details
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show details
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Error list (collapsible when multiple) */}
      {(errorCount === 1 || isExpanded) && (
        <ul
          id="error-list"
          className="mt-2 space-y-1 text-sm text-destructive/90"
          aria-label="Form validation errors"
        >
          {errorList.map((error, index) => (
            <li key={`${error.fieldPath}-${index}`} className="flex items-start gap-2">
              <span className="shrink-0">•</span>
              <button
                type="button"
                onClick={() => focusField(error.fieldPath)}
                className="text-left hover:underline focus:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="font-medium">{error.displayLabel}:</span> {error.message}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
