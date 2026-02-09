/**
 * Miscellaneous Domain - Filter Registry
 *
 * Filterable fields for audit_trail and tags.
 */

import type { FilterRegistry } from "./types";

export const miscFilters = {
  // Audit trail resource (field-level history)
  audit_trail: ["audit_id", "table_name", "record_id", "field_name", "changed_by", "changed_at"],

  // Tags resource
  tags: ["id", "name", "color", "usage_count", "created_at", "updated_at", "deleted_at"],

  // Distributor Principal Authorizations Junction Table
  // Links distributors to principals with authorization details
  distributor_principal_authorizations: [
    "id",
    "distributor_id",
    "principal_id",
    "is_authorized",
    "authorization_date",
    "expiration_date",
    "territory_restrictions",
    "notes",
    "created_at",
    "updated_at",
    "created_by",
    "deleted_at",
  ],

  // Interaction Participants Junction Table
  // Links activities to contacts/organizations with participant role
  interaction_participants: [
    "id",
    "activity_id",
    "contact_id",
    "organization_id",
    "role",
    "notes",
    "created_at",
    "deleted_at",
  ],
} as const satisfies Partial<FilterRegistry>;
