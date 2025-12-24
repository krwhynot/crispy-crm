import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      dir="auto"
      data-slot="input"
      className={cn(
        // Base styles with refined transitions
        "flex min-h-[48px] w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm",
        // Subtle inner shadow for depth
        "shadow-[var(--input-shadow-rest)]",
        // Smooth transitions with natural timing
        "transition-[border-color,box-shadow] duration-200 outline-none",
        // Placeholder refinement - slightly more transparent
        "placeholder:text-muted-foreground/70",
        // Selection styling
        "selection:bg-primary selection:text-primary-foreground",
        // File input styling
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Focus state - elegant glow effect
        "focus-visible:border-primary/60 focus-visible:shadow-[var(--input-glow-focus),var(--input-shadow-rest)]",
        // Invalid state
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
