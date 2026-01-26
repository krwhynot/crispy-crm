import { useMemo, useEffect } from "react";
import { useGetList, useGetOne, useNotify } from "react-admin";
import type { UseFormReturn } from "react-hook-form";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";
import { useDebouncedSearch } from "./useDebouncedSearch";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/atomic-crm/constants";

// Cache duration for data queries (5 minutes)
const STALE_TIME_MS = 5 * 60 * 1000;

// Garbage collection time for cached data (15 minutes)
const GC_TIME_MS = 15 * 60 * 1000;

// Minimum characters before server search
const MIN_SEARCH_LENGTH = 2;

// Type definitions for entities
export interface Contact {
  id: number;
  name: string;
  organization_id?: number;
  company_name?: string;
}

export interface Organization {
  id: number;
  name: string;
}

export interface Opportunity {
  id: number;
  name: string;
  customer_organization_id?: number;
  stage: string;
}

interface UseEntityDataOptions {
  form: UseFormReturn<ActivityLogInput>;
  selectedOrganizationId: number | undefined;
  selectedContactId: number | undefined;
  selectedOpportunityId: number | undefined;
}

/**
 * Hook for managing entity data fetching with cascading filters
 *
 * Handles the complex logic of:
 * - Hybrid search (initial load + debounced server search)
 * - Cascading filters (org filters contacts/opps)
 * - Fallback fetches for anchor entities
 * - Auto-fill side effects when opportunity changes
 */
