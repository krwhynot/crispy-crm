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
    "q", // Special: full-text search parameter
    // Nested relationship filters for CampaignActivityReport
    "opportunities.campaign", // Filter by related opportunity's campaign
    "opportunities.deleted_at", // Filter by related opportunity's soft-delete status
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
