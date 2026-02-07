import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Size variant:
   * - "default": 44px touch-friendly (h-11, per CLAUDE.md standard)
   * - "lg": 48px legacy (backward compatibility)
   */
  size?: "default" | "lg";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        dir="auto"
        className={cn(
          "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex w-full min-w-0 rounded-md border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

          // File input styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground file:inline-flex file:h-7",

          // Text selection
          "selection:bg-primary selection:text-primary-foreground",

          // Size variants
          size === "default" && "h-11 px-3 py-2 text-sm leading-normal",
          size === "lg" && "min-h-[48px] px-3 py-2 text-base md:text-sm",

          // Read-only state
          "read-only:bg-muted/50 read-only:cursor-default",

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
