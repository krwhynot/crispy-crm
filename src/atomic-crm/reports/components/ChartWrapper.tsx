import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReactNode } from 'react';

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  height?: string;
}

export function ChartWrapper({
  title,
  children,
  isLoading = false,
  height = '300px'
}: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
