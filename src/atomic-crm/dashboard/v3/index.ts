import { lazy } from "react";

/**
 * Principal Dashboard V3
 *
 * Three-panel resizable dashboard:
 * - Left: Pipeline by Principal (table view with momentum indicators)
 * - Center: My Tasks (grouped by due date)
 * - Right: Quick Activity Logger
 *
 * Features:
 * - Resizable panels with localStorage persistence
 * - Error boundary for graceful failure handling
 * - Lazy loading for code splitting
 * - Desktop-optimized layout (1440px+)
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

// Note: Child components (PrincipalPipelineTable, TasksPanel, QuickLoggerPanel)
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
