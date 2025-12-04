import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

/**
 * Progress indicator component with accessibility support.
 * @param value - Current progress value (0-100 by default)
 * @param max - Maximum value (default: 100)
 * @param getValueLabel - Function to generate screen reader label (default: "X% complete")
 */
function Progress({
  className,
  value,
  max = 100,
  getValueLabel = (val, maxVal) => `${Math.round((val / maxVal) * 100)}% complete`,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  getValueLabel?: (value: number, max: number) => string;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      getValueLabel={getValueLabel}
      className={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
