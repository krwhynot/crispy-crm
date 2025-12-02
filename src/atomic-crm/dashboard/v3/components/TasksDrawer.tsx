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
  variant: "laptop" | "tablet-landscape" | "tablet-portrait";
}

/**
 * TasksDrawer - Sheet-based drawer for Tasks panel
 *
 * Used on laptop and tablet breakpoints to show Tasks in an overlay
 * rather than inline, preserving horizontal space for the main content.
 *
 * Variants (per PRD Section 9.2.6):
 * - laptop: 320px fixed width (matches --dashboard-tasks-width)
 * - tablet-landscape: 320px fixed width (consistent with laptop for larger screens)
 * - tablet-portrait: 70% viewport width for larger touch targets on narrow screens
 *
 * Features:
 * - Slides in from right edge
 * - Uses CSS custom property for transition timing
 * - Focus trap for accessibility
 * - ESC to close
 */
export function TasksDrawer({ open, onOpenChange, variant }: TasksDrawerProps) {
  const widthClass = variant === "tablet-portrait"
    ? "w-[70%] sm:max-w-none"
    : "w-full sm:max-w-[320px]"; // laptop and tablet-landscape use 320px

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
