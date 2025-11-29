/**
 * useSimilarOpportunityCheck Hook
 *
 * Manages the state and logic for checking if an opportunity name is similar
 * to existing opportunities using Levenshtein distance algorithm.
 *
 * Features:
 * - Debounced checking to avoid excessive API calls
 * - Caches opportunity list with React Query
 * - Returns dialog state and handlers for integration with forms
 *
 * Per Engineering Constitution:
 * - P1: Fail-fast - no retry logic or circuit breakers
 * - P2: Uses React Admin's useGetList as single entry point for data
 */

import { useState, useCallback, useMemo } from "react";
import { useGetList } from "ra-core";
import {
  findSimilarOpportunities,
  type SimilarOpportunity,
  type SimilarityCheckResult,
} from "../../utils/levenshtein";

/** Default Levenshtein distance threshold for similarity detection */
const DEFAULT_THRESHOLD = 3;

/**
 * Opportunity record shape expected from the API
 */
interface OpportunityRecord {
  id: string | number;
  name: string;
  stage: string;
  customer_organization_id?: string | number;
  principal_organization_id?: string | number;
  deleted_at?: string | null;
}

/**
 * Extended opportunity with organization names for display
 */
interface OpportunityWithOrgs extends OpportunityRecord {
  customer_organization_name?: string;
  principal_organization_name?: string;
}

/**
 * Hook return type
 */
export interface UseSimilarOpportunityCheckResult {
  /** Check if a name has similar opportunities and show dialog if found */
  checkForSimilar: (name: string) => SimilarityCheckResult;
  /** Whether the dialog should be shown */
  showDialog: boolean;
  /** Close the dialog (user clicked "Go Back") */
  closeDialog: () => void;
  /** Confirm creation despite warning (user clicked "Create Anyway") */
  confirmCreate: () => void;
  /** The proposed name that was checked */
  proposedName: string;
  /** List of similar opportunities found */
  similarOpportunities: SimilarOpportunity[];
  /** Whether the initial opportunity list is loading */
  isLoading: boolean;
  /** Whether the user has confirmed to proceed despite warning */
  hasConfirmed: boolean;
  /** Reset the confirmation state (e.g., when form values change) */
  resetConfirmation: () => void;
}

/**
 * Hook options
 */
export interface UseSimilarOpportunityCheckOptions {
  /** Levenshtein distance threshold (default: 3) */
  threshold?: number;
  /** Opportunity ID to exclude from check (for edit mode) */
  excludeId?: string | number;
  /** Whether to skip the check entirely */
  disabled?: boolean;
}

/**
 * Custom hook for checking opportunity name similarity
 *
 * @example
 * ```tsx
 * const {
 *   checkForSimilar,
 *   showDialog,
 *   closeDialog,
 *   confirmCreate,
 *   proposedName,
 *   similarOpportunities,
 *   hasConfirmed,
 * } = useSimilarOpportunityCheck();
 *
 * const handleSubmit = (values) => {
 *   const result = checkForSimilar(values.name);
 *   if (result.hasSimilar && !hasConfirmed) {
 *     return; // Dialog will be shown
 *   }
 *   // Proceed with creation
 * };
 * ```
 */
export function useSimilarOpportunityCheck(
  options: UseSimilarOpportunityCheckOptions = {}
): UseSimilarOpportunityCheckResult {
  const { threshold = DEFAULT_THRESHOLD, excludeId, disabled = false } = options;

  // State for dialog management
  const [showDialog, setShowDialog] = useState(false);
  const [proposedName, setProposedName] = useState("");
  const [similarOpportunities, setSimilarOpportunities] = useState<SimilarOpportunity[]>([]);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  // Fetch all active opportunities for comparison
  // Using a large perPage to get all opportunities for client-side comparison
  // In production with many opportunities, consider a server-side endpoint
  const { data: opportunities = [], isLoading } = useGetList<OpportunityWithOrgs>(
    "opportunities",
    {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "name", order: "ASC" },
      filter: {
        // Exclude soft-deleted and closed opportunities
        "deleted_at@is": null,
        // Only check against active opportunities
        "stage@not_in": ["closed_won", "closed_lost"],
      },
    },
    {
      enabled: !disabled,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  // Memoize the opportunity list for comparison
  const opportunityList = useMemo(() => {
    return opportunities.map((opp) => ({
      id: opp.id,
      name: opp.name,
      stage: opp.stage,
      customer_organization_name: opp.customer_organization_name,
      principal_organization_name: opp.principal_organization_name,
    }));
  }, [opportunities]);

  /**
   * Check if the given name is similar to existing opportunities
   */
  const checkForSimilar = useCallback(
    (name: string): SimilarityCheckResult => {
      // Skip if disabled, already confirmed, or name is empty
      if (disabled || hasConfirmed || !name || name.trim().length === 0) {
        return { hasSimilar: false, matches: [] };
      }

      const result = findSimilarOpportunities(opportunityList, {
        name,
        threshold,
        excludeId,
      });

      if (result.hasSimilar) {
        setProposedName(name);
        setSimilarOpportunities(result.matches);
        setShowDialog(true);
      }

      return result;
    },
    [disabled, hasConfirmed, opportunityList, threshold, excludeId]
  );

  /**
   * Close the dialog without confirming (Go Back)
   */
  const closeDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  /**
   * Confirm creation despite warning (Create Anyway)
   */
  const confirmCreate = useCallback(() => {
    setHasConfirmed(true);
    setShowDialog(false);
  }, []);

  /**
   * Reset the confirmation state (call when form values change significantly)
   */
  const resetConfirmation = useCallback(() => {
    setHasConfirmed(false);
    setSimilarOpportunities([]);
    setProposedName("");
  }, []);

  return {
    checkForSimilar,
    showDialog,
    closeDialog,
    confirmCreate,
    proposedName,
    similarOpportunities,
    isLoading,
    hasConfirmed,
    resetConfirmation,
  };
}
