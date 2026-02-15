import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function ChartWrapper({ title, children, isLoading = false, className }: ChartWrapperProps) {
  return (
    <Card className="paper-card min-w-0">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight [font-family:var(--font-serif)]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "paper-inner-surface relative h-[260px] md:h-[280px] lg:h-[300px] w-full p-3",
            className
          )}
        >
          {isLoading ? <Skeleton className="w-full h-full" /> : children}
        </div>
      </CardContent>
    </Card>
  );
}
