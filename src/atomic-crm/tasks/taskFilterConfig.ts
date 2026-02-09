/**
 * Task Filter Configuration
 *
 * Defines how task filters are displayed in the FilterChipBar.
 *
 * @module tasks/taskFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";

/**
 * Priority choices for tasks
 * Defined inline as TaskListFilter.tsx does not import from a constants file
 */
const PRIORITY_CHOICES = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
];

/**
 * Dynamic task type choices callback
 * Task types come from ConfigurationContext at runtime
 */
function getTaskTypeChoices(context: unknown): Array<{ id: string; name: string }> {
  if (context && typeof context === "object" && "taskTypes" in context) {
    const taskTypes = (context as { taskTypes: string[] }).taskTypes;
    return taskTypes.map((type) => ({ id: type, name: type }));
  }
  return [];
}

/**
 * Filter configuration for Tasks list
 *
 * Matches filters available in TaskListFilter.tsx:
 * - due_date@gte/lte: Due date range (PRIMARY - includes "Overdue" preset)
 * - completed: Completion status (boolean)
 * - priority: Task priority level
 * - type: Task type (dynamic from ConfigurationContext)
 * - sales_id: Assigned user reference
 *
 * ⚠️ NOTE: Tasks use @gte/@lte format for date filters
 */
export const TASK_FILTER_CONFIG = validateFilterConfig([
  // PRIMARY FILTERS: Due date ranges first
  {
    key: "due_date@gte",
    label: "Due after",
    type: "date-range",
    removalGroup: "due_date_range",
  },
  {
    key: "due_date@lte",
    label: "Due before",
    type: "date-range",
    removalGroup: "due_date_range",
  },
  // Overdue filter (used by KPISummaryRow and TaskListFilter "Overdue" preset)
  {
    key: "due_date@lt",
    label: "Overdue",
    type: "boolean",
    formatLabel: () => "Overdue tasks",
  },
  // Task ID filter (used by TimelineEntry to link to specific task)
  {
    key: "id",
    label: "Task",
    type: "reference",
    reference: "tasks",
  },
  {
    key: "completed",
    label: "Status",
    type: "boolean",
    formatLabel: (value: unknown) => (value === true ? "Completed" : "Incomplete"),
  },
  {
    key: "priority",
    label: "Priority",
    type: "multiselect",
    choices: PRIORITY_CHOICES,
  },
  {
    key: "type",
    label: "Type",
    type: "multiselect",
    // Dynamic choices from ConfigurationContext - callback pattern
    choices: getTaskTypeChoices,
  },
  {
    key: "sales_id",
    label: "Assigned To",
    type: "reference",
    reference: "sales",
  },
]);
