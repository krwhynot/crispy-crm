// src/components/ui/kpi-card.tsx

import { cva, type VariantProps } from "class-variance-authority";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const kpiCardVariants = cva(
  "paper-card relative overflow-hidden transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "",
        success: "bg-success/5",
        warning: "bg-warning/5",
        destructive: "bg-destructive/5",
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
  /** Comparison context label next to trend (e.g., "vs last week", "No prior data") */
  comparisonLabel?: string;
  /** Tooltip text shown on hover of (i) icon after title */
  infoTooltip?: string;
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
  comparisonLabel,
  infoTooltip,
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

  const variantStripeStyles = {
    default: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  };

  const variantValueStyles = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  const activeVariant = variant ?? "default";
  const iconStyle = variantIconStyles[activeVariant];
  const valueStyle = variantValueStyles[activeVariant];
  const stripeStyle = variantStripeStyles[activeVariant];

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
      <span
        className={cn("absolute inset-y-0 left-0 w-1 opacity-80", stripeStyle)}
        aria-hidden="true"
      />
      <CardContent className="px-3 py-3 pl-4">
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md shrink-0 border border-border/50",
                iconStyle
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="paper-kpi-title inline-flex items-center gap-1">
              {title}
              {infoTooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info
                      className="h-3 w-3 text-muted-foreground/60 cursor-help shrink-0"
                      aria-label={`Info: ${infoTooltip}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    {infoTooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
            <div className="paper-kpi-divider my-1.5" aria-hidden="true" />
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "truncate text-xl font-semibold leading-tight [font-family:var(--font-serif)]",
                  valueStyle
                )}
              >
                {value}
              </span>
              {trend && (
                <span
                  className={cn(
                    "text-[11px] font-medium",
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
                  {trend.value === 0 && trend.direction === "neutral"
                    ? ""
                    : `${Math.abs(trend.value)}%`}
                </span>
              )}
              {comparisonLabel && (
                <span className="text-[10px] text-muted-foreground">{comparisonLabel}</span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground truncate leading-tight dark:font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
