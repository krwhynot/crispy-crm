/**
 * Contacts Domain - Filter Registry
 *
 * Filterable fields for contacts, contact_notes, and related views.
 */

import type { FilterRegistry } from "./types";

export const contactsFilters = {
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
} as const satisfies Partial<FilterRegistry>;
