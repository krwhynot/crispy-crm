/**
 * Tasks Resource Lifecycle Callbacks
 *
 * Resource-specific logic for tasks using React Admin's withLifecycleCallbacks pattern.
 * Tasks have special handling for:
 * 1. Soft delete - Sets deleted_at instead of hard delete
 * 2. Completion timestamp - Sets completed_at when completed flag changes
 * 3. Snooze handling - snooze_until date filtering
 * 4. Creator-only RLS context - Tasks use created_by for ownership
 *
 * Engineering Constitution: Resource-specific logic extracted for single responsibility
 */

import {
  createResourceCallbacks,
  type ResourceCallbacks,
  type Transform,
} from "./createResourceCallbacks";
import type { DataProvider, UpdateParams } from "ra-core";
import { logger } from "@/lib/logger";

/**
 * Computed fields from tasks view and priority_tasks view (must be stripped before save)
 * These are populated by database joins/views
 */
export const COMPUTED_FIELDS = [
  "contact_name",
  "opportunity_name",
  "organization_name",
  "assignee_name",
  "assignee_email",
  "creator_name",
  // From priority_tasks view
  "customer_name",
  "principal_name",
] as const;

/**
 * Transform: Handle completion timestamp
 * When completed flag changes to true, set completed_at timestamp
 * When completed flag changes to false, clear completed_at
 */
const handleCompletionTimestamp: Transform = {
  name: "handleCompletionTimestamp",
  description: "Sets or clears completed_at based on completed flag",
  apply: (record) => {
    // Only modify if completed field is present
    if ("completed" in record) {
      if (record.completed === true && !record.completed_at) {
        return {
          ...record,
          completed_at: new Date().toISOString(),
        };
      } else if (record.completed === false) {
        return {
          ...record,
          completed_at: null,
        };
      }
    }
    return record;
  },
};

/**
 * Transform: Normalize snooze_until field
 * Ensures snooze_until is either a valid ISO date or null
 */
const normalizeSnoozeUntil: Transform = {
  name: "normalizeSnoozeUntil",
  description: "Normalizes snooze_until date field",
  apply: (record) => {
    if ("snooze_until" in record) {
      // Empty string or undefined becomes null
      if (!record.snooze_until) {
        return { ...record, snooze_until: null };
      }
      // Ensure it's a valid ISO date string
      const date = new Date(record.snooze_until as string);
      if (isNaN(date.getTime())) {
        return { ...record, snooze_until: null };
      }
      return { ...record, snooze_until: date.toISOString() };
    }
    return record;
  },
};

/**
 * Customer-facing task types that should auto-create activities on completion
 * Batch 2, Q6-7: Auto-create activity when completing customer-facing tasks
 */
const CUSTOMER_FACING_TYPES = ["Call", "Email", "Meeting", "Demo"];

/**
 * After-update handler: Auto-create activity when completing customer-facing tasks
 *
 * Batch 2, Q6-7: When a task linked to a customer entity (contact, opportunity, or organization)
 * is marked as completed, automatically create a corresponding activity record.
 *
 * This ensures customer interactions are tracked even if logged as tasks rather than activities.
 *
 * @param params - Update parameters with data and previousData
 * @param dataProvider - React Admin data provider for creating activity
 * @returns Updated params (unchanged - side effect only)
 *
 * @example
 * // Task: "Call John Doe about pricing" linked to opportunity #123, type "Call"
 * // When marked completed → Activity "call" created with notes from task
 */
export const handleTaskCompletionActivity = async (
  params: UpdateParams,
  dataProvider: DataProvider
): Promise<UpdateParams> => {
  const { data, previousData } = params;

  // Detect completion transition (false/undefined → true)
  const wasIncomplete = !previousData?.completed;
  const isNowComplete = data.completed === true;

  if (!wasIncomplete || !isNowComplete) return params;

  // Check if task is linked to customer entity
  const hasCustomerLink = data.contact_id || data.opportunity_id || data.organization_id;
  if (!hasCustomerLink) return params;

  // Check if customer-facing type
  const taskType = data.type as string;
  if (!CUSTOMER_FACING_TYPES.includes(taskType)) return params;

  try {
    // Create activity record
    await dataProvider.create("activities", {
      data: {
        interaction_type: taskType.toLowerCase(), // 'Call' → 'call'
        contact_id: data.contact_id,
        opportunity_id: data.opportunity_id,
        organization_id: data.organization_id,
        notes: `Completed task: ${data.title}\n\n${data.description || ""}`,
        sales_id: data.sales_id,
        interaction_date: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Log but don't block task completion if activity creation fails
    // Task completion is the primary action, activity is side effect
    console.error("Failed to create activity from task completion:", error);
  }

  return params;
};

/**
 * Tasks lifecycle callbacks for React Admin withLifecycleCallbacks
 *
 * Features:
 * - Soft delete enabled (deleted_at timestamp)
 * - Computed fields stripped before save
 * - Completion timestamp auto-managed
 * - Snooze date normalization
 *
 * Note: handleTaskCompletionActivity is exported separately for handler-level wiring
 * (not yet integrated into this callback object - requires afterUpdate support)
 *
 * Usage:
 * ```typescript
 * import { withLifecycleCallbacks } from 'react-admin';
 * import { tasksCallbacks } from './callbacks/tasksCallbacks';
 *
 * const dataProvider = withLifecycleCallbacks(baseProvider, [
 *   tasksCallbacks,
 * ]);
 * ```
 */
export const tasksCallbacks: ResourceCallbacks = createResourceCallbacks({
  resource: "tasks",
  supportsSoftDelete: true,
  computedFields: COMPUTED_FIELDS,
  writeTransforms: [handleCompletionTimestamp, normalizeSnoozeUntil],
});
