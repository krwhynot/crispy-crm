/**
 * Users Domain - Filter Registry
 *
 * Filterable fields for sales (users), user_favorites, notifications.
 */

import type { FilterRegistry } from "./types";

export const usersFilters = {
  // Sales resource (users)
  sales: [
    "id",
    "user_id", // UUID reference to auth.users
    "first_name",
    "last_name",
    "email",
    "phone",
    "role", // User role: admin, manager, rep
    "administrator",
    "disabled",
    "deleted_at", // Soft delete timestamp
    "avatar",
    "created_at",
    "updated_at",
    "q", // Special: full-text search parameter
  ],

  // User Favorites resource
  // Stores user-specific favorites for quick access to contacts, organizations
  user_favorites: [
    "id",
    "user_id",
    "entity_type",
    "entity_id",
    "display_name",
    "created_at",
    "deleted_at",
  ],

  // Notifications resource
  notifications: [
    "id",
    "user_id",
    "type",
    "message",
    "entity_type",
    "entity_id",
    "read",
    "created_at",
    "deleted_at", // Soft delete timestamp
    "q", // Special: full-text search parameter
  ],
} as const satisfies Partial<FilterRegistry>;
