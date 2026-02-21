/**
 * Badge style variants
 * Extracted from badge.tsx to support Fast Refresh
 */

import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  // Base badge styles with subtle depth
  // Added: shadow-[var(--badge-shadow)] for subtle elevation
  // Added: ring-1 ring-inset ring-black/[0.08] for hairline border
  "inline-flex items-center justify-center rounded-[5px] border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-2 [&>svg]:pointer-events-none shadow-[var(--badge-shadow)] ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.05] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/30 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-colors duration-150 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground ring-primary/20 [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground ring-secondary-foreground/10 [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground ring-destructive/30 [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        success:
          "border-transparent bg-success text-success-foreground ring-success/20 [a&]:hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-warning-foreground ring-warning/20 [a&]:hover:bg-warning/90",
        outline:
          "text-foreground ring-border [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Organization type variants (MFB Garden to Table theme) - with matching ring colors
        "org-customer":
          "border-transparent bg-tag-warm text-tag-warm-fg ring-tag-warm-fg/15 [a&]:hover:bg-tag-warm/90",
        "org-prospect":
          "border-transparent bg-tag-sage text-tag-sage-fg ring-tag-sage-fg/15 [a&]:hover:bg-tag-sage/90",
        "org-principal":
          "border-transparent bg-tag-purple text-tag-purple-fg ring-tag-purple-fg/15 [a&]:hover:bg-tag-purple/90",
        "org-distributor":
          "border-transparent bg-tag-teal text-tag-teal-fg ring-tag-teal-fg/15 [a&]:hover:bg-tag-teal/90",
        "org-unknown":
          "border-transparent bg-tag-gray text-tag-gray-fg ring-tag-gray-fg/15 [a&]:hover:bg-tag-gray/90",
        "status-cold": "border badge-status-cold ring-0 [a&]:hover:opacity-90",
        "status-active": "border badge-status-active ring-0 [a&]:hover:opacity-90",
        "status-discontinued": "border badge-status-discontinued ring-0 [a&]:hover:opacity-90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
