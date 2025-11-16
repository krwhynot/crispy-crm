/**
 * Type definitions for Principal Dashboard data structures
 *
 * These types match the database views created for the Principal Dashboard MVP:
 * - principal_opportunities (Task 1)
 * - priority_tasks (Task 2)
 *
 * All property names use snake_case to match database column names exactly.
 * Enum values match database enum types exactly.
 */

// Health status for opportunity tracking (based on days since last activity)
export type HealthStatus = 'active' | 'cooling' | 'at_risk';

// Opportunity stage enum (matches database opportunity_stage enum)
export type OpportunityStage =
  | 'new_lead'
  | 'initial_outreach'
  | 'sample_visit_offered'
  | 'awaiting_response'
  | 'feedback_logged'
  | 'demo_scheduled'
  | 'closed_won'
  | 'closed_lost';

// Task priority enum (matches database priority_level enum)
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// Task type enum (matches database task_type enum)
export type TaskType =
  | 'Call'
  | 'Email'
  | 'Meeting'
  | 'Follow-up'
  | 'Proposal'
  | 'Discovery'
  | 'Administrative'
  | 'None';

// Principal Opportunity (from principal_opportunities view)
// View definition: supabase/migrations/*_principal_opportunities_view.sql
export interface PrincipalOpportunity {
  opportunity_id: number;
  opportunity_name: string;
  stage: OpportunityStage;
  estimated_close_date: string | null;
  last_activity: string;
  customer_organization_id: number;
  customer_name: string;
  principal_id: number;
  principal_name: string;
  sales_id: string;  // Sales rep assigned to opportunity (for assignee filtering)
  days_since_activity: number;
  health_status: HealthStatus;
}

// Priority Task (from priority_tasks view)
// View definition: supabase/migrations/*_priority_tasks_view.sql
export interface PriorityTask {
  task_id: number;
  task_title: string;
  due_date: string | null;
  priority: TaskPriority;
  task_type: TaskType;
  completed: boolean;
  sales_id: string;  // Sales rep assigned to task (for assignee filtering)
  opportunity_id: number | null;
  opportunity_name: string | null;
  organization_id: number | null;
  customer_name: string | null;
  principal_organization_id: number | null;
  principal_name: string | null;
  contact_id: number | null;
  contact_name: string | null;
}

// Activity type for quick logger
export type ActivityType = 'call' | 'email' | 'meeting' | 'note';

// Quick activity log entry
export interface QuickActivity {
  type: ActivityType;
  principal_id: number;
  opportunity_id?: number;
  notes?: string;
}
