import type { RaRecord, RedirectTo } from "ra-core";

/**
 * Interface for the JSON-encoded source context param
 * Used by some navigation flows (e.g., OrganizationOpportunitiesTab)
 */
interface SourceContext {
  organization_id?: string | number;
  customer_organization_id?: string | number;
  opportunity_id?: string | number;
  contact_id?: string | number;
}

/**
 * Safely parse JSON source param, returning empty object on failure.
 * URLSearchParams.get() automatically decodes URI components.
 */
const parseSourceParam = (searchParams: URLSearchParams): SourceContext => {
  const sourceJson = searchParams.get("source");
  if (!sourceJson) return {};

  try {
    return JSON.parse(sourceJson) as SourceContext;
  } catch (e) {
    console.warn("Failed to parse source param:", e);
    return {};
  }
};

/**
 * Returns a redirect function that navigates back to parent context
 * if one exists, otherwise defaults to the new record's slide-over.
 *
 * Uses the app's slide-over navigation pattern (`?view={id}`) instead of
 * dedicated show pages. This matches the current app architecture where
 * detail views are rendered as right-side panels on list pages.
 *
 * Supports two context-passing patterns:
 * 1. Direct URL params: `?organization_id=123`
 * 2. JSON-encoded source: `?source={"customer_organization_id":123}`
 *
 * URL Patterns:
 * - Parent context exists: `/{parentResource}?view={parentId}`
 * - Direct create: `/{resource}?view={newId}`
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
export const getContextAwareRedirect = (searchParams: URLSearchParams): RedirectTo => {
  // Parse JSON source param (used by some navigation flows)
  const sourceContext = parseSourceParam(searchParams);

  // Extract parent context from BOTH direct params AND source JSON
  // Direct params take precedence over source JSON
  const organizationId =
    searchParams.get("organization_id") ||
    searchParams.get("customer_organization_id") ||
    sourceContext.organization_id ||
    sourceContext.customer_organization_id;

  const opportunityId = searchParams.get("opportunity_id") || sourceContext.opportunity_id;

  const contactId = searchParams.get("contact_id") || sourceContext.contact_id;

  // Return redirect function with React Admin's expected signature
  return (resource: string, id?: string | number, _data?: Partial<RaRecord>): string => {
    // 1. Parent Context Redirects (Go back to where we started)
    if (organizationId) return `/organizations?view=${organizationId}`;
    if (opportunityId) return `/opportunities?view=${opportunityId}`;
    if (contactId) return `/contacts?view=${contactId}`;

    // 2. Default Redirect (Open the new item in slide-over)
    // Ensure 'id' exists to prevent /resource?view=undefined
    if (id) return `/${resource}?view=${id}`;

    // Fallback if no ID (rare error case) -> Go to list
    return `/${resource}`;
  };
};
