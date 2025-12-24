import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        isAtLimit
          ? "text-destructive font-medium"
          : isNearLimit
            ? "text-warning"
            : "text-muted-foreground",
        className
      )}
      aria-live="polite"
    >
      {current.toLocaleString()} / {max.toLocaleString()}
    </span>
  );
}
