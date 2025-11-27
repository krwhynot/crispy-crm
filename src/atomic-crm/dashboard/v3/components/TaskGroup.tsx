import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskGroupProps {
  title: string;
  variant: "danger" | "warning" | "info" | "default";
  count: number;
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function TaskGroup({
  title,
  variant,
  count,
  children,
  collapsed = false,
  onToggle,
}: TaskGroupProps) {
  const variantStyles = {
    danger: "border-l-destructive text-destructive",
    warning: "border-l-warning text-warning",
    info: "border-l-primary text-primary",
    default: "border-l-muted-foreground text-muted-foreground",
  };

  return (
    <div className={cn("border-l-4 pl-4", variantStyles[variant])}>
      <button
        onClick={onToggle}
        className={cn(
          "mb-2 flex w-full items-center justify-between text-left",
          // Interactive hover state with subtle background and smooth transition
          "-mx-2 rounded-md px-2 py-1",
          "transition-[background-color,transform] duration-150 ease-out",
          "hover:bg-muted/50 active:bg-muted/70",
          // Ensure 44px touch target height
          "min-h-[44px]"
        )}
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={cn("h-4 w-4 transition-transform duration-150 ease-out", !collapsed && "rotate-90")} />
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">({count})</span>
        </div>
      </button>
      {!collapsed && <div className="space-y-2">{children}</div>}
    </div>
  );
}
