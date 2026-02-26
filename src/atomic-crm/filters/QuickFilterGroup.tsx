import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QuickFilterGroupProps extends ComponentProps<"div"> {
  label: string;
  children: ReactNode;
}

/**
 * Visual container for quick-filter preset buttons.
 * Provides a muted rounded background and uppercase label
 * to distinguish presets from regular filter categories.
 */
export function QuickFilterGroup({ label, children, className, ...props }: QuickFilterGroupProps) {
  return (
    <div className={cn("rounded-lg bg-muted/40 p-2", className)} {...props}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}
