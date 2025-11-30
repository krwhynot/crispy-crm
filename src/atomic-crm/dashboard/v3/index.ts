import { lazy } from "react";

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
 */

// Lazy-load the dashboard component for code splitting
const PrincipalDashboardV3Lazy = lazy(() =>
  import("./PrincipalDashboardV3").then((module) => ({
    default: module.PrincipalDashboardV3,
  }))
);

// Public API exports
export { PrincipalDashboardV3Lazy as PrincipalDashboardV3 };
export { DashboardErrorBoundary } from "./DashboardErrorBoundary";

// Note: Child components (PrincipalPipelineTable, TasksKanbanPanel, LogActivityFAB, QuickLogForm)
// are internal implementation details and not exported from the public API.
// They are imported directly within dashboard/v3 via relative paths.
// TasksPanel is deprecated - replaced by TasksKanbanPanel (kanban board layout).

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
