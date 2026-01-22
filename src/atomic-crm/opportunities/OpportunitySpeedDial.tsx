/**
 * OpportunityQuickAddFAB Component
 *
 * Floating Action Button for rapid opportunity creation.
 * Directly opens the Quick Add Dialog - no speed dial needed since
 * Quick Add is now the primary (and only) creation flow.
 *
 * Design specifications:
 * - FAB size: 56px (size-14)
 * - Touch targets: 44x44px minimum
 * - Semantic colors only
 * - Lightning bolt icon for "quick" action
 *
 * Accessibility:
 * - Clear aria-label
 * - Focus ring for keyboard navigation
 * - Tooltip on hover
 */

import * as React from "react";
import { useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/admin/AdminButton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { QuickAddDialog } from "./QuickAddDialog";

export interface OpportunitySpeedDialProps {
  /**
   * Additional CSS classes to apply to the FAB container
   */
  className?: string;
}

/**
 * @deprecated Use OpportunityQuickAddFAB naming - kept for backwards compatibility
 */
export const OpportunitySpeedDial: React.FC<OpportunitySpeedDialProps> = ({ className }) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  return (
    <>
      {/* FAB Container - fixed position at bottom-right */}
      <div className={cn("fixed bottom-4 right-4 md:bottom-6 md:right-6", "z-50", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <AdminButton
              onClick={() => setIsQuickAddOpen(true)}
              aria-label="Quick Add Opportunity"
              className={cn(
                // Size - 56px diameter
                "size-14",
                // Shape
                "rounded-full",
                // Colors
                "bg-primary hover:bg-primary/90",
                "text-primary-foreground",
                // Shadow for elevation
                "shadow-lg hover:shadow-xl",
                // Transition
                "transition-[box-shadow,transform,background-color] duration-150 ease-out",
                // Focus states
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                // Active state
                "active:scale-95",
                // Padding override
                "p-0"
              )}
            >
              <Zap className="size-6" />
            </AdminButton>
          </TooltipTrigger>
          <TooltipContent side="left">Quick Add Opportunity</TooltipContent>
        </Tooltip>
      </div>

      {/* Quick Add Dialog */}
      <QuickAddDialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen} />
    </>
  );
};
