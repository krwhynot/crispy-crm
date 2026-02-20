/**
 * TasksDatagridHeader
 *
 * Column headers for the Tasks datagrid with integrated filters.
 * Type uses dynamic choices from ConfigurationContext.
 */

import { FilterableColumnHeader } from "@/components/ra-wrappers/column-filters";
import { TASK_PRIORITY_CHOICES } from "./constants";
import { useFormOptions } from "../root/ConfigurationContext";

export function TaskTitleHeader() {
  return <FilterableColumnHeader source="title" label="Title" filterType="text" />;
}

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

export function TaskTypeHeader() {
  const { taskTypes } = useFormOptions();

  if (!taskTypes?.length) {
    return <FilterableColumnHeader source="type" label="Type" filterType="none" />;
  }

  return (
    <FilterableColumnHeader
      source="type"
      label="Type"
      filterType="checkbox"
      choices={taskTypes.map((t) => ({ id: t, name: t }))}
    />
  );
}
