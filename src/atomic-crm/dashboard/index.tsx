import { lazy, Suspense } from "react";
import { CurrentSaleProvider } from "./CurrentSaleContext";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Principal Dashboard V3
 *
 * Two-column CSS Grid dashboard with Log Activity FAB:
 * - Left (40%): Pipeline by Principal (table view with momentum indicators)
 * - Right (60%): My Tasks (grouped by due date)
 * - FAB: Opens Sheet slide-over for activity logging
 *
 * Features:
 * - CSS Grid layout (grid-cols-1 lg:grid-cols-[2fr_3fr])
 * - Error boundary for graceful failure handling
 * - Lazy loading for code splitting
 * - Desktop-first design (lg: breakpoint at 1024px+)
 * - Draft persistence in localStorage for activity form
 *
 * PERFORMANCE OPTIMIZATION (KPI Query Audit):
 * - CurrentSaleProvider caches salesId at dashboard level
 * - All child components share the cached salesId (no redundant queries)
 * - Expected: 4+ fewer database queries, ~100-200ms faster initial load
 */

// Lazy-load the dashboard components for code splitting
const PrincipalDashboardV3Lazy = lazy(() =>
  import("./PrincipalDashboardV3").then((module) => ({
    default: module.PrincipalDashboardV3,
  }))
);

const PrincipalDashboardV4Lazy = lazy(() =>
  import("./PrincipalDashboardV4").then((module) => ({
    default: module.PrincipalDashboardV4,
  }))
);

/**
 * Dashboard loading skeleton - matches V4 3-column grid layout
 */
function DashboardSkeleton() {
  return (
    <div className="pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left column: KPIs + Performance */}
        <div className="lg:col-span-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[77px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-lg" />
        </div>
        {/* Center column: Pipeline + Activity */}
        <div className="lg:col-span-6 space-y-3">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
        {/* Right column: Tasks */}
        <div className="lg:col-span-3">
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapped dashboard with CurrentSaleProvider for performance optimization.
 * The provider caches the salesId query, preventing redundant lookups
 * from multiple child components (KPIs, Tasks, Pipeline, etc.).
 */
function PrincipalDashboardV3WithProvider() {
  return (
    <CurrentSaleProvider>
      <Suspense fallback={<DashboardSkeleton />}>
        <PrincipalDashboardV3Lazy />
      </Suspense>
    </CurrentSaleProvider>
  );
}

/**
 * V4 Dashboard with CurrentSaleProvider wrapper.
 * Same provider caching as V3 — all child components share salesId.
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

// Public API exports - export the wrapped versions
export { PrincipalDashboardV3WithProvider as PrincipalDashboardV3 };
export { PrincipalDashboardV4WithProvider as PrincipalDashboardV4 };
export { DashboardErrorBoundary } from "./DashboardErrorBoundary";
export { CurrentSaleProvider } from "./CurrentSaleContext";

// Note: Child components (PrincipalPipelineTable, TasksKanbanPanel)
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
