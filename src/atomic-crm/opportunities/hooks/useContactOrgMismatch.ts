import { useMemo } from "react";
import { useGetMany } from "react-admin";
import type { Contact } from "../../types";
import type { Identifier } from "ra-core";

/**
 * Contact organization mismatch information
 */
export interface MismatchedContact {
  contact: Contact;
  contactOrgId: Identifier | null | undefined;
}

/**
 * Hook result for contact organization mismatch detection
 */
export interface UseContactOrgMismatchResult {
  /** Contacts whose organization doesn't match the opportunity's customer org */
  mismatchedContacts: MismatchedContact[];
  /** Whether any contacts have mismatched organizations */
  hasMismatch: boolean;
  /** Whether the mismatch check is loading */
  isLoading: boolean;
}

/**
 * Hook to detect when selected contacts belong to a different organization
 * than the opportunity's customer organization.
 *
 * This is a data quality check - contacts should typically belong to the
 * same organization as the opportunity's customer. A mismatch may indicate:
 * 1. User changed customer org after selecting contacts
 * 2. Intentional cross-org contact (rare but valid)
 * 3. Data entry error
 *
 * @param contactIds - Array of selected contact IDs
 * @param customerOrganizationId - The opportunity's customer organization ID
 * @returns Mismatch detection result with affected contacts
 */
export function useContactOrgMismatch(
  contactIds: Identifier[],
  customerOrganizationId: Identifier | null | undefined
): UseContactOrgMismatchResult {
  // Memoize IDs to prevent unnecessary re-fetches
  const stableIds = useMemo(
    () => contactIds.filter((id): id is Identifier => id != null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(contactIds)]
  );

  // Fetch contact details to check their organization_id
  const { data: contacts, isLoading } = useGetMany<Contact>(
    "contacts",
    { ids: stableIds },
    { enabled: stableIds.length > 0 && customerOrganizationId != null }
  );

  // Detect mismatches
  const result = useMemo(() => {
    if (!contacts || !customerOrganizationId) {
      return {
        mismatchedContacts: [],
        hasMismatch: false,
        isLoading,
      };
    }

    const mismatched: MismatchedContact[] = contacts
      .filter((contact) => {
        // A contact is mismatched if it has an organization_id that differs
        // from the opportunity's customer organization
        const contactOrgId = contact.organization_id;
        return contactOrgId != null && String(contactOrgId) !== String(customerOrganizationId);
      })
      .map((contact) => ({
        contact,
        contactOrgId: contact.organization_id,
      }));

    return {
      mismatchedContacts: mismatched,
      hasMismatch: mismatched.length > 0,
      isLoading,
    };
  }, [contacts, customerOrganizationId, isLoading]);

  return result;
}
