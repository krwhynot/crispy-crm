/**
 * User favorites validation schemas
 *
 * Implements Zod validation for user favorites following Core Principle #3:
 * Single point validation at API boundaries
 *
 * Favorites allow users to bookmark contacts and organizations for quick access.
 * Max 10 favorites per user (enforced in useFavorites hook).
 */

import { z } from "zod";

/**
 * Allowed entity types for favorites
 * Supports contacts, organizations, and opportunities
 */
export const FAVORITE_ENTITY_TYPES = ["contacts", "organizations", "opportunities"] as const;
export type FavoriteEntityType = (typeof FAVORITE_ENTITY_TYPES)[number];

/**
 * Base favorite schema with all fields
 * Uses z.strictObject to prevent mass assignment attacks
 */
export const favoriteSchema = z.strictObject({
  // ID - optional for creates, present on reads
  id: z.union([z.string().max(50, "ID too long"), z.number()]).optional(),

  // User ID - UUID from auth.users
  user_id: z.string().uuid().max(36),

  // Entity reference
  entity_type: z.enum(FAVORITE_ENTITY_TYPES),
  entity_id: z.coerce.number().int().positive(),

  // Cached display name for sidebar rendering (avoids joins)
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(255, "Display name too long"),

  // Timestamps
  created_at: z.string().max(50).optional(),
  deleted_at: z.string().max(50).nullable().optional(),
});

/**
 * Schema for creating a new favorite
 * Omits system-managed fields
 */
export const createFavoriteSchema = favoriteSchema.omit({
  id: true,
  created_at: true,
  deleted_at: true,
});

/**
 * Schema for updating a favorite (primarily for soft delete)
 * All fields optional except id
 */
export const updateFavoriteSchema = favoriteSchema.partial().required({ id: true });

/**
 * Inferred types from schemas
 */
export type Favorite = z.infer<typeof favoriteSchema>;
export type CreateFavoriteInput = z.infer<typeof createFavoriteSchema>;
export type UpdateFavoriteInput = z.infer<typeof updateFavoriteSchema>;

/**
 * Validate favorite creation data
 * @param data - Favorite data to validate
 * @returns Validated and typed favorite data
 */
export function validateCreateFavorite(data: unknown): CreateFavoriteInput {
  return createFavoriteSchema.parse(data);
}

/**
 * Validate favorite update data
 * @param data - Favorite data to validate
 * @returns Validated and typed favorite data
 */
export function validateUpdateFavorite(data: unknown): UpdateFavoriteInput {
  return updateFavoriteSchema.parse(data);
}
