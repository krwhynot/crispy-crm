/**
 * Filter Registry - Filterable Fields Definition
 *
 * This registry defines valid filterable fields for each resource, preventing
 * 400 errors from stale cached filters that reference non-existent database columns.
 *
 * Used by:
 * - ValidationService.validateFilters() in the dataProvider layer (API protection)
 * - useFilterCleanup() hook in components (localStorage/UI cleanup)
 *
 * IMPORTANT: Update this registry when database schema changes affect filterable columns.
 *
 * Note: For fields supporting React Admin filter operators (e.g., @gte, @lte, @like),
 * only list the base field name. The validation logic handles operator suffixes.
 * Example: "last_seen" allows "last_seen@gte", "last_seen@lte", etc.
 *
 * ## $or Filter Limitation (UX-02)
 *
 * **KNOWN LIMITATION:** Same-key alternatives in $or do NOT work due to JavaScript
 * object key deduplication:
 *
 * ```typescript
 * // ❌ DOES NOT WORK: Same field in multiple $or conditions
 * { $or: [{ stage: "a" }, { stage: "b" }] }
 * // Transforms to: { "@or": { stage: "b" } } — "a" is silently lost!
 *
 * // ✅ WORKAROUND: Use @in operator instead
 * { "stage@in": ["a", "b"] }
 * // Correctly queries: stage IN ('a', 'b')
 * ```
 *
 * **Why this happens:** When transformOrFilter() converts $or array to PostgREST
 * object format, duplicate keys are deduplicated by JavaScript (last value wins).
 *
 * **When to use $or:** Multi-field OR queries work correctly:
 * ```typescript
 * { $or: [{ customer_org_id: 5 }, { principal_org_id: 5 }] }
 * // Works! Different keys are preserved.
 * ```
 *
 * Schema Source: Derived from actual database columns via supabase-lite MCP tools
 * Last Updated: 2025-12-12
 */

