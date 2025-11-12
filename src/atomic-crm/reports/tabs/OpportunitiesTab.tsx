import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const OpportunitiesByPrincipalReport = lazy(
  () => import('../../OpportunitiesByPrincipalReport')
);

export default function OpportunitiesTab() {
  return (
    <div className="space-y-4">
      <div className="bg-secondary/30 p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Report Filters</h3>
        <div className="flex gap-4">
          <div className="text-sm text-muted-foreground">
            Tab-specific filters coming soon
          </div>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <OpportunitiesByPrincipalReport />
      </Suspense>
    </div>
  );
}
