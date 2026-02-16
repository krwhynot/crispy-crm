// src/components/ui/kpi-card.tsx

import { cva, type VariantProps } from "class-variance-authority";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// 3-axis CVA: tone x emphasis x interactive
// ---------------------------------------------------------------------------

const kpiCardVariants = cva(
  "paper-card relative overflow-hidden transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      tone: {
        neutral: "",
        positive: "",
        warning: "bg-[var(--clay-surface)]",
        critical: "",
      },
      emphasis: {
        default: "",
        executive: "",
        executiveCompact: "",
        executiveBand: "",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-md focus-visible:ring-[var(--clay-base)]",
        false: "cursor-default",
      },
    },
    compoundVariants: [],
    defaultVariants: {
      tone: "neutral",
      emphasis: "default",
      interactive: false,
    },
  }
);

// ---------------------------------------------------------------------------
// Tone-aware style lookups (replace the 3 inline maps)
// ---------------------------------------------------------------------------

const toneIconStyles: Record<NonNullable<KPICardTone>, string> = {
  neutral: "bg-primary/10 text-primary",
  positive: "bg-[var(--olive-surface)] text-[color:var(--olive-text)]",
  warning: "bg-warning/10 text-warning",
  critical: "bg-[var(--clay-surface)] text-[color:var(--clay-text)]",
};

const toneStripeStyles: Record<NonNullable<KPICardTone>, string> = {
  neutral: "hidden",
  positive: "w-[3px] bg-[var(--olive-base)]",
  warning: "w-[3px] bg-[var(--clay-base)]",
  critical: "w-[3px] bg-[var(--clay-text)]",
};

const toneValueStyles: Record<NonNullable<KPICardTone>, string> = {
  neutral: "text-foreground",
  positive: "text-[color:var(--olive-trend)]",
  warning: "text-warning",
  critical: "text-[color:var(--clay-text)]",
};

// ---------------------------------------------------------------------------
// Deprecated variant -> tone mapping
// ---------------------------------------------------------------------------

type DeprecatedVariant = "default" | "success" | "warning" | "destructive";

