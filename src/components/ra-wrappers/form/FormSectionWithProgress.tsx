import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { useFormProgress } from "./formProgressUtils";

interface FormSectionWithProgressProps {
  /** Unique section identifier */
  id: string;
  /** Section title displayed in header */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Field names in this section that are required */
  requiredFields?: string[];
  /** Child elements (FormFieldWrapper components) */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Enhanced FormSection that displays completion status.
 * Shows ✓ "Complete" badge when all requiredFields are valid.
 *
 * Uses useFormProgress() to read field validity state.
 * Does NOT modify provider state — read-only consumption.
 */
function FormSectionWithProgress({
  id,
  title,
  description,
  requiredFields = [],
  children,
  className,
}: FormSectionWithProgressProps) {
  const { fields } = useFormProgress();

  // Calculate section completion
  // Returns null when no required fields (no indicator needed)
  const sectionComplete = React.useMemo(() => {
    if (requiredFields.length === 0) return null;

    return requiredFields.every((fieldName) => {
      const field = fields[fieldName];
      return field?.isValid === true;
    });
  }, [fields, requiredFields]);

  return (
    <div
      data-slot="form-section-with-progress"
      data-section-id={id}
      className={cn("space-y-4", className)}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          {/* Completion icon - only shown when section is complete */}
          {sectionComplete && (
            <CheckCircle2
              className="h-5 w-5 text-primary"
              aria-hidden="true"
              data-testid="section-complete-icon"
            />
          )}

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>

        {/* Complete badge - only shown when section is complete */}
        {sectionComplete && (
          <span className="text-xs font-medium text-primary" data-testid="section-complete-badge">
            Complete
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p data-slot="form-section-description" className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* Section content */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export { FormSectionWithProgress };
export type { FormSectionWithProgressProps };
