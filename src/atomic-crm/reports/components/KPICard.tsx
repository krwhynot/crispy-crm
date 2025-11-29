// src/atomic-crm/reports/components/KPICard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  subtitle?: string;
  /** Visual variant for styling (PRD Section 9.2.1 - amber styling for stale deals) */
  variant?: "default" | "warning" | "success" | "destructive";
  /** Click handler for navigation (PRD Section 9.2.1 - KPIs link to filtered views) */
  onClick?: () => void;
}

export function KPICard({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  subtitle,
  variant = "default",
  onClick,
}: KPICardProps) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  const changePrefix = change && change > 0 ? "+" : "";

  // Variant-based styling for border and value color
  const variantStyles = {
    default: {
      card: "",
      value: "group-hover:text-primary",
      icon: "group-hover:text-primary",
    },
    warning: {
      card: "border-warning/50 bg-warning/5",
      value: "text-warning group-hover:text-warning",
      icon: "text-warning group-hover:text-warning",
    },
    success: {
      card: "border-success/50 bg-success/5",
      value: "text-success group-hover:text-success",
      icon: "text-success group-hover:text-success",
    },
    destructive: {
      card: "border-destructive/50 bg-destructive/5",
      value: "text-destructive group-hover:text-destructive",
      icon: "text-destructive group-hover:text-destructive",
    },
  };

  const styles = variantStyles[variant];

  const isClickable = Boolean(onClick);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        "group",
        isClickable
          ? "cursor-pointer hover:ring-2 hover:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
          : "cursor-default",
        styles.card
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `${title}: ${value}. Click to view details.` : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4",
              variant === "default" ? "text-muted-foreground" : "",
              // Icon animation on card hover
              "transition-[color,transform] duration-150 ease-out",
              "group-hover:scale-110",
              styles.icon
            )}
          />
        )}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold",
            // Value emphasis on hover
            "transition-colors duration-150 ease-out",
            styles.value
          )}
        >
          {value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {change !== undefined && (
          <p className={cn("text-xs mt-2", trendColor)}>
            {changePrefix}
            {change}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
