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
} as const satisfies Partial<FilterRegistry>;
