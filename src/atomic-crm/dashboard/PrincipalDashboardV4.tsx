import { Suspense, lazy } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPISummaryRow } from "./KPISummaryRow";
import { DashboardTutorial } from "./DashboardTutorial";
import { DASHBOARD_TUTORIAL_STEPS_V4 } from "./dashboardTutorialStepsV4";

// Lazy-load heavy components for code splitting
const PrincipalPipelineTable = lazy(() => import("./PrincipalPipelineTable"));
const DashboardTasksList = lazy(() => import("./DashboardTasksList"));
const CompactActivityWidget = lazy(() => import("./CompactActivityWidget"));
const CompactPerformanceWidget = lazy(() => import("./CompactPerformanceWidget"));
const RecentItemsWidget = lazy(() =>
  import("./RecentItemsWidget").then((m) => ({ default: m.RecentItemsWidget }))
);

/**
 * PrincipalDashboardV4 - Executive Overview Layout
 *
 * Two-row layout optimized for sales reps on iPad + desktop.
 * Page scrolls naturally — no trapped scroll containers.
 *
 * KPI strip (full width, horizontal 4-across on xl, 2x2 on smaller):
 *   Open Opportunities | Overdue Tasks | Team Activities | Stale Deals
 *
 * Primary row (lg: 1024px+): Pipeline 8/12 | Tasks 4/12
 * Secondary row (lg: 1024px+): Performance | Activity | Recently Viewed (equal thirds)
 *
 * Mobile (<1024px, single column):
 *   KPIs → Pipeline → Tasks → Performance → Activity → Recently Viewed
 */
export function PrincipalDashboardV4() {
  return (
    <div className="pb-4">
      {/* KPI strip — full width above the 2-column grid */}
      <KPISummaryRow />

      {/* Primary Working Surface: Pipeline (8) | Tasks (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <Card>
            <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
              <PrincipalPipelineTable />
            </Suspense>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
            <DashboardTasksList />
          </Suspense>
        </div>
      </div>

      {/* Secondary Row: Performance | Activity | Recently Viewed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        <div className="lg:col-span-4">
          <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
            <CompactPerformanceWidget />
          </Suspense>
        </div>
        <div className="lg:col-span-4">
          <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
            <CompactActivityWidget />
          </Suspense>
        </div>
        <div className="lg:col-span-4">
          <Suspense fallback={<Skeleton className="h-[200px] rounded-lg" />}>
            <RecentItemsWidget compact />
          </Suspense>
        </div>
      </div>

      {/* Tutorial button */}
      <DashboardTutorial steps={DASHBOARD_TUTORIAL_STEPS_V4} />
    </div>
  );
}
