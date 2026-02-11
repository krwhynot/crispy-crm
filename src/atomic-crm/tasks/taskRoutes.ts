export type TaskSlideOverMode = "view" | "edit";

/**
 * Build canonical task list + slide-over URL.
 * Falls back to the plain task list when id is missing.
 */
export const getTaskSlideOverPath = (
  taskId: number | string | null | undefined,
  mode: TaskSlideOverMode
): string => {
  if (taskId === null || taskId === undefined || taskId === "") {
    return "/tasks";
  }
  const encodedId = encodeURIComponent(String(taskId));
  return `/tasks?${mode}=${encodedId}`;
};

export const getTaskViewPath = (taskId: number | string | null | undefined): string =>
  getTaskSlideOverPath(taskId, "view");

export const getTaskEditPath = (taskId: number | string | null | undefined): string =>
  getTaskSlideOverPath(taskId, "edit");

/**
 * Hash-router navigation helper that avoids full document reload.
 */
export const navigateToTaskSlideOver = (
  taskId: number | string | null | undefined,
  mode: TaskSlideOverMode
): void => {
  window.location.hash = getTaskSlideOverPath(taskId, mode);
};
