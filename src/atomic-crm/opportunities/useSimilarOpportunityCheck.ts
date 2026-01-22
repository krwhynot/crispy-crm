/**
 * useSimilarOpportunityCheck Hook
 *
 * Manages the state and logic for checking if an opportunity name is similar
 * to existing opportunities using server-side pg_trgm similarity matching.
 *
 * Features:
 * - Server-side similarity check via RPC (check_similar_opportunities)
 * - Async API for integration with form submission handlers
 * - Returns dialog state and handlers for integration with forms
 *
 * Per Engineering Constitution:
 * - P1: Fail-fast - no retry logic or circuit breakers
 * - P2: Uses React Admin's dataProvider.rpc as single entry point for data
 */

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDataProvider } from "ra-core";
import type { ExtendedDataProvider } from "../providers/supabase/extensions/types";
import type { CheckSimilarOpportunitiesResponse } from "../validation/rpc";
import { type SimilarOpportunity, type SimilarityCheckResult } from "../utils/levenshtein";

/**
 * Hook return type
 */
export interface UseSimilarOpportunityCheckResult {
  /** Check if a name has similar opportunities and show dialog if found */
  checkForSimilar: (name: string) => Promise<SimilarityCheckResult>;
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
  /** Whether the RPC call is in progress */
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
  /** Opportunity ID to exclude from check (for edit mode) */
  excludeId?: string | number;
  /** Whether to skip the check entirely */
  disabled?: boolean;
}

/**
 * Map pg_trgm similarity (0-1) to Levenshtein-like distance (1-3)
 * Higher similarity = lower distance
 */
function mapSimilarityToDistance(similarity: number): number {
  if (similarity >= 0.9) return 1;
  if (similarity >= 0.7) return 2;
  return 3;
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
 * const handleSubmit = async (values) => {
 *   const result = await checkForSimilar(values.name);
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
  const { excludeId, disabled = false } = options;

  // State for dialog management
  const [showDialog, setShowDialog] = useState(false);
  const [proposedName, setProposedName] = useState("");
  const [similarOpportunities, setSimilarOpportunities] = useState<SimilarOpportunity[]>([]);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  // Cast to ExtendedDataProvider to access the rpc method with proper typing
  const dataProvider = useDataProvider() as ExtendedDataProvider;

  const { mutateAsync: checkSimilarityRpc, isPending } = useMutation({
    mutationFn: async (name: string): Promise<CheckSimilarOpportunitiesResponse> => {
      return dataProvider.rpc<CheckSimilarOpportunitiesResponse>("check_similar_opportunities", {
        p_name: name,
        p_threshold: 0.3,
        p_exclude_id: excludeId ? Number(excludeId) : null,
        p_limit: 10,
      });
    },
    gcTime: 5 * 60 * 1000, // 5 minute cache
  });

  /**
   * Check if the given name is similar to existing opportunities
   */
  const checkForSimilar = useCallback(
    async (name: string): Promise<SimilarityCheckResult> => {
      // Skip if disabled, already confirmed, or name is empty
      if (disabled || hasConfirmed || !name?.trim()) {
        return { hasSimilar: false, matches: [] };
      }

      const results = await checkSimilarityRpc(name);
      const matches: SimilarOpportunity[] = results.map((r) => ({
        id: r.id,
        name: r.name,
        stage: r.stage,
        distance: mapSimilarityToDistance(r.similarity_score),
        principal_organization_name: r.principal_organization_name ?? undefined,
        customer_organization_name: r.customer_organization_name ?? undefined,
      }));

      if (matches.length > 0) {
        setProposedName(name);
        setSimilarOpportunities(matches);
        setShowDialog(true);
      }

      return { hasSimilar: matches.length > 0, matches };
    },
    [disabled, hasConfirmed, checkSimilarityRpc]
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
    isLoading: isPending,
    hasConfirmed,
    resetConfirmation,
  };
}
