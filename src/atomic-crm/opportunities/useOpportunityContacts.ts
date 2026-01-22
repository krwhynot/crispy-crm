import { useMemo } from "react";
import { useGetMany } from "react-admin";
import type { Contact } from "../types";

/**
 * Hook to fetch contacts for an opportunity
 *
 * Uses React Admin's useGetMany which automatically:
 * - Batches multiple requests into single API calls
 * - Deduplicates IDs across components
 * - Caches results to prevent redundant fetches
 *
 * @param contactIds - Array of contact IDs to fetch
 * @returns Object with contacts, primaryContact, and loading state
 */
export function useOpportunityContacts(contactIds: number[]) {
  // Memoize the IDs array to prevent unnecessary re-fetches
  // when parent re-renders with a new array reference but same values
  const stableIds = useMemo(
    () => contactIds,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(contactIds)]
  );

  const {
    data: contacts,
    isLoading,
    error,
  } = useGetMany<Contact>("contacts", { ids: stableIds }, { enabled: stableIds.length > 0 });

  // Memoize derived values
  const result = useMemo(() => {
    const primaryContact = contacts && contacts.length > 0 ? contacts[0] : null;
    return {
      contacts: contacts || [],
      primaryContact,
      isLoading,
      error,
    };
  }, [contacts, isLoading, error]);

  return result;
}
