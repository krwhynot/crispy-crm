/**
 * Dashboard V3 Type Definitions
 *
 * IMPORTANT TYPE NOTES:
 * - React Admin identity.id is ALWAYS string (even though it represents sales.id number)
 * - Database sales.id is ALWAYS bigint (number)
 * - NEVER use identity.id for database queries - use useCurrentSale() hook instead
 * - View filtering happens server-side via sales_id column (not client-side)
 */

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
export type TaskType = "Call" | "Email" | "Meeting" | "Follow-up" | "Other";

export interface RelatedEntity {
  type: "opportunity" | "contact" | "organization";
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

// Activity Logger Types
export type ActivityType = "Call" | "Email" | "Meeting" | "Follow-up" | "Note";
export type ActivityOutcome =
  | "Connected"
  | "Left Voicemail"
  | "No Answer"
  | "Completed"
  | "Rescheduled";

export interface ActivityLog {
  id?: number;
  activityType: ActivityType;
  outcome: ActivityOutcome;
  date: Date;
  duration?: number;
  contactId?: number;
  organizationId?: number;
  opportunityId?: number;
  notes: string;
  createFollowUp?: boolean;
  followUpDate?: Date;
}
