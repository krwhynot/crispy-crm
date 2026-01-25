import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface AccessibleFieldProps {
  name: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactElement;
  className?: string;
}

export function AccessibleField({
  name,
  label,
  error,
  required,
  children,
  className,
}: AccessibleFieldProps) {
  const errorId = `${name}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </Label>

      {React.cloneElement(children, {
        id: name,
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": error ? errorId : undefined,
        "aria-required": required ? "true" : undefined,
      } as React.HTMLAttributes<HTMLElement>)}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
