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
}

export function KPICard({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  subtitle,
}: KPICardProps) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  const changePrefix = change && change > 0 ? "+" : "";

  return (
    <Card className="group cursor-default">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4 text-muted-foreground",
              // Icon animation on card hover
              "transition-[color,transform] duration-150 ease-out",
              "group-hover:text-primary group-hover:scale-110"
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
            "group-hover:text-primary"
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
