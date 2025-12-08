import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Visually hides content while keeping it accessible to screen readers.
 * Use for accessible labels on icon-only buttons or dialogs without visible titles.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogContent>
 *     <VisuallyHidden>
 *       <DialogTitle>Settings</DialogTitle>
 *     </VisuallyHidden>
 *     {/* Dialog content without visible title *\/}
 *   </DialogContent>
 * </Dialog>
 * ```
 */
export function VisuallyHidden({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "[clip:rect(0,0,0,0)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
