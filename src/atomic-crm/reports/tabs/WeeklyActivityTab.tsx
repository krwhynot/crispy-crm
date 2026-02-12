import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const WeeklyActivitySummary = lazy(() => import("../WeeklyActivitySummary"));

/**
 * Weekly Activity Tab
 *
 * Wrapper for the WeeklyActivitySummary report.
 * The WeeklyActivitySummary component has its own date range picker
 * built into its toolbar, so no additional filters are needed here.
 */
export default function WeeklyActivityTab() {
  return (
    <div className="space-y-section">
      <Suspense
        fallback={
          <div className="space-y-section">
            {/* Summary cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-content">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            {/* Rep activity cards skeleton */}
            <div className="space-y-content">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          </div>
        }
      >
        <WeeklyActivitySummary />
      </Suspense>
    </div>
  );
}
