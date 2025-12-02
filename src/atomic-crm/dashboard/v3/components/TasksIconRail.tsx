import { CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TasksIconRailProps {
  taskCount: number;
  onExpand: () => void;
}

/**
 * TasksIconRail - Collapsed 48px icon rail for Tasks panel
 *
 * Used on laptop breakpoint (1280-1439px) to save horizontal space
 * while maintaining quick access to tasks.
 *
 * Features:
 * - 48px wide (matches --dashboard-icon-rail-width)
 * - Task count badge (destructive variant)
 * - 44px touch target (WCAG AA compliant)
 * - Tooltip on hover
 * - Accessible expand button
 */
export function TasksIconRail({ taskCount, onExpand }: TasksIconRailProps) {
  return (
    <aside
      role="complementary"
      aria-label="Tasks panel (collapsed)"
      className="w-12 flex flex-col items-center gap-2 py-4 bg-muted border-l border-border"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            aria-label={`Expand tasks panel (${taskCount} tasks)`}
            className="h-11 w-11 relative"
          >
            <CheckSquare className="h-5 w-5" />
            {taskCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
              >
                {taskCount > 99 ? "99+" : taskCount}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Tasks ({taskCount})</p>
        </TooltipContent>
      </Tooltip>
    </aside>
  );
}
