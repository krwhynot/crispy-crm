/**
 * Resource configuration for Supabase provider
 * Defines the mapping between React Admin resources and database tables/views
 */

// Resource names mapping - NO BACKWARD COMPATIBILITY
export const RESOURCE_MAPPING = {
  // Core entities
  organizations: "organizations",
  contacts: "contacts",
  opportunities: "opportunities",
  // deals: REMOVED - use opportunities

  // Summary views for optimized queries
  organizations_summary: "organizations_summary",
  contacts_summary: "contacts_summary",
  contact_organization_details: "contact_organization_details",
  opportunities_summary: "opportunities_summary", // Re-enabled for dashboard widgets
  dashboard_principal_summary: "dashboard_principal_summary", // Principal-centric dashboard view
  principal_opportunities: "principal_opportunities", // Dashboard V2 - opportunities by principal
  priority_tasks: "priority_tasks", // Dashboard V2 - prioritized tasks view
  // deals_summary: REMOVED - migrated to opportunities

  // Notes/activities (snake_case to match HANDLED_RESOURCES in composedDataProvider)
  contact_notes: "contact_notes",
  // dealNotes: REMOVED - use opportunity_notes
  opportunity_notes: "opportunity_notes",
  organization_notes: "organization_notes",

  // Resources with composed handlers (map to themselves for completeness)
  segments: "segments",
  product_distributors: "product_distributors",

  // Junction tables for many-to-many relationships
  // contact_organizations: REMOVED - deprecated, contacts now use single organization_id FK
  opportunity_participants: "opportunity_participants",
  opportunity_contacts: "opportunity_contacts",
  interaction_participants: "interaction_participants",
  distributor_principal_authorizations: "distributor_principal_authorizations",
  organization_distributors: "organization_distributors",

  // Other resources
  tasks: "tasks",
  tags: "tags",
  sales: "sales",
  activities: "activities",
  products: "products",
  dashboard_snapshots: "dashboard_snapshots", // Historical KPI snapshots for week-over-week trends
  user_favorites: "user_favorites", // User-specific favorites for quick access
  opportunity_stage_changes: "opportunity_stage_changes", // View: stage transitions from audit trail
} as const;

/**
 * Resources with FTS enabled (PostgreSQL full-text search)
 *
 * Staged rollout: Add resources here after verifying:
 * 1. Summary view has search_tsv column exposed
 * 2. GIN index exists on base table
 * 3. Result drift is acceptable (<5% difference from ILIKE)
 *
 * @see __tests__/ftsOperatorSyntax.contract.test.ts for syntax
 */
export const FTS_ENABLED_RESOURCES: readonly string[] = [
  // Phase 1: Start with contacts (most tested)
  // "contacts",
  // Phase 2: Add after contacts validation
  // "organizations",
  // "opportunities",
  // Phase 3: Products
  // "products",
] as const;

/**
 * Resources that support full-text search
 */
export const SEARCHABLE_RESOURCES = {
  organizations: ["name", "phone", "website", "postal_code", "city", "state", "description"],
  organizations_summary: [
    "name",
    "phone",
    "website",
    "postal_code",
    "city",
    "state",
    "description",
  ],
  contacts: ["first_name", "last_name", "company_name", "title"],
  opportunities: [
    "name",
    "description",
    "next_action",
    "lead_source",
    "customer_organization_name",
  ],
  opportunities_summary: [
    "name",
    "description",
    "next_action",
    "lead_source",
    "principal_organization_name",
    "customer_organization_name",
  ],
  contacts_summary: ["first_name", "last_name"],
  products: ["name", "category", "description", "manufacturer_part_number"],
  sales: ["first_name", "last_name", "email"],
  // deals: REMOVED - use opportunities
} as const;

/**
 * Resources that have soft delete support
 * Updated per Constitution audit 2025-11-08
 */
export const SOFT_DELETE_RESOURCES = [
  "organizations",
  "contacts",
  "opportunities",
  // "contact_organizations", - REMOVED: table deprecated
  "opportunity_participants",
  "opportunity_contacts", // FIX: Was missing - junction table has deleted_at
  "activities",
  "products",
  "sales",
  "tasks", // FIX: Was missing - caused hard DELETE triggering RLS denial and logout
  "contact_preferred_principals",
  // Added per Constitution audit - now have deleted_at columns:
  "segments",
  "contact_notes", // snake_case to match RESOURCE_MAPPING
  "opportunity_notes", // snake_case to match RESOURCE_MAPPING
  "organization_notes", // snake_case to match RESOURCE_MAPPING
  "interaction_participants",
  "tags",
  "opportunity_products",
  "notifications",
  "distributor_principal_authorizations",
  "organization_distributors",
  "user_favorites",
] as const;

/**
 * Resource configuration for lifecycle callbacks
 */
export const RESOURCE_LIFECYCLE_CONFIG = {
  contact_notes: {
    hasAttachments: true,
  },
  // dealNotes: REMOVED - use opportunity_notes
  opportunity_notes: {
    hasAttachments: true,
  },
  organization_notes: {
    hasAttachments: true,
  },
  sales: {
    hasAvatar: true,
  },
  contacts: {
    hasAvatar: true,
    processAvatar: true,
    hasFullTextSearch: true,
  },
  organizations: {
    hasLogo: true,
    processLogo: true,
    hasFullTextSearch: true,
  },
  opportunities: {
    hasFullTextSearch: true,
  },
  tags: {
    hasColorValidation: true,
  },
} as const;

/**
 * Get the actual database resource name from the mapping
 */
export function getResourceName(resource: string): string {
  return RESOURCE_MAPPING[resource as keyof typeof RESOURCE_MAPPING] || resource;
}

/**
 * Check if a resource supports soft deletes
 */
export function supportsSoftDelete(resource: string): boolean {
  const actualResource = getResourceName(resource);
  return SOFT_DELETE_RESOURCES.includes(actualResource as (typeof SOFT_DELETE_RESOURCES)[number]);
}

/**
 * Get searchable fields for a resource
 */
export function getSearchableFields(resource: string): readonly string[] {
  return SEARCHABLE_RESOURCES[resource as keyof typeof SEARCHABLE_RESOURCES] || [];
}

/**
 * Check if a resource has FTS (full-text search) enabled
 *
 * Resources must be explicitly added to FTS_ENABLED_RESOURCES after validation.
 * Fallback is ILIKE-based search via SEARCHABLE_RESOURCES.
 */
export function isFtsEnabled(resource: string): boolean {
  const actualResource = getResourceName(resource);
  // Check both base resource and summary view variants
  return (
    FTS_ENABLED_RESOURCES.includes(actualResource) ||
    FTS_ENABLED_RESOURCES.includes(actualResource.replace("_summary", ""))
  );
}
