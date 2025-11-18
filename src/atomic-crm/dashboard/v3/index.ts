import { lazy } from 'react';

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
  import('./PrincipalDashboardV3').then((module) => ({
    default: module.PrincipalDashboardV3,
  }))
);

// Export with error boundary wrapper
export { PrincipalDashboardV3Lazy as PrincipalDashboardV3 };
export { DashboardErrorBoundary } from './DashboardErrorBoundary';

// Export child components for direct use if needed
export { PrincipalPipelineTable } from './components/PrincipalPipelineTable';
export { TasksPanel } from './components/TasksPanel';
export { QuickLoggerPanel } from './components/QuickLoggerPanel';

// Export types
export type {
  PrincipalPipelineRow,
  TaskItem,
  TaskStatus,
  Priority,
  TaskType,
  Momentum,
  ActivityType,
  ActivityOutcome,
} from './types';
