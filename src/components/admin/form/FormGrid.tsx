import React from "react";
import { cn } from "@/lib/utils";

interface FormGridProps {
  children: React.ReactNode;
  columns?: 2 | 4;
  className?: string;
}

export function FormGrid({ children, columns = 2, className }: FormGridProps) {
  return (
    <div
      data-testid="form-grid"
      className={cn(
        "grid",
        "grid-cols-1",
        columns === 2 ? "md:grid-cols-2" : "md:grid-cols-4",
        "gap-x-6",
        "gap-y-5",
        className
      )}
    >
      {children}
    </div>
  );
}
