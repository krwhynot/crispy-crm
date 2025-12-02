import { type ReactNode } from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * DashboardGrid - Responsive CSS Grid layout for the dashboard
 *
 * Replaces the previous flex-col layout with a grid-based system
 * that adapts to different breakpoints.
 *
 * Grid columns by breakpoint:
 * - Desktop (1440px+): Main content + 320px tasks panel
 * - Laptop (1280-1439px): Main content + 48px icon rail
 * - Tablet/Mobile: Single column (tasks via overlay)
 *
 * Uses CSS custom properties for consistent sizing:
 * - --dashboard-tasks-width: 320px
 * - --dashboard-icon-rail-width: 48px
 * - --dashboard-transition-duration: 200ms
 */
export function DashboardGrid({ children, className }: DashboardGridProps) {
  const breakpoint = useBreakpoint();

  // Determine grid columns based on breakpoint
  const getGridCols = () => {
    switch (breakpoint) {
      case "desktop":
        // Pipeline takes remaining space, Tasks panel is fixed 320px
        return "grid-cols-[1fr_var(--dashboard-tasks-width)]";
      case "laptop":
        // Pipeline takes remaining space, icon rail is 48px
        return "grid-cols-[1fr_var(--dashboard-icon-rail-width)]";
      default:
        // Tablet and mobile: single column, tasks via drawer/overlay
        return "grid-cols-1";
    }
  };

  const gridClasses = cn(
    "grid gap-section transition-all duration-[var(--dashboard-transition-duration)]",
    getGridCols(),
    className
  );

  return <div className={gridClasses}>{children}</div>;
}
