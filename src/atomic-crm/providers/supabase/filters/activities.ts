/**
 * Activities Domain - Filter Registry
 *
 * Filterable fields for activities and tasks (STI pattern).
 */

import type { FilterRegistry } from "./types";

export const activitiesFilters = {
  // Activities resource
  // NOTE: Also used by tasks (STI pattern) - task-specific fields included for tasksHandler forwarding
  activities: [
    "id",
    "activity_type",
    "type",
    "subject",
    "activity_date",
    "duration_minutes",
    "contact_id",
    "organization_id",
    "opportunity_id",
    "principal_organization_id", // FK via opportunity for report filtering
    "follow_up_required",
    "follow_up_date",
    "sentiment",
    "sample_status", // Sample workflow status (PRD §4.4)
    "tags", // Array field
    "created_at",
    "updated_at",
    "deleted_at", // Soft delete timestamp
    "created_by", // FK to sales (for filtering by creator/owner - activities table uses created_by, NOT sales_id)
    "sales_id", // Task assignee filtering (STI: tasks stored in activities table)
    "completed", // Task completion filtering (STI: tasks stored in activities table)
    "due_date", // Task due date filtering (STI: used by useKPIMetrics, TaskListFilter)
    "completed_at", // Task completion date filtering (STI: used by useMyPerformance)
    "priority", // Task priority (STI: tasks stored in activities table)
    "q", // Special: full-text search parameter
    // Denormalized opportunity fields (via activities_summary view)
    "opportunity_campaign", // Campaign from related opportunity (denormalized in view)
    "opportunity_deleted_at", // Soft-delete status from related opportunity (denormalized in view)
  ],

  // Activities Summary View (database view with pre-joined creator, entity, and principal data)
  // Used for report read queries that need denormalized display names
  activities_summary: [
    // Base activity fields (same as activities)
    "id",
    "activity_type",
    "type",
    "subject",
    "activity_date",
    "duration_minutes",
    "contact_id",
    "organization_id",
    "opportunity_id",
    "principal_organization_id", // FK via opportunity
    "follow_up_required",
    "follow_up_date",
    "sentiment",
    "sample_status",
    "outcome",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "deleted_at",
    // Task-related fields
    "due_date",
    "reminder_date",
    "completed",
    "completed_at",
    "priority",
    "sales_id",
    "snooze_until",
    "overdue_notified_at",
    "related_task_id",
    // Pre-joined display name columns from the view
    "creator_first_name",
    "creator_last_name",
    "creator_email",
    "creator_avatar_url",
    "contact_name",
    "organization_name",
    "opportunity_name",
    "principal_organization_name",
    // Virtual/special filters
    "q",
    // Denormalized opportunity fields (direct columns in the view)
    "opportunity_campaign",
    "opportunity_deleted_at",
  ],

  // Tasks resource
  tasks: [
    "id",
    "title", // Changed from "text" to match database column
    "description", // Task description field
    "type", // Task type enum (Call, Email, Meeting, Follow-up, Demo, Proposal, Other)
    "priority", // Priority level enum (low, medium, high, critical)
    "contact_id",
    "opportunity_id",
    "due_date",
    "reminder_date", // Optional reminder date
    "completed", // Boolean field for filtering incomplete/complete tasks
    "completed_at", // Changed from "done_date" to match database column
    "sales_id", // FK to sales (for filtering by assignee)
    "created_by", // FK to sales (created by user)
    "created_at",
    "updated_at",
    "deleted_at", // Soft delete timestamp
    "q", // Special: full-text search parameter
  ],
} as const satisfies Partial<FilterRegistry>;
