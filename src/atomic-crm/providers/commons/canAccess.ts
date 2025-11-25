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
interface CanAccessParams<RecordType extends Record<string, any> = Record<string, any>> {
  action: string;
  resource: string;
  record?: RecordType;
}

export const canAccess = <RecordType extends Record<string, any> = Record<string, any>>(
  role: string,
  params: CanAccessParams<RecordType>
) => {
  if (role === "admin") {
    return true;
  }

  // Non admins can't access the sales resource
  if (params.resource === "sales") {
    return false;
  }

  return true;
};
