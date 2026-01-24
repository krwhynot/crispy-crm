/**
 * Hook to fetch counts of related records for cascade delete warnings
 *
 * FIX [WF-C06]: Users must see what will be affected before confirming delete
 *
 * Usage:
 * ```tsx
 * const { relatedCounts, isLoading } = useRelatedRecordCounts({
 *   resource: 'organizations',
 *   ids: selectedIds,
 *   enabled: showConfirmDialog,
 * });
 * ```
 *
 * @module hooks/useRelatedRecordCounts
 */

import { useEffect, useState } from "react";
import { useDataProvider, type Identifier } from "react-admin";
import type { RelatedRecordCount } from "@/components/ra-wrappers/delete-confirm-dialog";
import { devLog } from "@/lib/devLogger";
import { logger } from "@/lib/logger";

/**
 * Per-query timeout in milliseconds
 *
 * FIX [WF-C06]: Prevents infinite hang when a single getManyReference query stalls.
 * 5 seconds balances user experience with allowing slow queries to complete.
 */
const QUERY_TIMEOUT_MS = 5000;

/**
 * Wrap a promise with a timeout that resolves to a fallback value
 *
 * Uses Promise.race pattern (https://javascript.info/promise-api#promise-race)
 * Instead of rejecting on timeout, resolves with fallback for graceful degradation.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Relationship definitions for cascade counting
 *
 * Maps parent resource → child resources with their FK fields
 */
const RESOURCE_RELATIONSHIPS: Record<string, { resource: string; field: string; label: string }[]> =
  {
    organizations: [
      { resource: "contacts", field: "organization_id", label: "Contacts" },
      {
        resource: "opportunities",
        field: "customer_organization_id",
        label: "Opportunities (Customer)",
      },
      {
        resource: "opportunities",
        field: "principal_organization_id",
        label: "Opportunities (Principal)",
      },
      {
        resource: "opportunities",
        field: "distributor_organization_id",
        label: "Opportunities (Distributor)",
      },
      { resource: "activities", field: "organization_id", label: "Activities" },
      { resource: "organization_notes", field: "organization_id", label: "Notes" },
    ],
    contacts: [
      { resource: "activities", field: "contact_id", label: "Activities" },
      { resource: "tasks", field: "contact_id", label: "Tasks" },
      { resource: "contact_notes", field: "contact_id", label: "Notes" },
      { resource: "opportunity_contacts", field: "contact_id", label: "Opportunity Links" },
    ],
  };

interface UseRelatedRecordCountsParams {
  /** Parent resource type (e.g., 'organizations', 'contacts') */
  resource: string;
  /** Array of parent record IDs being deleted */
  ids: Identifier[];
  /** Only fetch when dialog is open (performance optimization) */
  enabled?: boolean;
}

interface UseRelatedRecordCountsResult {
  /** Array of related record counts for display */
  relatedCounts: RelatedRecordCount[];
  /** Loading state */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Fetch counts of related records for cascade delete warning
 *
 * FIX [WF-C06]: Query getManyReference for each relationship
 * and aggregate counts for display in delete confirmation dialog
 */
export function useRelatedRecordCounts({
  resource,
  ids,
  enabled = true,
}: UseRelatedRecordCountsParams): UseRelatedRecordCountsResult {
  const dataProvider = useDataProvider();
  const [relatedCounts, setRelatedCounts] = useState<RelatedRecordCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if disabled, no IDs, or no relationships defined
    if (!enabled || ids.length === 0) {
      setRelatedCounts([]);
      return;
    }

    const relationships = RESOURCE_RELATIONSHIPS[resource];
    if (!relationships || relationships.length === 0) {
      setRelatedCounts([]);
      return;
    }

    let cancelled = false;

    const fetchCounts = async () => {
      if (isLoading) return; // Guard against redundant runs during rapid dependency changes
      setIsLoading(true);
      setError(null);

      try {
        // Group counts by label (some resources have multiple FK fields)
        const countsByLabel: Record<string, number> = {};

        // Fetch counts in parallel for all relationships and all parent IDs
        // FIX [WF-C06]: Each query wrapped with timeout to prevent infinite hang
        const promises = relationships.flatMap((rel) =>
          ids.map((id) => {
            const queryPromise = (async () => {
              try {
                // Use getManyReference to get count of related records
                const result = await dataProvider.getManyReference(rel.resource, {
                  target: rel.field,
                  id,
                  pagination: { page: 1, perPage: 1 }, // Only need count, not data
                  sort: { field: "id", order: "ASC" },
                  filter: {},
                });
                return { label: rel.label, count: result.total ?? 0 };
              } catch (error: unknown) {
                // EH-001 FIX: Structured logging with error categorization
                const errorMessage = error instanceof Error ? error.message : String(error);
                const isPermissionError =
                  errorMessage.toLowerCase().includes("permission") ||
                  errorMessage.includes("403") ||
                  errorMessage.includes("RLS");

                if (isPermissionError) {
                  // Expected case: user doesn't have access to this resource type
                  devLog(
                    "useRelatedRecordCounts",
                    `Permission denied for ${rel.resource}: ${errorMessage}`
                  );
                } else {
                  // Unexpected error: log as warning for visibility
                  logger.warn("Failed to fetch count for related resource", {
                    feature: "useRelatedRecordCounts",
                    resource: rel.resource,
                    resourceId: String(id),
                    relationship: rel.field,
                    error: errorMessage,
                  });
                }

                return { label: rel.label, count: 0 };
              }
            })();

            // Wrap with timeout - resolves to 0 count on timeout (graceful degradation)
            return withTimeout(queryPromise, QUERY_TIMEOUT_MS, { label: rel.label, count: 0 });
          })
        );

        // Use Promise.allSettled for extra safety - ensures we get all available results
        // even if some promises reject unexpectedly (belt-and-suspenders with try/catch above)
        const settledResults = await Promise.allSettled(promises);
        const results = settledResults
          .filter(
            (r): r is PromiseFulfilledResult<{ label: string; count: number }> =>
              r.status === "fulfilled"
          )
          .map((r) => r.value);

        if (cancelled) return;

        // Aggregate counts by label
        results.forEach(({ label, count }) => {
          countsByLabel[label] = (countsByLabel[label] ?? 0) + count;
        });

        // Convert to array format for dialog
        const counts: RelatedRecordCount[] = Object.entries(countsByLabel)
          .map(([resourceLabel, count]) => ({ resourceLabel, count }))
          .filter((r) => r.count > 0) // Only show non-zero counts
          .sort((a, b) => b.count - a.count); // Sort by count descending

        setRelatedCounts(counts);
      } catch (error: unknown) {
        if (!cancelled) {
          setError(error instanceof Error ? error : new Error("Failed to fetch related counts"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCounts();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dataProvider is referentially unstable but logically stable
  }, [resource, ids, enabled]);

  return { relatedCounts, isLoading, error };
}

export default useRelatedRecordCounts;
