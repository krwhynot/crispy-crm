import { useMemo } from "react";
import { useGetList } from "react-admin";
import type { Identifier, RaRecord } from "ra-core";

/**
 * Organization-Distributor relationship record from junction table
 * Tracks which distributors serve which customer organizations
 */
export interface OrganizationDistributorRecord extends RaRecord {
  id: Identifier;
  organization_id: Identifier;
  distributor_id: Identifier;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Hook result for customer distributor relationships
 */
export interface UseCustomerDistributorsResult {
  /** IDs of distributors that serve this customer */
  distributorIds: Identifier[];
  /** The primary distributor ID if one is marked as primary */
  primaryDistributorId: Identifier | null;
  /** Whether we have a customer selected to check */
  hasCustomerSelected: boolean;
  /** Whether relationships exist for this customer */
  hasRelationships: boolean;
  /** Whether the data is still loading */
  isLoading: boolean;
  /** Error if the query failed */
  error: Error | null;
  /** Raw relationship records (for advanced use cases) */
  relationships: OrganizationDistributorRecord[];
}

/**
 * Hook to fetch distributors that have existing relationships with a customer.
 *
 * This supports the MFB three-party business model:
 * - Customer (Operator) = Restaurant that buys from distributors
 * - Distributor = Company that delivers products (e.g., Sysco, US Foods, GFS)
 * - Each customer may work with multiple distributors
 * - One distributor per customer is marked as "primary"
 *
 * Use Cases:
 * 1. Wizard: Pre-populate distributor suggestions based on customer selection
 * 2. Auto-select: Default to primary distributor when creating opportunities
 * 3. Validation: Highlight when user picks a non-related distributor
 *
 * @param customerId - The selected customer organization ID
 * @returns Distributor relationships for this customer
 */
export function useCustomerDistributors(
  customerId: Identifier | null | undefined
): UseCustomerDistributorsResult {
  // Determine if we have a customer to check
  const hasCustomerSelected = customerId != null;

  // Fetch distributor relationships for this customer
  const {
    data: relationships,
    isLoading,
    error,
  } = useGetList<OrganizationDistributorRecord>(
    "organization_distributors",
    {
      filter: {
        organization_id: customerId,
        deleted_at: null, // Only active relationships
      },
      pagination: { page: 1, perPage: 100 }, // Unlikely to have >100 distributors per customer
      sort: { field: "is_primary", order: "DESC" }, // Primary first
    },
    { enabled: hasCustomerSelected }
  );

  // Compute derived values
  const result = useMemo((): UseCustomerDistributorsResult => {
    // Early return if no customer selected
    if (!hasCustomerSelected) {
      return {
        distributorIds: [],
        primaryDistributorId: null,
        hasCustomerSelected: false,
        hasRelationships: false,
        isLoading: false,
        error: null,
        relationships: [],
      };
    }

    const relationshipRecords = relationships ?? [];
    const distributorIds = relationshipRecords.map((r) => r.distributor_id);
    const primaryRecord = relationshipRecords.find((r) => r.is_primary);
    const primaryDistributorId = primaryRecord?.distributor_id ?? null;

    return {
      distributorIds,
      primaryDistributorId,
      hasCustomerSelected: true,
      hasRelationships: distributorIds.length > 0,
      isLoading,
      error: error ?? null,
      relationships: relationshipRecords,
    };
  }, [hasCustomerSelected, relationships, isLoading, error]);

  return result;
}
