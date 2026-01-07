// src/constants/resources.ts

/**
 * Central resource name constants for React Admin
 * Use these instead of magic strings throughout the codebase
 *
 * @example
 * import { RESOURCES } from "@/constants/resources";
 * useGetList(RESOURCES.CONTACTS);
 */
export const RESOURCES = {
  // ═══════════════════════════════════════════════════════════════════
  // Core CRM Resources (registered in CRM.tsx)
  // ═══════════════════════════════════════════════════════════════════
  OPPORTUNITIES: "opportunities",
  CONTACTS: "contacts",
  ORGANIZATIONS: "organizations",
  PRODUCTS: "products",
  PRODUCT_DISTRIBUTORS: "product_distributors",
  TASKS: "tasks",
  ACTIVITIES: "activities",
  SALES: "sales",
  NOTIFICATIONS: "notifications",

  // ═══════════════════════════════════════════════════════════════════
  // Notes (snake_case to match data provider handlers)
  // ═══════════════════════════════════════════════════════════════════
  CONTACT_NOTES: "contact_notes",
  OPPORTUNITY_NOTES: "opportunity_notes",
  ORGANIZATION_NOTES: "organization_notes",

  // ═══════════════════════════════════════════════════════════════════
  // Supporting Resources
  // ═══════════════════════════════════════════════════════════════════
  TAGS: "tags",
  SEGMENTS: "segments",

  // ═══════════════════════════════════════════════════════════════════
  // Junction Tables (for many-to-many relationships)
  // ═══════════════════════════════════════════════════════════════════
  OPPORTUNITY_PARTICIPANTS: "opportunity_participants",
  OPPORTUNITY_CONTACTS: "opportunity_contacts",
  DISTRIBUTOR_PRINCIPAL_AUTHORIZATIONS: "distributor_principal_authorizations",
  PRODUCT_DISTRIBUTOR_AUTHORIZATIONS: "product_distributor_authorizations",
  ORGANIZATION_DISTRIBUTORS: "organization_distributors",
  INTERACTION_PARTICIPANTS: "interaction_participants",
  USER_FAVORITES: "user_favorites",

  // ═══════════════════════════════════════════════════════════════════
  // Summary Views (read-only, for optimized queries)
  // ═══════════════════════════════════════════════════════════════════
  ORGANIZATIONS_SUMMARY: "organizations_summary",
  CONTACTS_SUMMARY: "contacts_summary",
  OPPORTUNITIES_SUMMARY: "opportunities_summary",
  DASHBOARD_PRINCIPAL_SUMMARY: "dashboard_principal_summary",
  PRINCIPAL_OPPORTUNITIES: "principal_opportunities",
  PRIORITY_TASKS: "priority_tasks",
  DASHBOARD_SNAPSHOTS: "dashboard_snapshots",
} as const;

// Type for resource names (enables type-safe hook usage)
export type ResourceName = (typeof RESOURCES)[keyof typeof RESOURCES];
