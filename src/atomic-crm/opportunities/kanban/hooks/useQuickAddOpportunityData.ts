import { useGetList } from "react-admin";
import type { Organization } from "@/atomic-crm/types";
import { DEFAULT_PAGE_SIZE } from "@/atomic-crm/constants/appConstants";

/**
 * Hook to fetch organizations for quick-add opportunity form
 * Separates data fetching logic from form state management
 */
export function useQuickAddOpportunityData() {
  // Fetch principal organizations (MFB business rule: every opportunity has a principal)
  const { data: principals, isLoading: principalsLoading } = useGetList<Organization>(
    "organizations",
    {
      pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
      filter: { organization_type: "principal", deleted_at: null },
    }
  );

  // Fetch customer organizations (Salesforce standard: Account required for Opportunity)
  const { data: customers, isLoading: customersLoading } = useGetList<Organization>(
    "organizations",
    {
      pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
      sort: { field: "name", order: "ASC" },
      filter: { "organization_type@in": "(prospect,customer)", deleted_at: null },
    }
  );

  return {
    principals,
    principalsLoading,
    customers,
    customersLoading,
  };
}
