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
 * Schema Source: Derived from actual database columns via supabase-lite MCP tools
 * Last Updated: 2025-10-08
 */

export const filterableFields: Record<string, string[]> = {
  // Contacts resource (uses contacts_summary view)
  contacts: [
    "id",
    "first_name",
    "last_name",
    "email",           // JSONB field - search applies to email array
    "phone",           // JSONB field - search applies to phone array
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
    "deleted_at",      // Soft delete timestamp
    "last_seen",
    "first_seen",
    "gender",
    "tags",            // Array field
    "organization_id",
    "company_name",    // From organizations join
    "q",               // Special: full-text search parameter
  ],

  // Organizations resource
  organizations: [
    "id",
    "name",
    "organization_type",
    "is_principal",
    "is_distributor",
    "parent_organization_id",
    "priority",
    "website",
    "city",
    "state",
    "postal_code",
    "phone",
    "email",
    "linkedin_url",
    "annual_revenue",
    "employee_count",
    "founded_year",
    "sales_id",
    "segment_id",
    "created_at",
    "updated_at",
    "q",               // Special: full-text search parameter
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
    "founding_interaction_id",
    "stage_manual",
    "status_manual",
    "next_action_date",
    "contact_ids",     // Array field
    "opportunity_owner_id",
    "account_manager_id",
    "lead_source",
    "tags",            // Array field
    "created_by",      // Added: creator/owner field (equivalent to sales_id in other resources)
    "created_at",
    "updated_at",
    "q",               // Special: full-text search parameter
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
    "tags",            // Array field
    "created_at",
    "updated_at",
    "created_by",
  ],

  // Tags resource
  tags: [
    "id",
    "name",
    "color",
    "usage_count",
    "created_at",
    "updated_at",
  ],

  // Sales resource (users)
  sales: [
    "id",
    "first_name",
    "last_name",
    "email",
    "administrator",
    "disabled",
    "avatar",
  ],

  // Tasks resource
  tasks: [
    "id",
    "title",            // Changed from "text" to match database column
    "type",
    "contact_id",
    "opportunity_id",
    "due_date",
    "completed_at",     // Changed from "done_date" to match database column
    "sales_id",
    "created_at",
    "updated_at",
  ],

  // Contact Notes resource
  contactNotes: [
    "id",
    "contact_id",
    "text",
    "date",
    "attachments",     // Array field
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
    "attachments",     // Array field
    "sales_id",
    "created_at",
    "updated_at",
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

  // Extract base field name, handling React Admin's filter operators
  // Examples: "last_seen@gte" -> "last_seen", "name@like" -> "name"
  const baseField = filterKey.split('@')[0];

  return allowedFields.includes(baseField) || allowedFields.includes(filterKey);
}
