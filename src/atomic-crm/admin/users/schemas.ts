import { z } from 'zod';

/**
 * User role enum - matches database user_role type
 */
export const UserRoleEnum = z.enum(['admin', 'manager', 'rep']);
export type UserRole = z.infer<typeof UserRoleEnum>;

/**
 * Schema for inviting a new user
 * Validation happens at Edge Function (API boundary), NOT in form
 * This schema is for TypeScript types only
 */
export const userInviteSchema = z.strictObject({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: UserRoleEnum.default('rep'),
});

export type UserInvite = z.infer<typeof userInviteSchema>;

/**
 * Schema for updating an existing user
 */
export const userUpdateSchema = z.strictObject({
  sales_id: z.coerce.number().int().positive(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  role: UserRoleEnum.optional(),
  disabled: z.coerce.boolean().optional(),
});

export type UserUpdate = z.infer<typeof userUpdateSchema>;

/**
 * Role display configuration for UI
 */
export const ROLE_CHOICES = [
  { id: 'admin', name: 'Admin' },
  { id: 'manager', name: 'Manager' },
  { id: 'rep', name: 'Rep' },
] as const;

/**
 * Role badge color mapping (semantic tokens)
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  rep: 'bg-muted text-muted-foreground',
};
