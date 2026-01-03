import { cn } from "@/lib/utils";
import type { SwipeActionButtonProps } from "./types";

export function SwipeActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
}: SwipeActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 w-11 flex items-center justify-center rounded-lg",
        "transition-transform active:scale-95",
        variant === "muted"
          ? "bg-muted text-muted-foreground"
          : "bg-primary text-primary-foreground"
      )}
      aria-label={label}
    >
      <Icon className="size-5" />
    </button>
  );
}
