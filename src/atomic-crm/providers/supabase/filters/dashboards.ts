/**
 * Dashboards Domain - Filter Registry
 *
 * Filterable fields for dashboard-specific views.
 */

import type { FilterRegistry } from "./types";

export const dashboardsFilters = {
  // Dashboard Principal Summary View (principal-centric dashboard)
  dashboard_principal_summary: [
    "id", // Aliased from principal_organization_id in view
    "principal_name",
    "account_manager_id",
    "opportunity_count",
    "last_activity_date",
    "last_activity_type",
    "days_since_last_activity",
    "status_indicator", // Enum: good/warning/urgent
    "max_days_in_stage",
    "is_stuck", // Boolean: 30+ days in same stage
    "next_action",
    "priority_score",
  ],

  // Dashboard V2 - Principal Opportunities View
  // Database view with pre-aggregated opportunities by principal
  principal_opportunities: [
    "id",
    "opportunity_id",
    "opportunity_name",
    "stage",
    "estimated_close_date",
    "last_activity", // Aliased from updated_at
    "customer_organization_id",
    "customer_name",
    "principal_id",
    "principal_name",
    "days_since_activity", // Computed field
    "health_status", // Computed: active/cooling/at_risk
  ],

  // Dashboard V2 - Priority Tasks View
  // Database view with high-priority and near-due tasks by principal
  priority_tasks: [
    "id",
    "task_id",
    "task_title",
    "due_date",
    "priority",
    "task_type",
    "completed",
    "opportunity_id",
    "opportunity_name",
    "organization_id", // Aliased from customer_organization_id
    "customer_name",
    "principal_organization_id",
    "principal_name",
    "contact_id",
    "contact_name",
  ],

  // Dashboard V3 - Principal Pipeline Summary View
  // Database view with aggregated pipeline metrics and momentum indicators
  principal_pipeline_summary: [
    "principal_id",
    "principal_name",
    "total_pipeline",
    "active_this_week",
    "active_last_week",
    "momentum", // Enum: increasing/steady/decreasing/stale
    "next_action_summary",
    "sales_id",
    "opportunity_owner_id",
    "completed_tasks_30d",
    "total_tasks_30d",
  ],
} as const satisfies Partial<FilterRegistry>;
