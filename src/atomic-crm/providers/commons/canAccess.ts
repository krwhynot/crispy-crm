// TD-005 [P3] Missing export from ra-core - CanAccessParams interface locally duplicated
// Effort: 1-2 hours | Status: Keep as-is with version documentation
// ra-core doesn't export this interface, forcing local definition
// Verified against: ra-core@4.x | Tracker: docs/technical-debt-tracker.md
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
