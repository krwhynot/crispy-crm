/**
 * Custom hook to fetch and cache task titles
 * Handles batch fetching for performance optimization
 *
 * Uses type-safe generic base hook pattern
 *
 * @module filters/useTaskNames
 */

import type { Task } from "../validation/task";
import { useResourceNamesBase } from "./hooks/useResourceNamesBase";
import { resourceExtractors } from "./types/resourceTypes";

/**
 * Fetch and cache task titles for display
 *
 * @param taskIds - Array of task IDs to look up
 * @returns Object with taskMap, getTaskName function, and loading state
 *
 * @example
 * ```typescript
 * const { getTaskName, loading } = useTaskNames(["1", "2", "3"]);
 * const name = getTaskName("1"); // "Follow up with client" or "Task #1"
 * ```
 */
export const useTaskNames = (taskIds: string[] | undefined) => {
  const { namesMap, getName, loading } = useResourceNamesBase<Task>(
    "tasks",
    taskIds,
    resourceExtractors.tasks,
    "Task"
  );

  // Return with original property names for API consistency
  return {
    taskMap: namesMap,
    getTaskName: getName,
    loading,
  };
};
