/**
 * TasksDatagridHeader
 *
 * Provides filterable column header labels for the Tasks datagrid.
 * Uses FilterableColumnHeader components that integrate with React Admin's
 * filter state via useListContext.
 *
 * Column Configuration:
 * - Title: Text filter (debounced search)
 * - Priority: Checkbox filter (multi-select from TASK_PRIORITY_CHOICES)
 * - Type: Checkbox filter (dynamic from ConfigurationContext)
 * - Done, Due Date, Assigned To, Contact, Opportunity: No filter
 *
 * @example
 * ```tsx
 * <TextField
 *   source="title"
 *   label={<TaskTitleHeader />}
 *   sortable
 * />
 * ```
 */

import { FilterableColumnHeader } from "@/components/ra-wrappers/column-filters";
import { useFormOptions } from "../root/ConfigurationContext";

/**
 * Task priority choices for column filter
 * Different from organization priorities (A-D) - tasks use severity scale
 */
const TASK_PRIORITY_CHOICES = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
] as const;

/**
 * Filterable header for Task Title column
 * Uses text filter with debounced search
 */
export function TaskTitleHeader() {
  return (
    <FilterableColumnHeader
      source="title"
      label="Title"
      filterType="text"
      placeholder="Search tasks..."
      debounceMs={300}
    />
  );
}

/**
 * Filterable header for Task Priority column
 * Uses checkbox filter with multi-select
 */
export function TaskPriorityHeader() {
  return (
    <FilterableColumnHeader
      source="priority"
      label="Priority"
      filterType="checkbox"
      choices={[...TASK_PRIORITY_CHOICES]}
    />
  );
}

/**
 * Filterable header for Task Type column
 * Uses checkbox filter with dynamic choices from ConfigurationContext
 */
export function TaskTypeHeader() {
  const { taskTypes } = useFormOptions();

  // Convert string array to FilterChoice format
  const typeChoices = taskTypes.map((type) => ({ id: type, name: type }));

  return (
    <FilterableColumnHeader
      source="type"
      label="Type"
      filterType="checkbox"
      choices={typeChoices}
    />
  );
}
