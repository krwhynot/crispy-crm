import { useGetIdentity } from "react-admin";
import { canAccess } from "../atomic-crm/providers/commons/canAccess";
import type { UserRole } from "./useUserRole";

/**
 * Extended identity interface that includes the numeric sales_id
 * for ownership checks in canAccess
 */
interface PermissionIdentity {
  id: number; // This is sales.id (numeric, used for ownership checks)
  fullName: string;
  avatar?: string;
  role: UserRole;
}

/**
 * Supported actions for permission checks
 */
export type PermissionAction = "list" | "show" | "create" | "edit" | "delete" | "export";

/**
 * Supported resources for permission checks
 */
export type PermissionResource =
  | "contacts"
  | "organizations"
  | "opportunities"
  | "activities"
  | "tasks"
  | "sales"
  | "products"
  | "tags"
  | "segments";

/**
 * Return type for usePermissions hook
 */
export interface UsePermissionsReturn {
  can: <RecordType extends Record<string, unknown> = Record<string, unknown>>(
    action: PermissionAction,
    resource: PermissionResource,
    record?: RecordType
  ) => boolean;
  role: UserRole;
  salesId: number | null;
  isAdmin: boolean;
  isManager: boolean;
  isRep: boolean;
  isManagerOrAdmin: boolean;
  isLoading: boolean;
}

/**
 * Hook that combines useUserRole with canAccess for convenient permission checking.
 * Provides ownership-aware permission checks for rep users by passing the current
 * user's sales_id to the canAccess helper.
 *
 * @example
 * ```tsx
 * const { can, isAdmin } = usePermissions();
 *
 * // Check if user can delete contacts
 * if (can('delete', 'contacts')) {
 *   return <DeleteButton />;
 * }
 *
 * // Check with record context (ownership check for reps)
 * if (can('edit', 'opportunities', { sales_id: 123 })) {
 *   return <EditButton />;
 * }
 * ```
 */
export const usePermissions = (): UsePermissionsReturn => {
  const { data: identity, isLoading } = useGetIdentity<PermissionIdentity>();

  const role: UserRole = identity?.role || "rep";
  const salesId = identity?.id ?? null;

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isRep = role === "rep";
  const isManagerOrAdmin = isAdmin || isManager;

  const can = <RecordType extends Record<string, unknown> = Record<string, unknown>>(
    action: PermissionAction,
    resource: PermissionResource,
    record?: RecordType
  ): boolean => {
    // Pass salesId for ownership checks (only used for rep edit/delete with record)
    return canAccess(role, { action, resource, record }, salesId);
  };

  return {
    can,
    role,
    salesId,
    isAdmin,
    isManager,
    isRep,
    isManagerOrAdmin,
    isLoading,
  };
};
