/**
 * Organizations Domain - Filter Registry
 *
 * Filterable fields for organizations, segments, and related views.
 */

import type { FilterRegistry } from "./types";

export const organizationsFilters = {
  // Organizations resource
  organizations: [
    "id",
    "name",
    "type", // Alias for organization_type used in some filters
    "organization_type",
    "org_scope",
    "parent_organization_id",
    "parent_organization_name", // Computed: parent org name (used for sorting)
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
    "segment_name", // Computed: segment name (from segments JOIN, used for sorting)
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
    "org_scope",
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
    "segment_name", // Computed: segment name (from segments JOIN)
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
} as const satisfies Partial<FilterRegistry>;
