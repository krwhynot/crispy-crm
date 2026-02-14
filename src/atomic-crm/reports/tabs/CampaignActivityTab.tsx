import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const CampaignActivityReport = lazy(() => import("../CampaignActivity/CampaignActivityReport"));

/**
 * Campaign Activity Tab
 *
 * Wrapper for the CampaignActivityReport.
 * The sub-report handles its own campaign/date filters.
 */
export default function CampaignActivityTab() {
  return (
    <Suspense
      fallback={
        <div className="space-y-widget">
          {/* Filter bar skeleton */}
          <Skeleton className="h-14 rounded-lg" />
          {/* Summary cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-content">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          {/* Chart skeleton */}
          <Skeleton className="h-80 rounded-lg" />
        </div>
      }
    >
      <CampaignActivityReport />
    </Suspense>
  );
}
