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
 * Single-page 2-column layout optimized for sales reps on iPad + desktop.
 * Page scrolls naturally — no trapped scroll containers.
 *
 * KPI strip (full width, horizontal 4-across on xl, 2x2 on smaller):
 *   Open Opportunities | Overdue Tasks | Team Activities | Stale Deals
 *
 * Desktop (xl: 1280px+): Left 8/12 | Right 4/12
 * iPad (lg: 1024px+): Left 7/12 | Right 5/12
 *
 * Left column: Pipeline (primary) + Tasks (below)
 * Right column: Performance + Activity + Recently Viewed
 *
 * Mobile (<1024px, single column):
 *   KPIs → Pipeline → Tasks → Performance → Activity → Recently Viewed
 */
export function PrincipalDashboardV4() {
  return (
    <div className="pb-4">
      {/* KPI strip — full width above the 2-column grid */}
      <KPISummaryRow />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left column: Pipeline + Tasks */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <Card>
            <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
              <PrincipalPipelineTable />
            </Suspense>
          </Card>
          <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
            <DashboardTasksList />
          </Suspense>
        </div>

        {/* Right column: Performance + Activity + Recently Viewed */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
            <CompactPerformanceWidget />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
            <CompactActivityWidget />
          </Suspense>
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
