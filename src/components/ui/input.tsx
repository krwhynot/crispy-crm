import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Size variant: "default" (32px compact) | "lg" (48px legacy) */
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
          // Base: layout + typography
          "w-full min-w-0 rounded-md bg-transparent",
          "placeholder:text-muted-foreground/70",
          "selection:bg-primary selection:text-primary-foreground",
          "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

          // Size variants
          size === "default" && [
            "h-8 px-2 py-1",
            "text-[length:var(--text-table)]",
            "touch-target-44",
          ],
          size === "lg" && ["min-h-[48px] px-3 py-2", "text-base md:text-sm"],

          // Hybrid border (includes iPad affordance)
          "input-hybrid",

          // Error state
          "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30",

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
