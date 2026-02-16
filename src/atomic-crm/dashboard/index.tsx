import { lazy, Suspense } from "react";
import { CurrentSaleProvider } from "./CurrentSaleContext";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Principal Dashboard V4 - Executive Overview Layout
 *
 * Two-row layout optimized for sales reps (iPad + desktop):
 * - KPI strip (full width, 4-across on xl)
 * - Primary row (lg): Pipeline 8/12 | Tasks 4/12
 * - Secondary row (lg): Performance | Activity | Recently Viewed (equal thirds)
 *
 * PERFORMANCE OPTIMIZATION (KPI Query Audit):
 * - CurrentSaleProvider caches salesId at dashboard level
 * - All child components share the cached salesId (no redundant queries)
 * - Expected: 4+ fewer database queries, ~100-200ms faster initial load
 */

// Lazy-load the dashboard component for code splitting
const PrincipalDashboardV4Lazy = lazy(() =>
  import("./PrincipalDashboardV4").then((module) => ({
    default: module.PrincipalDashboardV4,
  }))
);

/**
 * Dashboard loading skeleton - matches V4 2-column executive overview layout
 */
function DashboardSkeleton() {
  return (
    <div className="pb-6">
      {/* KPI strip skeleton */}
      <div className="paper-card px-2 py-2 xl:py-3 mb-4 border-b border-[var(--paper-divider)]">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 xl:gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[96px] rounded-lg" />
          ))}
        </div>
      </div>
      {/* Primary row skeleton: Pipeline (8) | Tasks (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <Skeleton className="h-96 rounded-lg" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
      {/* Secondary row skeleton: Performance | Activity | Recently Viewed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        <div className="lg:col-span-4">
          <Skeleton className="h-48 rounded-lg" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-48 rounded-lg" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * V4 Dashboard with CurrentSaleProvider wrapper.
 * The provider caches the salesId query, preventing redundant lookups
 * from multiple child components (KPIs, Tasks, Pipeline, etc.).
 */
function PrincipalDashboardV4WithProvider() {
  return (
    <CurrentSaleProvider>
      <Suspense fallback={<DashboardSkeleton />}>
        <PrincipalDashboardV4Lazy />
      </Suspense>
    </CurrentSaleProvider>
  );
}

// Public API exports - export the wrapped version
export { PrincipalDashboardV4WithProvider as PrincipalDashboardV4 };
export { DashboardErrorBoundary } from "./DashboardErrorBoundary";
export { CurrentSaleProvider } from "./CurrentSaleContext";

// Note: Child components (PrincipalPipelineTable, DashboardTasksList, etc.)
// are internal implementation details and not exported from the public API.
// They are imported directly within dashboard/ via relative paths.

// Export types for consumers that need to work with dashboard data
export type {
  PrincipalPipelineRow,
  TaskItem,
  TaskStatus,
  Priority,
  TaskType,
  Momentum,
} from "./types";

// Export KPI-related types for external use
export type { KPIMetrics } from "./useKPIMetrics";
// KPICard is now centralized in @/components/ui/kpi-card
export type { KPICardProps } from "@/components/ui/kpi-card";
