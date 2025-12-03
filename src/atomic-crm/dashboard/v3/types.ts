/**
 * Dashboard V3 Type Definitions
 *
 * IMPORTANT TYPE NOTES:
 * - React Admin identity.id is ALWAYS string (even though it represents sales.id number)
 * - Database sales.id is ALWAYS bigint (number)
 * - NEVER use identity.id for database queries - use useCurrentSale() hook instead
 * - View filtering happens server-side via sales_id column (not client-side)
 *
 * SCHEMA CONSOLIDATION NOTE:
 * - Activity types are now derived from Zod schemas in validation/activities.ts
 * - ActivityLog and ActivityType are re-exported from the canonical schema
 * - UI-specific types (TaskItem, PrincipalPipelineRow) remain here
 */

import type {
  ActivityLogInput as ActivityLog,
  QuickLogFormInput,
} from "@/atomic-crm/validation/activities";
import type {
  activityDisplayTypeSchema,
  activityOutcomeSchema,
} from "@/atomic-crm/validation/activities";
import type { z } from "zod";

// Re-export canonical activity types for backward compatibility
export type { ActivityLog };
export type ActivityLogInput = QuickLogFormInput;

// Activity types derived from Zod schema (Title Case for UI)
export type ActivityType = z.infer<typeof activityDisplayTypeSchema>;
export type ActivityOutcome = z.infer<typeof activityOutcomeSchema>;

// Principal Pipeline Types
export type Momentum = "increasing" | "steady" | "decreasing" | "stale";

export interface PrincipalPipelineRow {
  id: number;
  name: string;
  totalPipeline: number;
  activeThisWeek: number;
  activeLastWeek: number;
  momentum: Momentum;
  nextAction: string | null;
}

// Task Types
export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "overdue" | "today" | "tomorrow" | "upcoming" | "later";
export type TaskType = "Call" | "Email" | "Meeting" | "Follow-up" | "Demo" | "Proposal" | "Other";

export interface RelatedEntity {
  type: "opportunity" | "contact" | "organization" | "personal";
  name: string;
  id: number;
}

export interface TaskItem {
  id: number;
  subject: string;
  dueDate: Date;
  priority: Priority;
  taskType: TaskType;
  relatedTo: RelatedEntity;
  status: TaskStatus;
  owner?: string;
  notes?: string;
}

// ============================================================================
// Database Response Types (for eliminating `any` in hooks)
// ============================================================================

/**
 * Response shape from principal_pipeline_summary database view
 * Used by usePrincipalPipeline hook
 */
export interface PipelineSummaryRow {
  principal_id: number;
  principal_name: string;
  total_pipeline: number;
  active_this_week: number;
  active_last_week: number;
  momentum: Momentum;
  next_action_summary: string | null;
  sales_id?: number;
}

/**
 * Response shape from tasks table with expanded relations
 * Used by useMyTasks hook
 */
export interface TaskApiResponse {
  id: number;
  subject: string;
  due_date: string;
  priority: string;
  type: string;
  completed: boolean;
  notes?: string;
  sales_id: number;
  opportunity_id?: number;
  contact_id?: number;
  organization_id?: number;
  // Expanded relations (when meta.expand is used)
  opportunity?: { id: number; name: string };
  contact?: { id: number; name: string };
  organization?: { id: number; name: string };
}

/**
 * Response shape from opportunities table/view
 * Used by usePrincipalOpportunities hook
 */
export interface OpportunityApiResponse {
  id: number;
  name?: string;
  stage?: string;
  amount?: number;
  probability?: number;
  last_activity_date?: string;
  estimated_close_date?: string;
  principal_organization_id?: number;
}
