import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Form validation error item
 */
export interface FormError {
  /** Field path (e.g., "email", "address.city") */
  field: string;
  /** Human-readable error message */
  message: string;
}

interface FormErrorBannerProps {
  /** List of validation errors */
  errors: FormError[];
  /** Optional title override */
  title?: string;
  /** Callback when user clicks on an error (for scrolling to field) */
  onErrorClick?: (field: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FormErrorBanner - Summary banner showing all form validation errors
 *
 * Displays at the top of forms to show a count and list of all validation
 * errors. Clicking on an error scrolls to and focuses the related field.
 *
 * Design System Compliance:
 * - Uses semantic destructive colors for errors
 * - Accessible with aria-live for dynamic error announcements
 * - Collapsible for forms with many errors
 * - Touch-friendly 44px click targets
 *
 * @example
 * ```tsx
 * const errors = [
 *   { field: "email", message: "Invalid email address" },
 *   { field: "phone", message: "Phone number is required" },
 * ];
 *
 * <FormErrorBanner
 *   errors={errors}
 *   onErrorClick={(field) => {
 *     document.querySelector(`[name="${field}"]`)?.focus();
 *   }}
 * />
 * ```
 */
export function FormErrorBanner({
  errors,
  title,
  onErrorClick,
  className,
}: FormErrorBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Don't render if no errors
  if (!errors.length) return null;

  const errorCount = errors.length;
  const defaultTitle =
    errorCount === 1
      ? "Please fix the following error:"
      : `Please fix the following ${errorCount} errors:`;

  const handleErrorClick = (field: string) => {
    if (onErrorClick) {
      onErrorClick(field);
    } else {
      // Default behavior: try to find and focus the field
      const element =
        document.querySelector<HTMLElement>(`[name="${field}"]`) ||
        document.querySelector<HTMLElement>(`#${field}`) ||
        document.querySelector<HTMLElement>(`[data-field="${field}"]`);

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
    }
  };

  // Format field name for display (e.g., "email" -> "Email", "phone[0].number" -> "Phone Number")
  const formatFieldName = (field: string): string => {
    return field
      .replace(/\[\d+\]/g, "") // Remove array indices
      .split(/[._]/) // Split on dots and underscores
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1)) // Capitalize
      .join(" ");
  };

  return (
    <Alert
      variant="destructive"
      className={cn("mb-6", className)}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <AlertTitle className="text-sm font-semibold">
            {title || defaultTitle}
          </AlertTitle>
          {errorCount > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-expanded={isExpanded}
              aria-controls="error-list"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show all
                </>
              )}
            </Button>
          )}
        </div>

        {isExpanded && (
          <AlertDescription
            id="error-list"
            className="mt-2"
          >
            <ul className="list-none space-y-1.5" role="list">
              {errors.map((error, index) => (
                <li key={`${error.field}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleErrorClick(error.field)}
                    className="text-left w-full min-h-11 py-1.5 px-2 -ml-2 rounded-md
                             hover:bg-destructive/10 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-destructive/50
                             flex items-start gap-2 text-sm"
                    aria-describedby={`error-${index}-field`}
                  >
                    <span
                      id={`error-${index}-field`}
                      className="font-medium text-destructive shrink-0"
                    >
                      {formatFieldName(error.field)}:
                    </span>
                    <span className="text-destructive/90">{error.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        )}
      </div>
    </Alert>
  );
}

/**
 * Convert Zod validation errors to FormError format
 *
 * @example
 * ```tsx
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     const formErrors = zodErrorsToFormErrors(error);
 *     return <FormErrorBanner errors={formErrors} />;
 *   }
 * }
 * ```
 */
export function zodErrorsToFormErrors(zodError: { issues: Array<{ path: (string | number)[]; message: string }> }): FormError[] {
  return zodError.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Convert React Hook Form errors to FormError format
 *
 * @example
 * ```tsx
 * const { formState: { errors } } = useForm();
 *
 * <FormErrorBanner errors={rhfErrorsToFormErrors(errors)} />
 * ```
 */
export function rhfErrorsToFormErrors(
  errors: Record<string, { message?: string } | undefined>,
  prefix = ""
): FormError[] {
  const result: FormError[] = [];

  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;

    const fieldPath = prefix ? `${prefix}.${key}` : key;

    if (value.message) {
      result.push({
        field: fieldPath,
        message: value.message,
      });
    } else if (typeof value === "object") {
      // Nested errors (e.g., for arrays or objects)
      result.push(
        ...rhfErrorsToFormErrors(value as Record<string, { message?: string }>, fieldPath)
      );
    }
  }

  return result;
}
