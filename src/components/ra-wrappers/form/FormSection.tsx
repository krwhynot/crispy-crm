import * as React from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div data-slot="form-section" className={cn("space-y-6", className)}>
      <div data-slot="form-section-header" className="border-b border-border pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {description && (
          <p data-slot="form-section-description" className="text-muted-foreground text-sm mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="mb-6">{children}</div>
    </div>
  );
}

export { FormSection };
export type { FormSectionProps };