export function useEntityData({
  form,
  selectedOrganizationId,
  selectedContactId,
  selectedOpportunityId,
}: UseEntityDataOptions) {
  const notify = useNotify();

  // Debounced search state for each dropdown
  const contactSearch = useDebouncedSearch();
  const orgSearch = useDebouncedSearch();
  const oppSearch = useDebouncedSearch();

  // Determine if we should do server search (2+ chars typed)
  const shouldSearchContacts = contactSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH;
  const shouldSearchOrgs = orgSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH;
  const shouldSearchOpps = oppSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH;

  // Build contact filter with server-side search
  const contactFilter = useMemo(() => {
    const filter: Record<string, unknown> = {};
    if (selectedOrganizationId) {
      filter.organization_id = selectedOrganizationId;
    }
    if (contactSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH) {
      filter.q = contactSearch.debouncedTerm;
    }
    return filter;
  }, [selectedOrganizationId, contactSearch.debouncedTerm]);

  // Build organization filter with server-side search
  const orgFilter = useMemo(() => {
    const filter: Record<string, unknown> = {};
    if (orgSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH) {
      filter.q = orgSearch.debouncedTerm;
    }
    return filter;
  }, [orgSearch.debouncedTerm]);

  // Build opportunity filter with server-side search
  const oppFilter = useMemo(() => {
    const filter: Record<string, unknown> = {};
    if (selectedOrganizationId) {
      filter.customer_organization_id = selectedOrganizationId;
    }
    if (oppSearch.debouncedTerm.length >= MIN_SEARCH_LENGTH) {
      filter.q = oppSearch.debouncedTerm;
    }
    return filter;
  }, [selectedOrganizationId, oppSearch.debouncedTerm]);

  // Fetch contacts with hybrid approach
  const { data: contacts = [], isPending: contactsLoading } = useGetList<Contact>(
    "contacts",
    {
      pagination: { page: 1, perPage: shouldSearchContacts ? 50 : INITIAL_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
      filter: contactFilter,
    },
    {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      placeholderData: (prev) => prev,
    }
  );

  // Fetch organizations with hybrid approach
  const { data: organizations = [], isPending: organizationsLoading } = useGetList<Organization>(
    "organizations",
    {
      pagination: { page: 1, perPage: shouldSearchOrgs ? 50 : INITIAL_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
      filter: orgFilter,
    },
    {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      placeholderData: (prev) => prev,
    }
  );

  // Fetch opportunities with hybrid approach
  const { data: opportunities = [], isPending: opportunitiesLoading } = useGetList<Opportunity>(
    "opportunities",
    {
      pagination: { page: 1, perPage: shouldSearchOpps ? 50 : INITIAL_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
      filter: oppFilter,
    },
    {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      placeholderData: (prev) => prev,
    }
  );

  // Overall loading state (initial load only)
  const isInitialLoading =
    contactsLoading &&
    organizationsLoading &&
    opportunitiesLoading &&
    contacts.length === 0 &&
    organizations.length === 0 &&
    opportunities.length === 0;

  // Derived state for selected entities
  const selectedOpportunity = useMemo(
    () => opportunities.find((o) => o.id === selectedOpportunityId),
    [opportunities, selectedOpportunityId]
  );

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId),
    [contacts, selectedContactId]
  );

  // Determine the "anchor" organization - from organization, contact, or opportunity selection
  const anchorOrganizationId = useMemo(() => {
    if (selectedOrganizationId) {
      return selectedOrganizationId;
    }
    if (selectedContact?.organization_id) {
      return selectedContact.organization_id;
    }
    if (selectedOpportunity?.customer_organization_id) {
      return selectedOpportunity.customer_organization_id;
    }
    return null;
  }, [
    selectedOrganizationId,
    selectedContact?.organization_id,
    selectedOpportunity?.customer_organization_id,
  ]);

  // Check if anchor org is missing from the fetched organizations list
  const anchorOrgMissing = useMemo(() => {
    if (!anchorOrganizationId) return false;
    return !organizations.some((o) => o.id === anchorOrganizationId);
  }, [anchorOrganizationId, organizations]);

  // Fetch the specific anchor organization if it's not in the paginated list
  const { data: fetchedAnchorOrg } = useGetOne<Organization>(
    "organizations",
    { id: anchorOrganizationId! },
    {
      enabled: anchorOrgMissing && anchorOrganizationId !== null,
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
    }
  );

  // Check if we need to fetch contacts for the anchor org
  const contactsForAnchorOrgMissing = useMemo(() => {
    if (!anchorOrganizationId) return false;
    return !contacts.some((c) => c.organization_id === anchorOrganizationId);
  }, [anchorOrganizationId, contacts]);

  // Fetch contacts specifically for the anchor organization
  const { data: contactsForAnchorOrg = [] } = useGetList<Contact>(
    "contacts",
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: "name", order: "ASC" },
      filter: { organization_id: anchorOrganizationId },
    },
    {
      enabled: contactsForAnchorOrgMissing && anchorOrganizationId !== null,
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
    }
  );

  // Check if we need to fetch opportunities for the anchor org
  const oppsForAnchorOrgMissing = useMemo(() => {
    if (!anchorOrganizationId) return false;
    return !opportunities.some((o) => o.customer_organization_id === anchorOrganizationId);
  }, [anchorOrganizationId, opportunities]);

  // Fetch opportunities specifically for the anchor organization
  const { data: oppsForAnchorOrg = [] } = useGetList<Opportunity>(
    "opportunities",
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: "name", order: "ASC" },
      filter: { customer_organization_id: anchorOrganizationId },
    },
    {
      enabled: oppsForAnchorOrgMissing && anchorOrganizationId !== null,
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
    }
  );

  // Filter contacts by anchor organization AND search term
  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (anchorOrganizationId) {
      const filtered = contacts.filter((c) => c.organization_id === anchorOrganizationId);
      result =
        filtered.length === 0 && contactsForAnchorOrg.length > 0 ? contactsForAnchorOrg : filtered;
    }

    if (contactSearch.debouncedTerm.length > 0) {
      const searchLower = contactSearch.debouncedTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.company_name?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [contacts, anchorOrganizationId, contactsForAnchorOrg, contactSearch.debouncedTerm]);

  // Filter organizations by anchor organization AND search term
  const filteredOrganizations = useMemo(() => {
    let result = organizations;

    if (anchorOrganizationId && orgSearch.debouncedTerm.length === 0) {
      const filtered = organizations.filter((o) => o.id === anchorOrganizationId);
      result = filtered.length === 0 && fetchedAnchorOrg ? [fetchedAnchorOrg] : filtered;
    }

    if (orgSearch.debouncedTerm.length > 0) {
      const searchLower = orgSearch.debouncedTerm.toLowerCase();
      result = result.filter((o) => o.name.toLowerCase().includes(searchLower));
    }

    return result;
  }, [organizations, anchorOrganizationId, fetchedAnchorOrg, orgSearch.debouncedTerm]);

  // Filter opportunities by anchor organization AND search term
  const filteredOpportunities = useMemo(() => {
    let result = opportunities;

    if (anchorOrganizationId) {
      const filtered = opportunities.filter(
        (o) => o.customer_organization_id === anchorOrganizationId
      );
      result = filtered.length === 0 && oppsForAnchorOrg.length > 0 ? oppsForAnchorOrg : filtered;
    }

    if (oppSearch.debouncedTerm.length > 0) {
      const searchLower = oppSearch.debouncedTerm.toLowerCase();
      result = result.filter((o) => o.name.toLowerCase().includes(searchLower));
    }

    return result;
  }, [opportunities, anchorOrganizationId, oppsForAnchorOrg, oppSearch.debouncedTerm]);

  // Side effect: Auto-fill organization from opportunity
  useEffect(() => {
    if (selectedOpportunity?.customer_organization_id) {
      form.setValue("organizationId", selectedOpportunity.customer_organization_id);

      const currentContactId = form.getValues("contactId");
      if (currentContactId) {
        const contact = contacts.find((c) => c.id === currentContactId);
        if (contact && contact.organization_id !== selectedOpportunity.customer_organization_id) {
          form.setValue("contactId", undefined);
          notify("Contact cleared: doesn't belong to selected opportunity's organization", {
            type: "info",
          });
        }
      }
    }
  }, [selectedOpportunity?.customer_organization_id, contacts, form, notify]);

  return {
    // Raw data
    contacts,
    organizations,
    opportunities,
    contactsForAnchorOrg,
    oppsForAnchorOrg,

    // Filtered data
    filteredContacts,
    filteredOrganizations,
    filteredOpportunities,

    // Loading states
    contactsLoading,
    organizationsLoading,
    opportunitiesLoading,
    isInitialLoading,

    // Search controls
    contactSearch,
    orgSearch,
    oppSearch,

    // Derived state
    anchorOrganizationId,
  };
}
