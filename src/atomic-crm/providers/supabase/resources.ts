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
  opportunities_summary: "opportunities_summary",
  // deals_summary: REMOVED - use opportunities_summary

  // Notes/activities
  contactNotes: "contactNotes",
  // dealNotes: REMOVED - use opportunityNotes
  opportunityNotes: "opportunityNotes",

  // Junction tables for many-to-many relationships
  contact_organizations: "contact_organizations",
  opportunity_participants: "opportunity_participants",
  opportunity_contacts: "opportunity_contacts",
  interaction_participants: "interaction_participants",

  // Other resources
  tasks: "tasks",
  tags: "tags",
  sales: "sales",
  activities: "activities",
  products: "products",
} as const;

/**
 * Resources that support full-text search
 */
export const SEARCHABLE_RESOURCES = {
  organizations: [
    "name",
    "phone_number",
    "website",
    "zipcode",
    "city",
    "stateAbbr",
    "description",
    "segment",
  ],
  organizations_summary: [
    "name",
    "phone_number",
    "website",
    "zipcode",
    "city",
    "stateAbbr",
    "description",
    "segment",
  ],
  contacts: [
    "first_name",
    "last_name",
    "company_name",
    "title",
    "email",
    "phone",
    "background",
  ],
  opportunities: ["name", "category", "description", "next_action"],
  opportunities_summary: ["name", "category", "description"],
  contacts_summary: ["first_name", "last_name"],
  products: ["name", "sku", "brand", "description", "manufacturer_part_number"],
  // deals: REMOVED - use opportunities
} as const;

/**
 * Resources that have soft delete support
 */
export const SOFT_DELETE_RESOURCES = [
  "organizations",
  "contacts",
  "opportunities",
  "contact_organizations",
  "opportunity_participants",
  "activities",
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
  return (
    RESOURCE_MAPPING[resource as keyof typeof RESOURCE_MAPPING] || resource
  );
}

/**
 * Check if a resource supports soft deletes
 */
export function supportsSoftDelete(resource: string): boolean {
  const actualResource = getResourceName(resource);
  return SOFT_DELETE_RESOURCES.includes(actualResource as any);
}

/**
 * Get searchable fields for a resource
 */
export function getSearchableFields(resource: string): readonly string[] {
  return (
    SEARCHABLE_RESOURCES[resource as keyof typeof SEARCHABLE_RESOURCES] || []
  );
}
