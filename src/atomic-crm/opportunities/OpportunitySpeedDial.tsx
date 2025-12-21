/**
 * OpportunitySpeedDial Component
 *
 * Material Design Speed Dial FAB for Opportunities resource.
 * Provides two actions:
 * 1. Quick Add - Opens QuickAddDialog for rapid lead capture
 * 2. Full Form - Navigates to full create form
 *
 * Design specifications:
 * - FAB size: 56px (size-14)
 * - Action buttons: smaller with labels
 * - Touch targets: 44x44px minimum
 * - Semantic colors only
 * - Icon rotation: + to × when open
 * - Fan-out animation: actions appear above FAB
 *
 * Accessibility:
 * - ARIA menu pattern
 * - Keyboard navigation (Escape closes)
 * - Tooltips for actions
 * - Focus management
 */

import * as React from "react";
import { useState } from "react";
import { Plus, X, Zap, ClipboardList } from "lucide-react";
import { useCreatePath } from "ra-core";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { QuickAddDialog } from "./quick-add/QuickAddDialog";

export interface OpportunitySpeedDialProps {
  /**
   * Additional CSS classes to apply to the FAB container
   */
  className?: string;
}

interface SpeedDialAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  href?: string;
}

export const OpportunitySpeedDial: React.FC<OpportunitySpeedDialProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const createPath = useCreatePath();

  const fullFormPath = createPath({
    resource: "opportunities",
    type: "create",
  });

  // Define speed dial actions
  const actions: SpeedDialAction[] = [
    {
      icon: Zap,
      label: "Quick Add",
      onClick: () => {
        setIsQuickAddOpen(true);
        setIsOpen(false);
      },
    },
    {
      icon: ClipboardList,
      label: "Full Form",
      href: fullFormPath,
    },
  ];

  // Close menu on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <>
      {/* FAB Container - fixed position anchor point */}
      <div
        className={cn(
          // Fixed position at bottom-right corner
          "fixed bottom-4 right-4 md:bottom-6 md:right-6",
          // Z-index for overlay
          "z-50",
          className
        )}
      >
        {/* Speed Dial Actions - positioned ABOVE the FAB */}
        {isOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            id="speed-dial-menu"
            className={cn(
              // Position above FAB with gap
              "absolute bottom-full right-0 mb-3",
              // Stack actions vertically
              "flex flex-col items-end gap-2",
              // Animation
              "animate-in fade-in-0 slide-in-from-bottom-2 duration-150"
            )}
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              const actionId = `speed-dial-action-${index}`;

              const actionButton = (
                <Button
                  role="menuitem"
                  aria-describedby={actionId}
                  onClick={action.onClick}
                  className={cn(
                    // Size - smaller than main FAB but meets touch target
                    "h-11 px-4 gap-2",
                    // Colors
                    "bg-background hover:bg-accent",
                    "text-foreground",
                    "border border-border",
                    // Shadow
                    "shadow-md hover:shadow-lg",
                    // Transition
                    "transition-[box-shadow,transform,background-color] duration-150 ease-out",
                    // Focus
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                    // Active state
                    "active:scale-95"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              );

              const content = action.href ? (
                <Link to={action.href} onClick={stopPropagation}>
                  {actionButton}
                </Link>
              ) : (
                actionButton
              );

              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent id={actionId} side="left">
                    {action.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Main FAB - stays in place */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls="speed-dial-menu"
          aria-label={isOpen ? "Close speed dial menu" : "Open speed dial menu"}
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
            // Padding override (button default has px-4 py-2)
            "p-0"
          )}
        >
          {/* Icon with rotation animation - using CSS Grid for perfect centering */}
          <span className="grid place-items-center size-6">
            <Plus
              className={cn(
                "col-start-1 row-start-1 size-6 transition-[transform,opacity] duration-200 ease-out",
                isOpen ? "rotate-45 opacity-0" : "rotate-0 opacity-100"
              )}
            />
            <X
              className={cn(
                "col-start-1 row-start-1 size-6 transition-[transform,opacity] duration-200 ease-out",
                isOpen ? "rotate-0 opacity-100" : "-rotate-45 opacity-0"
              )}
            />
          </span>
        </Button>
      </div>

      {/* Quick Add Dialog */}
      <QuickAddDialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen} />
    </>
  );
};

/**
 * Prevents click events from bubbling up to parent elements.
 * Useful when FAB actions are inside navigational contexts.
 */
const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
