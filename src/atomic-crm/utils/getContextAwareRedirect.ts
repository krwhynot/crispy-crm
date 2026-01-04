import type { RaRecord, RedirectTo } from "ra-core";

/**
 * Returns a redirect function that navigates back to parent context
 * if one exists, otherwise defaults to the new record's show page.
 *
 * Used with React Admin's CreateBase redirect prop.
 *
 * @example
 * // In ContactCreate.tsx
 * const [searchParams] = useSearchParams();
 * const redirect = getContextAwareRedirect(searchParams);
 * <CreateBase redirect={redirect}>
 *
 * @param searchParams - URLSearchParams from useSearchParams() hook
 * @returns Redirect function compatible with React Admin's redirect prop
 */
export const getContextAwareRedirect = (
  searchParams: URLSearchParams
): RedirectTo => {
  // Extract parent context from existing URL params
  // These are the same params used to pre-fill form fields
  const organizationId =
    searchParams.get("organization_id") ||
    searchParams.get("customer_organization_id");
  const opportunityId = searchParams.get("opportunity_id");
  const contactId = searchParams.get("contact_id");

  // Return redirect function with React Admin's expected signature
  return (
    resource: string,
    id?: string | number,
    _data?: Partial<RaRecord>,
    _state?: object
  ): string => {
    // Priority order: organization > opportunity > contact > new record
    // This matches the typical navigation hierarchy in the CRM
    if (organizationId) {
      return `/organizations/${organizationId}/show`;
    }
    if (opportunityId) {
      return `/opportunities/${opportunityId}/show`;
    }
    if (contactId) {
      return `/contacts/${contactId}/show`;
    }
    // Default: go to new record's show page
    return `/${resource}/${id}/show`;
  };
};
