import { useMemo } from "react";
import { useGetList, useGetOne } from "react-admin";
import type { Identifier, RaRecord } from "ra-core";
import type { Organization } from "../../types";

/**
 * Distributor-Principal Authorization Record
 * Tracks which principals are authorized to sell through which distributors
 */
export interface DistributorPrincipalAuthorization extends RaRecord {
  id: Identifier;
  distributor_id: Identifier;
  principal_id: Identifier;
  is_authorized: boolean;
  authorization_date?: string;
  expiration_date?: string;
  territory_restrictions?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Hook result for distributor-principal authorization check
 */
export interface UseDistributorAuthorizationResult {
  /** Whether the distributor is authorized to sell the principal's products */
  isAuthorized: boolean;
  /** Whether an authorization record exists (even if expired) */
  hasAuthorizationRecord: boolean;
  /** Whether the authorization has expired */
  isExpired: boolean;
  /** The authorization record if found */
  authorization: DistributorPrincipalAuthorization | null;
  /** Whether we have both principal and distributor selected */
  hasBothSelected: boolean;
  /** Whether the authorization check is loading */
  isLoading: boolean;
  /** Distributor organization name (for display) */
  distributorName: string | undefined;
  /** Principal organization name (for display) */
  principalName: string | undefined;
}

/**
 * Hook to check if a distributor is authorized to sell a principal's products.
 *
 * This is a data quality check for the MFB three-party business model:
 * - Principal = Food manufacturer whose products MFB represents
 * - Distributor = Company that buys from principals and distributes (e.g., Sysco, USF)
 * - Not all distributors carry all principals' products
 *
 * A missing or expired authorization may indicate:
 * 1. User should select a different distributor
 * 2. New authorization relationship needs to be established
 * 3. Data entry error
 * 4. Legitimate case where authorization is being pursued
 *
 * @param principalId - The selected principal organization ID
 * @param distributorId - The selected distributor organization ID
 * @returns Authorization check result with status and organization details
 */
export function useDistributorAuthorization(
  principalId: Identifier | null | undefined,
  distributorId: Identifier | null | undefined
): UseDistributorAuthorizationResult {
  // Determine if we have both IDs to check
  const hasBothSelected = principalId != null && distributorId != null;

  // Fetch authorization record for this principal-distributor pair
  const { data: authorizations, isLoading: isLoadingAuth } =
    useGetList<DistributorPrincipalAuthorization>(
      "distributor_principal_authorizations",
      {
        filter: {
          principal_id: principalId,
          distributor_id: distributorId,
          deleted_at: null, // Only active records
        },
        pagination: { page: 1, perPage: 1 },
      },
      { enabled: hasBothSelected }
    );

  // Fetch distributor name for display
  const { data: distributor, isLoading: isLoadingDistributor } = useGetOne<Organization>(
    "organizations",
    { id: distributorId! },
    { enabled: distributorId != null }
  );

  // Fetch principal name for display
  const { data: principal, isLoading: isLoadingPrincipal } = useGetOne<Organization>(
    "organizations",
    { id: principalId! },
    { enabled: principalId != null }
  );

  // Compute authorization status
  const result = useMemo((): UseDistributorAuthorizationResult => {
    // If we don't have both selections, return early
    if (!hasBothSelected) {
      return {
        isAuthorized: true, // Don't show warning if not both selected
        hasAuthorizationRecord: false,
        isExpired: false,
        authorization: null,
        hasBothSelected: false,
        isLoading: false,
        distributorName: distributor?.name,
        principalName: principal?.name,
      };
    }

    const isLoading = isLoadingAuth || isLoadingDistributor || isLoadingPrincipal;

    // Get the authorization record (if any)
    const authorization = authorizations?.[0] ?? null;
    const hasAuthorizationRecord = authorization != null;

    // Check if expired
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const isExpired =
      hasAuthorizationRecord &&
      authorization.expiration_date != null &&
      authorization.expiration_date < today;

    // Determine if authorized:
    // - Must have a record
    // - Record must have is_authorized = true
    // - Must not be expired
    const isAuthorized = hasAuthorizationRecord && authorization.is_authorized && !isExpired;

    return {
      isAuthorized,
      hasAuthorizationRecord,
      isExpired,
      authorization,
      hasBothSelected,
      isLoading,
      distributorName: distributor?.name,
      principalName: principal?.name,
    };
  }, [
    authorizations,
    distributor?.name,
    principal?.name,
    hasBothSelected,
    isLoadingAuth,
    isLoadingDistributor,
    isLoadingPrincipal,
  ]);

  return result;
}
