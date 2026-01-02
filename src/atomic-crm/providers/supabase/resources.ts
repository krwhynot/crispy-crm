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

  // Notes/activities
  contactNotes: "contactNotes",
  // dealNotes: REMOVED - use opportunityNotes
  opportunityNotes: "opportunityNotes",
  organizationNotes: "organizationNotes",

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
} as const;

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
  opportunities: ["name", "description", "next_action", "lead_source", "customer_organization_name"],
  opportunities_summary: [
    "name",
    "description",
    "next_action",
    "lead_source",
    "principal_organization_name",
    "customer_organization_name",
  ],
  contacts_summary: ["first_name", "last_name"],
  products: ["name", "sku", "category", "description", "manufacturer_part_number"],
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
  "contactNotes",
  "opportunityNotes", // FIX: Was missing - VIEW over opportunity_notes table
  "organizationNotes",
  "interaction_participants",
  "tags",
  "opportunity_products",
  "notifications",
  "distributor_principal_authorizations",
  "organization_distributors",
] as const;

/**
 * Resource configuration for lifecycle callbacks
 */
export const RESOURCE_LIFECYCLE_CONFIG = {
  contactNotes: {
    hasAttachments: true,
  },
  // dealNotes: REMOVED - use opportunityNotes
  opportunityNotes: {
    hasAttachments: true,
  },
  organizationNotes: {
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
