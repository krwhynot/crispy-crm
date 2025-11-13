/**
 * Shared Dashboard Hooks and Utilities
 *
 * Extracted from widget consolidation effort to reduce code duplication
 * while keeping distinct UX patterns for different widget types.
 *
 * Design: docs/plans/2025-11-13-p3-widget-consolidation-analysis.md
 */

export { useTasksThisWeek } from './useTasksThisWeek';
export type { UseTasksThisWeekOptions, UseTasksThisWeekResult } from './useTasksThisWeek';

export { groupTasksByUrgency } from '../utils/groupTasksByUrgency';
export type { TasksByUrgency } from '../utils/groupTasksByUrgency';
