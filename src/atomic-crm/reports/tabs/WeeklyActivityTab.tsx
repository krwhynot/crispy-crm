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
    <div className="space-y-4">
      {/* WeeklyActivitySummary has built-in date range filters in its toolbar */}
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <WeeklyActivitySummary />
      </Suspense>
    </div>
  );
}
