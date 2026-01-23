/**
 * TD-005 [P3] Missing export from ra-core - CanAccessParams interface locally duplicated
 *
 * WHY LOCAL DEFINITION:
 * ra-core defines CanAccessParams internally but doesn't export it from the public API.
 * This forces consumers to duplicate the interface definition when implementing custom
 * access control logic outside of React Admin's built-in components.
 *
 * VERIFIED AGAINST: ra-core@5.10.0 (current project version)
 *
 * SOURCE REFERENCE:
 * https://github.com/marmelab/react-admin/blob/master/packages/ra-core/src/auth/types.ts
 * The interface exists in ra-core but is not exported from the package index.
 *
 * RESOLUTION OPTIONS:
 * 1. Keep local definition with version documentation (RECOMMENDED - low maintenance)
 * 2. Submit PR to ra-core to export CanAccessParams (high coordination cost)
 * 3. Use `any` type for params (not recommended - loses type safety)
 *
 * MAINTENANCE: When upgrading ra-core, verify this interface still matches upstream.
 * Tracker: docs/technical-debt-tracker.md
 */

/**
 * Supported actions for access control
 */
export type Action = "list" | "show" | "create" | "edit" | "delete" | "export";

/**
 * Supported resources for access control
 */
export type Resource =
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
 * Parameters for access control checks
 */
export interface CanAccessParams<
  RecordType extends Record<string, unknown> = Record<string, unknown>,
> {
  action: Action | string;
  resource: Resource | string;
  record?: RecordType;
}

/**
 * Role-based access types for type safety
 */
type UserRole = "admin" | "manager" | "rep";

/**
 * Checks if a record is owned by the current user based on common ownership fields.
 * Ownership can be established through any of:
 * - sales_id: Primary ownership field for most records
 * - created_by: Creator of the record
 * - opportunity_owner_id: Owner of an opportunity
 * - account_manager_id: Account manager for organizations
 *
 * @param record - The record to check ownership for
 * @param currentSalesId - The sales_id of the current user
 * @returns true if the user owns the record
 */
const isRecordOwner = <RecordType extends Record<string, unknown>>(
  record: RecordType,
  currentSalesId: number
): boolean => {
  return (
    record.sales_id === currentSalesId ||
    record.created_by === currentSalesId ||
    record.opportunity_owner_id === currentSalesId ||
    record.account_manager_id === currentSalesId
  );
};

/**
 * Permission matrix for RBAC:
 * - Admin: Full CRUD on all resources
 * - Manager: Full CRUD on shared resources (contacts/orgs/products)
 * - Rep: CRUD on owned records only (ownership enforced at DB via RLS)
 *
 * Admin-only: sales resource (team management)
 * All roles: contacts, organizations, products, opportunities
 *
 * For rep users, this function provides optional frontend ownership checking
 * to hide UI elements for records they cannot edit/delete. The database RLS
 * provides the authoritative security layer.
 *
 * @param role - The user's role (admin, manager, rep)
 * @param params - Access check parameters including action, resource, and optional record
 * @param currentSalesId - Optional sales_id of the current user for ownership checks.
 *                         When provided with a record for edit/delete actions,
 *                         enables frontend ownership validation for rep users.
 * @returns true if access should be granted
 *
 * @example
 * // Basic access check (backward compatible)
 * canAccess('rep', { action: 'list', resource: 'contacts' });
 *
 * @example
 * // With ownership check for edit action
 * canAccess('rep', { action: 'edit', resource: 'contacts', record: contact }, currentUser.sales_id);
 */
export const canAccess = <RecordType extends Record<string, unknown> = Record<string, unknown>>(
  role: string,
  params: CanAccessParams<RecordType>,
  currentSalesId?: number | null
): boolean => {
  const { action, resource, record } = params;
  const userRole = role as UserRole;

  // Admin has full access to everything
  if (userRole === "admin") {
    return true;
  }

  // Sales resource is admin-only (team management)
  if (resource === "sales") {
    return false;
  }

  // Manager: Full CRUD on shared resources
  if (userRole === "manager") {
    return true;
  }

  // Rep: Access depends on action and ownership
  if (userRole === "rep") {
    // For list/show actions, always allow (RLS filters at DB level)
    if (action === "list" || action === "show" || action === "export") {
      return true;
    }

    // For create, always allow (record will be assigned to user)
    if (action === "create") {
      return true;
    }

    // For edit/delete with record context and currentSalesId, check ownership
    if ((action === "edit" || action === "delete") && record && currentSalesId) {
      return isRecordOwner(record, currentSalesId);
    }

    // Without record context or currentSalesId, allow (RLS will enforce)
    return true;
  }

  // Default deny for unknown roles
  return false;
};
