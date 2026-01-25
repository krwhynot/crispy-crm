/**
 * Opportunities Domain - Filter Registry
 *
 * Filterable fields for opportunities, opportunity_notes, opportunity_contacts.
 */

import type { FilterRegistry } from "./types";

export const opportunitiesFilters = {
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
} as const satisfies Partial<FilterRegistry>;