const variantToTone: Record<DeprecatedVariant, KPICardTone> = {
  default: "neutral",
  success: "positive",
  warning: "warning",
  destructive: "critical",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type KPICardTone = NonNullable<VariantProps<typeof kpiCardVariants>["tone"]>;

export interface KPICardProps {
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

  // 3-axis props
  /** Semantic tone: neutral | positive | warning | critical */
  tone?: KPICardTone;
  /** Metric emphasis: default (20px) | executive (40px serif) */
  emphasis?: NonNullable<VariantProps<typeof kpiCardVariants>["emphasis"]>;
  /** Explicit interactive override. Auto-detected from onClick when omitted. */
  interactive?: boolean;

  /** @deprecated Use `tone` instead. Maps: default->neutral, success->positive, warning->warning, destructive->critical */
  variant?: DeprecatedVariant;
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
  onClick,
  className,
  "data-tutorial": dataTutorial,
  tone: toneProp,
  emphasis = "default",
  interactive: interactiveProp,
  variant,
}: KPICardProps) {
  // Resolve tone: explicit tone wins, then deprecated variant, then neutral
  const resolvedTone: KPICardTone = toneProp ?? (variant ? variantToTone[variant] : "neutral");

  // Resolve interactive: explicit prop wins, then auto-detect from onClick
  const isInteractive = interactiveProp ?? Boolean(onClick);

  const isExecutiveBand = emphasis === "executiveBand";

  if (loading) {
    // Band: flat skeleton with no Card wrapper — just label + value placeholders
    if (isExecutiveBand) {
      return (
        <div
          className={cn("py-1.5 px-3 xl:px-4", className)}
          aria-busy="true"
          aria-label={`Loading ${title}`}
          data-tutorial={dataTutorial}
        >
          <Skeleton className="h-2.5 w-16 mb-1 rounded-sm" />
          <Skeleton className="h-5 xl:h-6 w-10 rounded-sm" />
        </div>
      );
    }
    return (
      <Card
        className={cn(
          kpiCardVariants({ tone: resolvedTone, emphasis, interactive: false }),
          className
        )}
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  const iconStyle = toneIconStyles[resolvedTone];
  const valueStyle = toneValueStyles[resolvedTone];
  const stripeStyle = toneStripeStyles[resolvedTone];

  const isExecutive = emphasis === "executive";
  const isExecutiveCompact = emphasis === "executiveCompact";

  // Status dot for band variant: tone-colored dot next to title (warning/critical only)
  const bandStatusDot =
    isExecutiveBand && (resolvedTone === "warning" || resolvedTone === "critical") ? (
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full shrink-0",
          resolvedTone === "warning" && "bg-warning",
          resolvedTone === "critical" && "bg-[var(--clay-text)]"
        )}
        aria-hidden="true"
      />
    ) : null;

  // ---------------------------------------------------------------------------
  // Band variant: plain div — no Card/CardContent overhead
  // ---------------------------------------------------------------------------
  if (isExecutiveBand) {
    return (
      <div
        className={cn(
          "relative py-1.5 px-3 xl:px-4 bg-transparent transition-colors duration-150",
          isInteractive && "cursor-pointer hover:bg-[var(--divider-warm)]/10",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          className
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={isInteractive ? 0 : undefined}
        role={isInteractive ? "button" : undefined}
        aria-label={isInteractive ? `${title}: ${value}. Click to view details.` : undefined}
        data-tutorial={dataTutorial}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80 inline-flex items-center gap-1.5">
          {title}
          {bandStatusDot}
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span
            className={cn(
              "truncate font-medium [font-family:var(--font-serif)] text-xl xl:text-2xl leading-[1.15] tracking-[-0.02em]",
              valueStyle
            )}
          >
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "text-[11px] font-medium",
                trend.direction === "up" && "text-[color:var(--olive-trend)]",
                trend.direction === "down" && "text-[color:var(--clay-text)]",
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
            <span className="text-[10px] text-muted-foreground/70">{comparisonLabel}</span>
          )}
        </div>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground/70 truncate leading-tight mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Standard card variants: default, executive, executiveCompact
  // ---------------------------------------------------------------------------
  return (
    <Card
      className={cn(
        kpiCardVariants({ tone: resolvedTone, emphasis, interactive: isInteractive }),
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? "button" : undefined}
      aria-label={isInteractive ? `${title}: ${value}. Click to view details.` : undefined}
      data-tutorial={dataTutorial}
    >
      {/* Accent strip -- hidden for neutral tone */}
      <span className={cn("absolute inset-y-0 left-0", stripeStyle)} aria-hidden="true" />
      <CardContent
        className={cn(
          isExecutive
            ? "px-4 py-4 pl-5"
            : isExecutiveCompact
              ? "px-3 py-2.5 pl-4"
              : "px-3 py-3 pl-4"
        )}
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className={cn(
                "flex items-center justify-center rounded-md shrink-0 border border-border/50",
                isExecutiveCompact ? "h-7 w-7" : "h-8 w-8",
                iconStyle
              )}
            >
              <Icon
                className={cn(isExecutiveCompact ? "h-3 w-3" : "h-3.5 w-3.5")}
                aria-hidden="true"
              />
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
            <div
              className={cn("paper-kpi-divider", isExecutiveCompact ? "my-1" : "my-1.5")}
              aria-hidden="true"
            />
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "truncate font-semibold [font-family:var(--font-serif)]",
                  isExecutive
                    ? "text-[40px] leading-[1.1]"
                    : isExecutiveCompact
                      ? "text-[34px] leading-[1.1]"
                      : "text-xl leading-tight",
                  valueStyle
                )}
              >
                {value}
              </span>
              {trend && (
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    trend.direction === "up" && "text-[color:var(--olive-trend)]",
                    trend.direction === "down" && "text-[color:var(--clay-text)]",
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
