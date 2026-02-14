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

/**
 * PrincipalDashboardV4 - 3-Column Scrollable Layout
 *
 * Replaces the tabbed layout with a single-page 3-column grid.
 * Page scrolls naturally — no trapped scroll containers.
 *
 * Desktop (lg: 1024px+):
 *   Left (3/12): KPIs (2x2) + Performance
 *   Center (6/12): Pipeline Table + Activity Feed
 *   Right (3/12): Tasks List (sticky)
 *
 * Mobile (<1024px, single column):
 *   DOM order = visual order = focus order (no CSS order-* tricks):
 *   1. KPIs → 2. Pipeline → 3. Tasks → 4. Activity → 5. Performance
 *
 * Scroll model:
 * - Page scrolls naturally (pipeline, activity, KPIs in page flow)
 * - Tasks column: sticky with internal scroll within bounded height
 * - No other component has internal scroll
 */
export function PrincipalDashboardV4() {
  return (
    <div className="pb-6">
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* 1. KPIs — mobile: 1st, desktop: left col row 1 */}
        <div className="lg:col-span-3 lg:col-start-1 lg:row-start-1">
          <KPISummaryRow />
        </div>

        {/* 2. Pipeline — mobile: 2nd, desktop: center col row 1 */}
        <Card className="lg:col-span-6 lg:col-start-4 lg:row-start-1">
          <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
            <PrincipalPipelineTable />
          </Suspense>
        </Card>

        {/* 3. Tasks — mobile: 3rd, desktop: right col row 1, sticky */}
        <div className="lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto">
          <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
            <DashboardTasksList />
          </Suspense>
        </div>

        {/* 4. Activity — mobile: 4th, desktop: center col row 2 */}
        <div className="lg:col-span-6 lg:col-start-4 lg:row-start-2">
          <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
            <CompactActivityWidget />
          </Suspense>
        </div>

        {/* 5. Performance — mobile: 5th, desktop: left col row 2 */}
        <div className="lg:col-span-3 lg:col-start-1 lg:row-start-2">
          <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
            <CompactPerformanceWidget />
          </Suspense>
        </div>
      </main>

      {/* Tutorial button — pass V4 steps explicitly (V3 rollback safe) */}
      <DashboardTutorial steps={DASHBOARD_TUTORIAL_STEPS_V4} />
    </div>
  );
}
