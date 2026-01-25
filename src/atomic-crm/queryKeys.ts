/**
 * Query Key Factories
 *
 * Centralized cache key management for React Query.
 * Ensures fetch keys and invalidation keys always match.
 *
 * Usage:
 * - Fetching: useQuery({ queryKey: contactKeys.detail(123), ... })
 * - Invalidating: queryClient.invalidateQueries({ queryKey: contactKeys.all })
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

// Factory pattern for each resource
const createKeys = <T extends string>(resource: T) => ({
  all: [resource] as const,
  lists: () => [resource, "list"] as const,
  list: (filters?: Record<string, unknown>) => [resource, "list", filters] as const,
  details: () => [resource, "detail"] as const,
  detail: (id: number | string) => [resource, "detail", id] as const,
});

// Core CRM Resources
export const contactKeys = createKeys("contacts");
export const organizationKeys = createKeys("organizations");
export const opportunityKeys = createKeys("opportunities");
export const activityKeys = createKeys("activities");
export const taskKeys = createKeys("tasks");
export const productKeys = createKeys("products");

// Notes (polymorphic)
export const contactNoteKeys = createKeys("contact_notes");
export const opportunityNoteKeys = createKeys("opportunity_notes");
export const organizationNoteKeys = createKeys("organization_notes");

// Supporting Resources
export const tagKeys = createKeys("tags");
export const saleKeys = createKeys("sales");
export const segmentKeys = createKeys("segments");

// Junction Tables
export const opportunityParticipantKeys = createKeys("opportunity_participants");
export const opportunityContactKeys = createKeys("opportunity_contacts");
export const userFavoriteKeys = createKeys("user_favorites");
export const productDistributorAuthKeys = createKeys("product_distributor_authorizations");
export const distributorPrincipalAuthKeys = createKeys("distributor_principal_authorizations");
export const opportunityProductKeys = createKeys("opportunity_products");

// Custom / Non-CRUD Keys
export const orgDescendantKeys = {
  all: ["org-descendants"] as const,
  detail: (orgId: number) => ["org-descendants", orgId] as const,
};

export const digestKeys = {
  all: ["digestPreference"] as const,
  preference: () => ["digestPreference"] as const,
};

// Dashboard Keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  widgets: () => ["dashboard", "widgets"] as const,
  stats: (period?: string) => ["dashboard", "stats", period] as const,
};

// Activity Log Keys (polymorphic by organization)
export const activityLogKeys = {
  all: ["activityLog"] as const,
  byOrganization: (orgId?: number | string) => ["activityLog", orgId] as const,
};

// Notification Keys
export const notificationKeys = {
  all: ["notifications"] as const,
  unread: (userId?: string) => ["notifications", "unread", userId] as const,
  count: (userId?: string) => ["notifications", "count", userId] as const,
};

// Report Keys
export const reportKeys = {
  all: ["reports"] as const,
  campaignStats: (campaign?: string) => ["campaign-report-stats", campaign] as const,
  staleOpportunities: (
    campaign?: string,
    dateRange?: { start: string; end: string } | null,
    salesRepId?: number | null
  ) =>
    [
      "stale-opportunities",
      campaign,
      dateRange?.start,
      dateRange?.end,
      salesRepId,
    ] as const,
};

// Aggregate export for convenience
export const queryKeys = {
  contacts: contactKeys,
  organizations: organizationKeys,
  opportunities: opportunityKeys,
  activities: activityKeys,
  tasks: taskKeys,
  products: productKeys,
  contactNotes: contactNoteKeys,
  opportunityNotes: opportunityNoteKeys,
  organizationNotes: organizationNoteKeys,
  tags: tagKeys,
  sales: saleKeys,
  segments: segmentKeys,
  opportunityParticipants: opportunityParticipantKeys,
  opportunityContacts: opportunityContactKeys,
  userFavorites: userFavoriteKeys,
  productDistributorAuth: productDistributorAuthKeys,
  distributorPrincipalAuth: distributorPrincipalAuthKeys,
  opportunityProducts: opportunityProductKeys,
  orgDescendants: orgDescendantKeys,
  digest: digestKeys,
  dashboard: dashboardKeys,
  activityLog: activityLogKeys,
  notifications: notificationKeys,
  reports: reportKeys,
} as const;
