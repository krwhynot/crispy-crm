/**
 * FloatingCreateButton Component
 *
 * A floating action button (FAB) for quick record creation.
 * Appears in the bottom-right corner of list views and navigates
 * to the create form for the current resource context.
 *
 * Design specifications:
 * - Size: 56px diameter (desktop), 64px (mobile/tablet)
 * - Color: Primary action color using semantic variables
 * - Position: Fixed bottom-right corner, 24px from edges (desktop), 16px (mobile)
 * - Icon: Plus symbol, white on colored background
 * - Keyboard accessible via Tab navigation
 * - ARIA labeled for screen readers
 */

import React from "react";
import { Plus } from "lucide-react";
import { useCanAccess, useCreatePath, useResourceContext } from "ra-core";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface FloatingCreateButtonProps {
  /**
   * Optional resource name to override the current context.
   * If not provided, uses the resource from ResourceContext.
   */
  resource?: string;

  /**
   * Additional CSS classes to apply to the button
   */
  className?: string;
}

export const FloatingCreateButton: React.FC<FloatingCreateButtonProps> = ({
  resource: targetResource,
  className,
}) => {
  const contextResource = useResourceContext();
  const createPath = useCreatePath();
  const resourceName = targetResource ?? contextResource;

  // RBAC Check: Only show button if user can create this resource
  const { canAccess, isPending } = useCanAccess({
    resource: resourceName,
    action: "create",
  });

  // Don't render while checking permissions or if user lacks access
  if (isPending || !canAccess) {
    return null;
  }

  const link = createPath({
    resource: resourceName,
    type: "create",
  });

  return (
    <Link
      to={link}
      onClick={stopPropagation}
      data-tutorial={`create-${resourceName}-btn`}
      aria-label={`Create new ${resourceName?.replace(/_/g, " ")}`}
      className={cn(
        // Base FAB styles
        "fixed z-50 flex items-center justify-center",
        // Positioning - closer on mobile
        "bottom-4 right-4 md:bottom-6 md:right-6",
        // Size - larger on mobile for better touch targets
        "size-16 md:size-14",
        // Shape
        "rounded-full",
        // Colors - using brand primary for maximum visibility (7:1+ contrast)
        "bg-primary hover:bg-primary/90",
        "text-primary-foreground",
        // Shadow for elevation
        "shadow-lg hover:shadow-xl",
        // Standardized 150ms transition timing with smooth easing
        "transition-[box-shadow,transform,background-color] duration-150 ease-out",
        // Focus states for accessibility
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        // Active state
        "active:scale-95",
        className
      )}
    >
      <Plus className="size-6" />
    </Link>
  );
};

/**
 * Prevents click events from bubbling up to parent elements.
 * Useful when FAB is inside a DataGrid with rowClick behavior.
 */
const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
