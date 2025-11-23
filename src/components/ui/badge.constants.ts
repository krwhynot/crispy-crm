/**
 * Badge style variants
 * Extracted from badge.tsx to support Fast Refresh
 */

import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Organization type variants (MFB Garden to Table theme)
        "org-customer": "border-transparent bg-tag-warm text-tag-warm-fg [a&]:hover:bg-tag-warm/90",
        "org-prospect": "border-transparent bg-tag-sage text-tag-sage-fg [a&]:hover:bg-tag-sage/90",
        "org-principal":
          "border-transparent bg-tag-purple text-tag-purple-fg [a&]:hover:bg-tag-purple/90",
        "org-distributor":
          "border-transparent bg-tag-teal text-tag-teal-fg [a&]:hover:bg-tag-teal/90",
        "org-unknown": "border-transparent bg-tag-gray text-tag-gray-fg [a&]:hover:bg-tag-gray/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
