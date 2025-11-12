import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const WeeklyActivitySummary = lazy(
  () => import('../../WeeklyActivitySummary')
);

export default function WeeklyActivityTab() {
  return (
    <div className="space-y-4">
      {/* Tab-specific filters placeholder */}
      <div className="bg-secondary/30 p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Report Filters</h3>
        <div className="flex gap-4">
          <div className="text-sm text-muted-foreground">
            Tab-specific filters coming soon
          </div>
        </div>
      </div>

      {/* Render existing report */}
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <WeeklyActivitySummary />
      </Suspense>
    </div>
  );
}
