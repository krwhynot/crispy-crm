import { lazy, Suspense } from "react";
import { CurrentSaleProvider } from "./context";
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

// Lazy-load the dashboard component for code splitting
const PrincipalDashboardV3Lazy = lazy(() =>
  import("./PrincipalDashboardV3").then((module) => ({
    default: module.PrincipalDashboardV3,
  }))
);

/**
 * Dashboard loading skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center px-6">
          <Skeleton className="h-6 w-48" />
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="col-span-2 h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </main>
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

// Public API exports - export the wrapped version
export { PrincipalDashboardV3WithProvider as PrincipalDashboardV3 };
export { DashboardErrorBoundary } from "./DashboardErrorBoundary";
export { CurrentSaleProvider } from "./context";

// Note: Child components (PrincipalPipelineTable, TasksKanbanPanel, LogActivityFAB, QuickLogForm)
// are internal implementation details and not exported from the public API.
// They are imported directly within dashboard/v3 via relative paths.

// Export types for consumers that need to work with dashboard data
export type {
  PrincipalPipelineRow,
  TaskItem,
  TaskStatus,
  Priority,
  TaskType,
  Momentum,
  ActivityType,
  ActivityOutcome,
} from "./types";

// Export KPI-related types and components for external use
export type { KPIMetrics } from "./hooks/useKPIMetrics";
export type { KPIMetricType } from "./components/KPICard";
