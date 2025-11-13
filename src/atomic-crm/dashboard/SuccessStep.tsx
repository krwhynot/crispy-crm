/**
 * Success Step Component
 *
 * Step 3 (final) of Quick Complete Task workflow.
 * Shows a brief success confirmation before modal auto-closes.
 *
 * Design: Simple, celebratory, doesn't require user interaction.
 * Auto-closes after 1 second (handled by parent modal).
 */

import { CheckCircle2 } from "lucide-react";

export function SuccessStep() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {/* Success Icon */}
      <div className="mb-section flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>

      {/* Success Message */}
      <h3 className="text-lg font-semibold text-foreground">Task Completed!</h3>
      <p className="mt-compact text-sm text-muted-foreground">Activity logged and opportunity updated</p>

      {/* Closing Indicator */}
      <div className="mt-section flex items-center gap-compact text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
        <span>Closing...</span>
      </div>
    </div>
  );
}
