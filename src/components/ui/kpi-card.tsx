// src/components/ui/kpi-card.tsx

import { cva, type VariantProps } from "class-variance-authority";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

const kpiCardVariants = cva(
  "relative overflow-hidden transition-all hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-card",
        success: "border-success/50 bg-success/5",
        warning: "border-warning/50 bg-warning/5",
        destructive: "border-destructive/50 bg-destructive/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface KPICardProps extends VariantProps<typeof kpiCardVariants> {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  "data-tutorial"?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  loading = false,
  variant,
  onClick,
  className,
  "data-tutorial": dataTutorial,
}: KPICardProps) {
  if (loading) {
    return (
      <Card
        className={cn(kpiCardVariants({ variant }), "cursor-default", className)}
        aria-busy="true"
        aria-label={`Loading ${title}`}
        data-tutorial={dataTutorial}
      >
        <CardContent className="px-3 py-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isClickable = Boolean(onClick);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  const variantIconStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };

  const variantValueStyles = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  const iconStyle = variantIconStyles[variant ?? "default"];
  const valueStyle = variantValueStyles[variant ?? "default"];

  return (
    <Card
      className={cn(
        kpiCardVariants({ variant }),
        isClickable ? "cursor-pointer" : "cursor-default",
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      aria-label={isClickable ? `${title}: ${value}. Click to view details.` : undefined}
      data-tutorial={dataTutorial}
    >
      <CardContent className="px-3 py-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className={cn("flex h-7 w-7 items-center justify-center rounded shrink-0", iconStyle)}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-lg font-bold truncate leading-tight", valueStyle)}>
                {value}
              </span>
              {trend && (
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    trend.direction === "up" && "text-success",
                    trend.direction === "down" && "text-destructive",
                    trend.direction === "neutral" && "text-muted-foreground"
                  )}
                >
                  {trend.direction === "up"
                    ? "\u2191"
                    : trend.direction === "down"
                      ? "\u2193"
                      : "\u2192"}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
