import * as React from "react"

import { cn } from "@/lib/utils"

// =============================================================================
// INPUT COMPONENT
// =============================================================================
// High-density variant (32px) with 44px touch target
// Hybrid border: subtle on desktop, visible on touch devices
// All styles inline - no external CSS utility dependencies
// =============================================================================

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Size variant:
   * - "default": 32px compact (high-density, new default)
   * - "lg": 48px legacy (backward compatibility)
   */
  size?: "default" | "lg"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        dir="auto"
        className={cn(
          // ===========================================
          // BASE STYLES
          // ===========================================
          "w-full min-w-0 bg-transparent",
          "outline-none",
          "transition-[border-color,background-color,box-shadow] duration-75",

          // File input styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "file:text-foreground file:inline-flex file:h-7",

          // Text selection
          "selection:bg-primary selection:text-primary-foreground",

          // Placeholder
          "placeholder:text-muted-foreground/70",

          // Disabled state
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

          // ===========================================
          // SIZE VARIANTS
          // ===========================================
          size === "default" && [
            // Compact visual height: 32px
            "h-8 px-2 py-1",

            // High-density typography: 13px (matches table cells)
            "text-[0.8125rem] leading-[1.35]",

            // TOUCH TARGET EXPANSION (44px)
            // Pseudo-element extends hit area without affecting layout
            // Safe for isolated inputs (not stacked like table rows)
            "relative",
            "before:content-['']",
            "before:absolute",
            "before:top-[calc((44px-100%)/-2)]",
            "before:bottom-[calc((44px-100%)/-2)]",
            "before:left-0",
            "before:right-0",

            // Compact border radius
            "rounded-sm",
          ],

          size === "lg" && [
            // Legacy 48px height
            "min-h-[48px] px-3 py-2",

            // Standard typography
            "text-base md:text-sm",

            // Standard border radius
            "rounded-md",
          ],

          // ===========================================
          // HYBRID BORDER WITH TOUCH AFFORDANCE
          // Desktop: subtle border, intensifies on hover/focus
          // Touch: always visible (no hover available)
          // ===========================================
          "border",

          // Desktop default: subtle 40% opacity border
          "border-border/40",

          // Desktop hover: full border + subtle background
          "hover:border-border hover:bg-accent/10",

          // Focus: prominent border + ring
          "focus:border-primary",
          "focus:ring-1 focus:ring-primary/30",
          "focus:bg-background",

          // Touch devices: always show full border (no hover)
          "[@media(hover:none)]:border-border",
          "[@media(hover:none)]:bg-muted/20",
          "[@media(hover:none)]:focus:bg-background",

          // ===========================================
          // ERROR STATE (aria-invalid)
          // ===========================================
          "aria-invalid:border-destructive",
          "aria-invalid:ring-1 aria-invalid:ring-destructive/30",
          "aria-invalid:focus:border-destructive",
          "aria-invalid:focus:ring-destructive/30",

          // ===========================================
          // READ-ONLY STATE
          // ===========================================
          "read-only:bg-muted/50",
          "read-only:cursor-default",

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
