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
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("relative h-[260px] md:h-[280px] lg:h-[300px] w-full", className)}>
          {isLoading ? <Skeleton className="w-full h-full" /> : children}
        </div>
      </CardContent>
    </Card>
  );
}
