import { useState } from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { TasksKanbanPanel } from "./TasksKanbanPanel";
import { TasksIconRail } from "./TasksIconRail";
import { TasksDrawer } from "./TasksDrawer";

interface ResponsiveTasksPanelProps {
  taskCount: number;
  /** External drawer state (for header button control) */
  externalDrawerOpen?: boolean;
  /** External drawer state setter */
  onExternalDrawerChange?: (open: boolean) => void;
}

/**
 * ResponsiveTasksPanel - Orchestrates Tasks panel display across breakpoints
 *
 * Breakpoint behavior:
 * - Desktop (1440px+): Inline 320px panel
 * - Laptop (1280-1439px): 48px icon rail + drawer on click
 * - Tablet landscape (1024-1279px): Drawer only (triggered from header)
 * - Tablet portrait (768-1023px): Nothing (handled by header button)
 * - Mobile (<768px): Nothing (handled by MobileQuickActionBar)
 *
 * Supports external drawer control for header button integration.
 */
export function ResponsiveTasksPanel({
  taskCount,
  externalDrawerOpen,
  onExternalDrawerChange,
}: ResponsiveTasksPanelProps) {
  const breakpoint = useBreakpoint();
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);

  // Use external state when provided, otherwise use internal
  const drawerOpen = externalDrawerOpen ?? internalDrawerOpen;
  const setDrawerOpen = onExternalDrawerChange ?? setInternalDrawerOpen;

  // Desktop: Inline full panel
  if (breakpoint === "desktop") {
    return (
      <aside
        role="complementary"
        aria-label="Tasks panel"
        className="w-[var(--dashboard-tasks-width)] flex flex-col border-l border-border bg-muted overflow-hidden"
      >
        <TasksKanbanPanel />
      </aside>
    );
  }

  // Laptop: Icon rail + drawer
  if (breakpoint === "laptop") {
    return (
      <>
        <TasksIconRail taskCount={taskCount} onExpand={() => setDrawerOpen(true)} />
        <TasksDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          variant="laptop"
        />
      </>
    );
  }

  // Tablet landscape: Drawer only (triggered from header)
  if (breakpoint === "tablet-landscape") {
    return (
      <TasksDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        variant="tablet"
      />
    );
  }

  // Tablet portrait: Drawer only (triggered from header)
  if (breakpoint === "tablet-portrait") {
    return (
      <TasksDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        variant="tablet"
      />
    );
  }

  // Mobile: Handled by MobileQuickActionBar
  // Return nothing - tasks accessed via bottom sheet or navigation
  return null;
}

/**
 * Hook for external drawer control
 * Use this in parent components to control the drawer from header buttons
 */
export function useTasksDrawer() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, toggle: () => setOpen((prev) => !prev) };
}
