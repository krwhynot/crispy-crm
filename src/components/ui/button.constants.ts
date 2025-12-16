/**
 * Button style variants
 * Extracted from button.tsx to support Fast Refresh
 */

import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // Base styles with refined timing for B2B professional feel
  // Uses CSS custom property for timing: --duration-normal (150ms) with ease-out-soft
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive motion-safe:active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Default: subtle shadow elevation on hover (1px lift)
        default:
          "bg-primary text-primary-foreground shadow-[var(--btn-shadow-rest)] hover:bg-primary/90 hover:shadow-[var(--btn-shadow-hover)] motion-safe:hover:-translate-y-px active:bg-primary/80 active:shadow-none active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--btn-shadow-rest)] hover:bg-destructive/90 hover:shadow-[var(--btn-shadow-hover)] motion-safe:hover:-translate-y-px active:bg-destructive/80 active:shadow-none active:translate-y-0",
        outline:
          "border bg-background shadow-[var(--btn-shadow-rest)] hover:bg-accent hover:text-accent-foreground hover:shadow-[var(--btn-shadow-hover)] motion-safe:hover:-translate-y-px active:bg-accent/80 active:shadow-none active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[var(--btn-shadow-rest)] hover:bg-secondary/80 hover:shadow-[var(--btn-shadow-hover)] motion-safe:hover:-translate-y-px active:bg-secondary/70 active:shadow-none active:translate-y-0",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
      },
      size: {
        default: "h-12 px-6 py-2 has-[>svg]:px-4",
        sm: "h-12 rounded-md gap-2 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-md px-8 has-[>svg]:px-6",
        icon: "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
