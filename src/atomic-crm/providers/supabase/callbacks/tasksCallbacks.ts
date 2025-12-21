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
 * Tasks lifecycle callbacks for React Admin withLifecycleCallbacks
 *
 * Features:
 * - Soft delete enabled (deleted_at timestamp)
 * - Computed fields stripped before save
 * - Completion timestamp auto-managed
 * - Snooze date normalization
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
