/**
 * Filter Registry - Type-Safe Filterable Fields Definition
 *
 * This registry defines valid filterable fields for each resource, preventing
 * 400 errors from stale cached filters that reference non-existent database columns.
 *
 * ## Type Safety (Phase 7)
 *
 * This module is now TYPE-LINKED to `database.generated.ts`:
 * - `RegisteredResource` type constrains keys to actual Tables + Views
 * - Column arrays include DB columns + virtual fields (q, stale, nested filters)
 * - `getFilterableFields()` throws on unknown resources (security hardening)
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
 * Last Updated: 2026-01-06
 */

import type { Database } from "@/types/database.generated";

// =============================================================================
// TYPE-SAFE HELPER TYPES
// =============================================================================

/**
 * Extract all table names from the Database type
 */
type TableName = keyof Database["public"]["Tables"];

/**
 * Extract all view names from the Database type
 */
type ViewName = keyof Database["public"]["Views"];

/**
 * All database resources (tables + views)
 */
type DatabaseResource = TableName | ViewName;

/**
 * Extract column names from a table's Row type
 */
type TableColumns<T extends TableName> = keyof Database["public"]["Tables"][T]["Row"];

/**
 * Extract column names from a view's Row type
 */
type ViewColumns<T extends ViewName> = keyof Database["public"]["Views"][T]["Row"];

/**
 * Virtual fields that exist in React Admin but not in the database.
 * These are transformed by the data provider layer.
 */
type _VirtualFilterField =
  | "q" // Full-text search parameter
  | "stale" // Staleness filter (transformed to last_activity_date + stage)
  | "type" // Alias for organization_type/activity_type in some contexts
  | "opportunities.campaign" // Nested relationship filter
  | "opportunities.deleted_at"; // Nested relationship filter

/**
 * Resources registered in the filter registry.
 * Includes database resources + React Admin aliases (e.g., contactNotes → contact_notes)
 */
type RegisteredResource =
  | DatabaseResource
  | "contactNotes" // React Admin alias for contact_notes
  | "opportunityNotes" // React Admin alias for opportunity_notes
  | "user_favorites"; // May not be in generated types yet

/**
 * Type for the filter registry - keys must be registered resources,
 * values are arrays of column names (string for flexibility with virtual fields)
 */
type FilterRegistry = Record<RegisteredResource, readonly string[]>;

// =============================================================================
// FILTER REGISTRY
// =============================================================================

/**
 * The filterable fields registry with type-safe resource keys.
 *
 * NOTE: We use `as const satisfies FilterRegistry` to:
 * 1. Ensure all keys are valid RegisteredResource types
 * 2. Preserve the readonly tuple types for values
 * 3. Allow TypeScript to catch typos in resource names
 */
export const filterableFields = {
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
    "status", // Contact status enum (lead, current, former, etc.)
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
    "status", // Contact status enum (lead, current, former, etc.)
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
  // Note: Fields removed 2025-01-05 - these don't exist in opportunities_summary view:
  // amount, probability, sales_id
  opportunities_summary: [
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
    "campaign",
    "tags", // Array field
    "created_by",
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
    "role", // User role: admin, manager, rep
    "administrator",
    "disabled",
    "deleted_at", // Soft delete timestamp
    "avatar",
    "created_at",
    "updated_at",
    "q", // Special: full-text search parameter
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
  // Note: Many fields removed 2025-01-05 - these don't exist in the products table:
  // sku, distributor_id, certifications, allergens, ingredients, marketing_description, minimum_order_quantity
  products: [
    "id",
    "principal_id",
    "name",
    "description",
    "category",
    "status",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "deleted_at", // Soft delete timestamp
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

  // User Favorites resource
  // Stores user-specific favorites for quick access to contacts, organizations
  user_favorites: [
    "id",
    "user_id",
    "entity_type",
    "entity_id",
    "display_name",
    "created_at",
    "deleted_at",
  ],
} as const satisfies Partial<FilterRegistry>;

// Export the type for external use
export type FilterableResource = keyof typeof filterableFields;

// =============================================================================
// SECURITY-HARDENED ACCESSOR FUNCTIONS
// =============================================================================

/**
 * Custom error class for filter registry security violations.
 * Thrown when an unregistered resource attempts to use filters.
 */
export class UnregisteredResourceError extends Error {
  constructor(resource: string) {
    super(
      `[SECURITY] Resource "${resource}" is not registered in filterRegistry. ` +
        `This could indicate a filter injection attempt or a missing registry entry. ` +
        `Register the resource in filterableFields if it's legitimate.`
    );
    this.name = "UnregisteredResourceError";
  }
}

/**
 * Get filterable fields for a resource (SECURE VERSION).
 *
 * @param resource The resource name to look up
 * @returns The array of filterable field names
 * @throws UnregisteredResourceError if the resource is not in the registry
 *
 * ## Security Rationale
 *
 * The old `isValidFilterField` returned `false` for unknown resources,
 * which could silently allow malformed filters through in some code paths.
 * This function THROWS on unknown resources, ensuring:
 *
 * 1. **Fail-Fast**: Invalid resources are caught immediately at the validation layer
 * 2. **No Silent Failures**: Developers see explicit errors in logs
 * 3. **Defense in Depth**: Even if other validation is bypassed, this catches it
 *
 * @example
 * ```typescript
 * // Safe usage
 * const fields = getFilterableFields("contacts"); // Returns string[]
 *
 * // Throws on unknown resource (security protection)
 * const fields = getFilterableFields("malicious_table"); // Throws UnregisteredResourceError
 * ```
 */
export function getFilterableFields(resource: string): readonly string[] {
  const fields = filterableFields[resource as FilterableResource];
  if (!fields) {
    throw new UnregisteredResourceError(resource);
  }
  return fields;
}

/**
 * Check if a resource is registered in the filter registry.
 * Use this for conditional logic where you need to handle unregistered resources gracefully.
 *
 * @param resource The resource name to check
 * @returns true if the resource is registered, false otherwise
 */
export function isRegisteredResource(resource: string): resource is FilterableResource {
  return resource in filterableFields;
}

/**
 * Helper function to check if a filter field is valid for a resource
 * @param resource The resource name
 * @param filterKey The filter key (may include operators like @gte)
 * @returns true if the filter is valid, false otherwise
 * @throws UnregisteredResourceError if the resource is not in the registry (security hardening)
 */
export function isValidFilterField(resource: string, filterKey: string): boolean {
  // SECURITY: Throw on unknown resources instead of returning false
  const allowedFields = getFilterableFields(resource);

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

// =============================================================================
// TYPE EXPORTS FOR DRIFT PREVENTION TESTS
// =============================================================================

/**
 * Export helper types for use in schema drift tests.
 * These types allow tests to compare registry entries against actual DB schema.
 */
export type { TableName, ViewName, DatabaseResource, TableColumns, ViewColumns };