export const filterableFields: Record<string, string[]> = {
  // Contacts resource (uses contacts_summary view)
  contacts: [
    "id",
    "first_name",
    "last_name",
    "email", // JSONB field - search applies to email array
    "phone", // JSONB field - search applies to phone array
    "title",
    "department",
    "city",
    "state",
    "postal_code",
    "country",
    "birthday",
    "linkedin_url",
    "twitter_handle",
    "sales_id",
    "created_at",
    "updated_at",
    "deleted_at", // Soft delete timestamp
    "last_seen",
    "first_seen",
    "gender",
    "tags", // Array field
    "organization_id",
    "company_name", // From organizations join
    "q", // Special: full-text search parameter
  ],

  // Contacts Summary View (database view with computed fields)
  // Shares same filterable fields as contacts base resource
  contacts_summary: [
    "id",
    "first_name",
    "last_name",
    "email", // JSONB field - search applies to email array
    "phone", // JSONB field - search applies to phone array
    "title",
    "department",
    "city",
    "state",
    "postal_code",
    "country",
    "birthday",
    "linkedin_url",
    "twitter_handle",
    "sales_id",
    "created_at",
    "updated_at",
    "deleted_at", // Soft delete timestamp
    "last_seen",
    "first_seen",
    "gender",
    "tags", // Array field
    "organization_id",
    "company_name", // From organizations join
    "q", // Special: full-text search parameter
  ],

  // Organizations resource
  organizations: [
    "id",
    "name",
    "type", // Alias for organization_type used in some filters
    "organization_type",
    "parent_organization_id",
    "priority",
    "website",
    "city",
    "state",
    "postal_code",
    "phone",
    "email",
    "linkedin_url",
    "sales_id",
    "segment_id",
    "created_at",
    "updated_at",
    "deleted_at", // Soft delete timestamp
    "q", // Special: full-text search parameter
  ],

  // Organizations Summary View (database view with computed fields)
  // Used automatically by getDatabaseResource() for organizations list queries
  organizations_summary: [
    "id",
    "name",
    "type", // Alias for organization_type used in some filters
    "organization_type",
    "parent_organization_id",
    "parent_organization_name", // Computed: parent org name
    "priority",
    "website",
    "city",
    "state",
    "postal_code",
    "phone",
    "email",
    "linkedin_url",
    "sales_id",
    "segment_id",
    "employee_count",
    "description",
    "created_at",
    "updated_at",
    "deleted_at", // Soft delete timestamp
    // Additional computed/aggregated fields from the view
    "child_branch_count",
    "total_contacts_across_branches",
    "total_opportunities_across_branches",
    "nb_opportunities",
    "nb_contacts",
    "last_opportunity_activity",
    "nb_notes",
    "q", // Special: full-text search parameter
  ],

  // Opportunities resource
  opportunities: [
    "id",
    "name",
    "stage",
    "status",
    "priority",
    "index",
    "estimated_close_date",
    "actual_close_date",
    "customer_organization_id",
    "principal_organization_id",
    "distributor_organization_id",
    "related_opportunity_id",
    "founding_interaction_id",
    "stage_manual",
    "status_manual",
    "next_action_date",
    "contact_ids", // Array field
    "opportunity_owner_id",
    "account_manager_id",
    "lead_source",
    "tags", // Array field
    "created_by", // Added: creator/owner field (equivalent to sales_id in other resources)
    "created_at",
    "updated_at",
    "deleted_at", // Soft delete timestamp
    "q", // Special: full-text search parameter
    "stale", // Virtual filter: transformed to last_activity_date + stage filters (see dataProviderUtils.ts)
  ],

  // Opportunities Summary View (database view with computed fields)
  // Used automatically by getDatabaseResource() for opportunities list queries
  opportunities_summary: [
    "id",
    "name",
    "stage",
    "status",
    "priority",
    "index",
    "amount",
    "probability",
    "estimated_close_date",
    "actual_close_date",
    "customer_organization_id",
    "principal_organization_id",
    "distributor_organization_id",
    "related_opportunity_id",
    "founding_interaction_id",
    "stage_manual",
    "status_manual",
    "next_action_date",
    "contact_ids", // Array field
    "opportunity_owner_id",
    "account_manager_id",
    "lead_source",
    "campaign",
    "tags", // Array field
    "created_by",
    "sales_id", // FK to sales (alias for filtering by owner, commonly used in dashboard queries)
    "created_at",
    "updated_at",
    "deleted_at", // Soft delete timestamp
    // Additional computed/joined fields from the view
    "customer_organization_name",
    "principal_organization_name",
    "distributor_organization_name",
    "products", // JSONB array from view
    "last_activity_date", // Computed field for staleness filtering
    "q", // Special: full-text search parameter
    "stale", // Virtual filter: transformed to last_activity_date + stage filters (see dataProviderUtils.ts)
  ],

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

  // Activities resource
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
    "q", // Special: full-text search parameter
    // Nested relationship filters for CampaignActivityReport
    "opportunities.campaign", // Filter by related opportunity's campaign
    "opportunities.deleted_at", // Filter by related opportunity's soft-delete status
  ],

  // Audit trail resource (field-level history)
  audit_trail: ["audit_id", "table_name", "record_id", "field_name", "changed_by", "changed_at"],

  // Tags resource
  tags: ["id", "name", "color", "usage_count", "created_at", "updated_at", "deleted_at"],

  // Sales resource (users)
  sales: [
    "id",
    "user_id", // UUID reference to auth.users
    "first_name",
    "last_name",
    "email",
    "phone",
    "administrator",
    "disabled",
    "deleted_at", // Soft delete timestamp
    "avatar",
    "created_at",
    "updated_at",
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

  // Contact Notes resource
  contactNotes: [
    "id",
    "contact_id",
    "text",
    "date",
    "attachments", // Array field
    "sales_id",
    "created_at",
    "updated_at",
  ],

  // Opportunity Notes resource
  opportunityNotes: [
    "id",
    "opportunity_id",
    "text",
    "date",
    "attachments", // Array field
    "sales_id",
    "created_at",
    "updated_at",
  ],

  // Segments resource
  segments: [
    "id",
    "name",
    "segment_type", // Filter by 'playbook' or 'operator'
    "parent_id", // Filter by parent segment
    "display_order", // For ordering
    "created_at",
    "created_by",
  ],

  // Products resource
  products: [
    "id",
    "principal_id",
    "distributor_id",
    "name",
    "description",
    "sku",
    "category",
    "status",
    "certifications", // Array field
    "allergens", // Array field
    "ingredients",
    "marketing_description",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "deleted_at", // Soft delete timestamp
    "minimum_order_quantity",
    "manufacturer_part_number",
    "q", // Special: full-text search parameter
  ],

  // Distinct Product Categories view (for filter dropdowns)
  distinct_product_categories: ["id", "name"],

  // Notifications resource
  notifications: [
    "id",
    "user_id",
    "type",
    "message",
    "entity_type",
    "entity_id",
    "read",
    "created_at",
    "q", // Special: full-text search parameter
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
  ],

  // Opportunity Contacts Junction Table
  // Links opportunities to contacts with role and primary contact designation
  opportunity_contacts: [
    "id",
    "opportunity_id",
    "contact_id",
    "role",
    "is_primary",
    "notes",
    "created_at",
  ],
};

/**
 * Helper function to check if a filter field is valid for a resource
 * @param resource The resource name
 * @param filterKey The filter key (may include operators like @gte)
 * @returns true if the filter is valid, false otherwise
 */
export function isValidFilterField(resource: string, filterKey: string): boolean {
  const allowedFields = filterableFields[resource];
  if (!allowedFields) {
    return false; // Unknown resource, consider invalid
  }

  // Logical operators - whitelist both input and output formats:
  // Input: MongoDB-style $or/$and/$not from components
  // Output: PostgREST or/and/not after transformOrFilter() conversion.
  const LOGICAL_OPERATORS = ["$or", "$and", "$not", "or", "and", "not", "@or", "or@"];
  if (LOGICAL_OPERATORS.includes(filterKey)) {
    return true;
  }

  // Extract base field name, handling React Admin's filter operators
  // Examples: "last_seen@gte" -> "last_seen", "name@like" -> "name"
  const baseField = filterKey.split("@")[0];

  return allowedFields.includes(baseField) || allowedFields.includes(filterKey);
}
