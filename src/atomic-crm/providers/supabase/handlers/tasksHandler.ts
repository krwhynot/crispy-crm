/**
 * Tasks Handler - Filter Wrapper for Unified Activities Table (STI Pattern)
 *
 * After the STI migration, tasks are stored in the activities table with
 * activity_type = 'task'. This handler provides a task-specific interface
 * by wrapping the activities handler and:
 *
 * 1. Auto-filtering to activity_type = 'task' on reads
 * 2. Auto-setting activity_type = 'task' on creates
 * 3. Mapping title ↔ subject for backwards compatibility
 * 4. Maintaining the existing tasks API contract
 *
 * This enables gradual migration of UI components while maintaining
 * backwards compatibility with existing task-related code.
 *
 * Engineering Constitution: Composition over inheritance, ~50 lines
 */

import type { DataProvider, GetListParams, GetManyParams, GetOneParams } from "react-admin";
import { createActivitiesHandler } from "./activitiesHandler";

/**
 * Map from task type (Title Case) to interaction type (snake_case)
 * Used when creating tasks through this handler
 */
const TASK_TYPE_TO_INTERACTION: Record<string, string> = {
  Call: "call",
  Email: "email",
  Meeting: "meeting",
  "Follow-up": "follow_up",
  Demo: "demo",
  Proposal: "proposal",
  Other: "other",
  None: "administrative",
};

/**
 * Map from interaction type (snake_case) to task type (Title Case)
 * Used when reading tasks to maintain backwards compatibility
 */
const INTERACTION_TO_TASK_TYPE: Record<string, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  follow_up: "Follow-up",
  demo: "Demo",
  proposal: "Proposal",
  other: "Other",
  administrative: "None",
};

/**
 * Transform activity record to task-like record
 * Maps subject → title and interaction_type → task_type
 */
function activityToTask<T extends Record<string, unknown>>(record: T): T {
  const result = { ...record } as Record<string, unknown>;

  // Map subject → title
  if ("subject" in result) {
    result.title = result.subject;
  }

  // Map interaction type to task type for display
  if ("type" in result && typeof result.type === "string") {
    result.type = INTERACTION_TO_TASK_TYPE[result.type] || result.type;
  }

  return result as T;
}

/**
 * Transform task data for activities table
 * Maps title → subject and task_type → interaction_type
 */
function taskToActivity<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data } as Record<string, unknown>;

  // Ensure activity_type is 'task'
  result.activity_type = "task";

  // Map title → subject (callback also does this, but explicit is better)
  if ("title" in result) {
    result.subject = result.title;
    delete result.title;
  }

  // Map task type to interaction type
  if ("type" in result && typeof result.type === "string") {
    const mappedType = TASK_TYPE_TO_INTERACTION[result.type];
    if (mappedType) {
      result.type = mappedType;
    }
  }

  return result as T;
}

/**
 * Create a tasks DataProvider that wraps the activities handler
 *
 * This provides a backwards-compatible tasks interface while using the
 * unified activities table (STI pattern).
 *
 * @param baseProvider - The raw Supabase DataProvider
 * @returns DataProvider with task-specific filtering and mapping
 *
 * @example
 * ```typescript
 * import { createTasksHandler } from './handlers/tasksHandler';
 *
 * // In unifiedDataProvider composition
 * const tasksHandler = createTasksHandler(baseProvider);
 * // Use tasksHandler for 'tasks' resource
 * ```
 */
export function createTasksHandler(baseProvider: DataProvider): DataProvider {
  // Use activities handler as the base (inherits all transforms and validation)
  const activitiesHandler = createActivitiesHandler(baseProvider);

  return {
    ...activitiesHandler,

    /**
     * Get list of tasks (filters to activity_type = 'task')
     */
    getList: async (resource, params: GetListParams) => {
      const result = await activitiesHandler.getList("activities", {
        ...params,
        filter: {
          ...params.filter,
          activity_type: "task",
        },
      });

      return {
        ...result,
        data: result.data.map(activityToTask),
      };
    },

    /**
     * Get single task by ID
     */
    getOne: async (resource, params: GetOneParams) => {
      const result = await activitiesHandler.getOne("activities", params);
      return {
        ...result,
        data: activityToTask(result.data),
      };
    },

    /**
     * Get multiple tasks by IDs
     */
    getMany: async (resource, params: GetManyParams) => {
      const result = await activitiesHandler.getMany("activities", params);
      return {
        ...result,
        data: result.data.map(activityToTask),
      };
    },

    /**
     * Get tasks referenced by another resource
     */
    getManyReference: async (resource, params) => {
      const result = await activitiesHandler.getManyReference("activities", {
        ...params,
        filter: {
          ...params.filter,
          activity_type: "task",
        },
      });

      return {
        ...result,
        data: result.data.map(activityToTask),
      };
    },

    /**
     * Create a new task (sets activity_type = 'task')
     */
    create: async (resource, params) => {
      const result = await activitiesHandler.create("activities", {
        ...params,
        data: taskToActivity(params.data),
      });

      return {
        ...result,
        data: activityToTask(result.data),
      };
    },

    /**
     * Update an existing task
     */
    update: async (resource, params) => {
      const result = await activitiesHandler.update("activities", {
        ...params,
        data: taskToActivity(params.data),
        previousData: params.previousData ? taskToActivity(params.previousData) : undefined,
      });

      return {
        ...result,
        data: activityToTask(result.data),
      };
    },

    /**
     * Update multiple tasks
     */
    updateMany: async (resource, params) => {
      return activitiesHandler.updateMany("activities", {
        ...params,
        data: taskToActivity(params.data),
      });
    },

    /**
     * Delete a task (soft delete via activities handler)
     */
    delete: async (resource, params) => {
      const result = await activitiesHandler.delete("activities", params);
      return {
        ...result,
        data: result.data ? activityToTask(result.data) : result.data,
      };
    },

    /**
     * Delete multiple tasks
     */
    deleteMany: async (resource, params) => {
      return activitiesHandler.deleteMany("activities", params);
    },
  };
}

// Export for backwards compatibility - existing code may import tasksCallbacks
export { tasksCallbacks } from "../callbacks/tasksCallbacks";
