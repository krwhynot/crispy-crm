import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
}

export function ChartWrapper({
  title,
  children,
  isLoading = false,
}: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {isLoading ? <Skeleton className="w-full h-full" /> : children}
        </div>
      </CardContent>
    </Card>
  );
}
