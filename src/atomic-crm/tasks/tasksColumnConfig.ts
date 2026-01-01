/**
 * Tasks Column Configuration
 *
 * Maps column header components for use in TaskList.
 * Separated from TasksDatagridHeader.tsx to satisfy react-refresh/only-export-components
 * lint rule (files with React components should only export components).
 */

import { TaskTitleHeader, TaskPriorityHeader, TaskTypeHeader } from "./TasksDatagridHeader";

/**
 * All task column headers exported for use in TaskList
 */
export const TaskColumnHeaders = {
  Title: TaskTitleHeader,
  Priority: TaskPriorityHeader,
  Type: TaskTypeHeader,
};
