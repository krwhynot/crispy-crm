import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TasksKanbanPanel } from "./TasksKanbanPanel";

interface TasksDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "laptop" | "tablet";
}

/**
 * TasksDrawer - Sheet-based drawer for Tasks panel
 *
 * Used on laptop and tablet breakpoints to show Tasks in an overlay
 * rather than inline, preserving horizontal space for the main content.
 *
 * Variants:
 * - laptop: 320px fixed width (matches --dashboard-tasks-width)
 * - tablet: 70% viewport width for larger touch targets
 *
 * Features:
 * - Slides in from right edge
 * - Uses CSS custom property for transition timing
 * - Focus trap for accessibility
 * - ESC to close
 */
export function TasksDrawer({ open, onOpenChange, variant }: TasksDrawerProps) {
  const widthClass = variant === "laptop"
    ? "w-full sm:max-w-[320px]"
    : "w-[70%] sm:max-w-none";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`${widthClass} flex flex-col p-0 transition-transform duration-[var(--dashboard-transition-duration)] ease-[var(--dashboard-transition-easing)]`}
        aria-label="Tasks panel"
      >
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle>Tasks</SheetTitle>
          <SheetDescription className="sr-only">
            View and manage your pending tasks
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto">
          <TasksKanbanPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
