import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const OpportunitiesByPrincipalReport = lazy(() => import("../OpportunitiesByPrincipalReport"));

/**
 * Opportunities by Principal Tab
 *
 * Wrapper for the OpportunitiesByPrincipalReport.
 * The sub-report handles its own principal/stage filters.
 */
export default function OpportunitiesTab() {
  return (
    <Suspense
      fallback={
        <div className="space-y-widget">
          {/* Summary cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-content">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          {/* Table skeleton */}
          <Skeleton className="h-96 rounded-lg" />
        </div>
      }
    >
      <OpportunitiesByPrincipalReport />
    </Suspense>
  );
}
