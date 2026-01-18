import type { ReactNode } from "react";
import {
  usePermissions,
  type PermissionAction,
  type PermissionResource,
} from "../hooks/usePermissions";

/**
 * Props for CanAccess component
 */
export interface CanAccessProps<
  RecordType extends Record<string, unknown> = Record<string, unknown>,
> {
  action: PermissionAction;
  resource: PermissionResource;
  record?: RecordType;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on user permissions.
 * Uses the usePermissions hook to check if the current user can perform
 * the specified action on the given resource.
 *
 * @example
 * ```tsx
 * // Hide delete button for non-owners
 * <CanAccess action="delete" resource="contacts" record={contact}>
 *   <DeleteButton />
 * </CanAccess>
 *
 * // Show alternative UI when access denied
 * <CanAccess action="edit" resource="sales" fallback={<ViewOnlyBadge />}>
 *   <EditButton />
 * </CanAccess>
 * ```
 */
export const CanAccess = <RecordType extends Record<string, unknown> = Record<string, unknown>>({
  action,
  resource,
  record,
  children,
  fallback = null,
}: CanAccessProps<RecordType>): ReactNode => {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (can(action, resource, record)) {
    return children;
  }

  return fallback;
};
