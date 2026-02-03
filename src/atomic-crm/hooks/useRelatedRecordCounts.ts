/**
 * Hook to fetch counts of related records for cascade delete warnings
 *
 * FIX [WF-C06]: Users must see what will be affected before confirming delete
 *
 * Usage:
 * ```tsx
 * const { relatedCounts, isLoading, error } = useRelatedRecordCounts({
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
import { logger } from "@/lib/logger";

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
  /** True if some (but not all) queries failed - UI should show warning */
  hasPartialFailure: boolean;
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
  const [hasPartialFailure, setHasPartialFailure] = useState(false);

  useEffect(() => {
    // Skip if disabled, no IDs, or no relationships defined
    if (!enabled || ids.length === 0) {
      setRelatedCounts([]);
      setHasPartialFailure(false);
      return;
    }

    const relationships = RESOURCE_RELATIONSHIPS[resource];
    if (!relationships || relationships.length === 0) {
      setRelatedCounts([]);
      setHasPartialFailure(false);
      return;
    }

    let cancelled = false;

    const fetchCounts = async () => {
      if (isLoading) return; // Guard against redundant runs during rapid dependency changes
      setIsLoading(true);
      setError(null);
      setHasPartialFailure(false);

      try {
        // Group counts by label (some resources have multiple FK fields)
        const countsByLabel: Record<string, number> = {};

        // Fetch counts in parallel for all relationships and all parent IDs
        // FIX [WF-C06]: Queries run in parallel - failures propagate for fail-fast behavior
        const promises = relationships.flatMap((rel) =>
          ids.map((id) => {
            // Use getManyReference to get count of related records
            return dataProvider
              .getManyReference(rel.resource, {
                target: rel.field,
                id,
                pagination: { page: 1, perPage: 1 }, // Only need count, not data
                sort: { field: "id", order: "ASC" },
                filter: {},
              })
              .then((result) => ({ label: rel.label, count: result.total ?? 0 }));
          })
        );

        // Use Promise.allSettled for extra safety - ensures we get all available results
        // FIX: Fail-fast - if all queries fail, propagate the error instead of silently returning 0
        const settledResults = await Promise.allSettled(promises);

        // Extract fulfilled and rejected results
        const fulfilled = settledResults.filter(
          (r): r is PromiseFulfilledResult<{ label: string; count: number }> =>
            r.status === "fulfilled"
        );
        const rejected = settledResults.filter(
          (r): r is PromiseRejectedResult => r.status === "rejected"
        );

        const results = fulfilled.map((r) => r.value);

        // Log rejected promises with structured error details
        if (rejected.length > 0) {
          const rejectedReasons = rejected.map((r) =>
            r.reason instanceof Error ? r.reason.message : String(r.reason)
          );

          logger.warn("Partial failures detected in related record counts", {
            resource,
            operation: "useRelatedRecordCounts",
            totalQueries: promises.length,
            succeeded: fulfilled.length,
            failed: rejected.length,
            errors: rejectedReasons,
            note: "Showing partial results - some relationship counts may be missing",
          });

          // Set partial failure state for UI warning
          if (!cancelled) {
            setHasPartialFailure(true);
          }
        }

        // Fail-fast: If no queries succeeded, throw to trigger error state
        if (results.length === 0 && promises.length > 0) {
          const rejectedReasons = rejected.map((r) =>
            r.reason instanceof Error ? r.reason.message : String(r.reason)
          );

          throw new Error(
            `Failed to fetch related record counts: ${rejectedReasons[0] || "unknown error"}`
          );
        }

        if (cancelled) return;

        // Aggregate counts by label
        results.forEach(({ label, count }) => {
          countsByLabel[label] = (countsByLabel[label] ?? 0) + count;
        });

        // Convert to array format for dialog
        const counts: RelatedRecordCount[] = Object.entries(countsByLabel)
          .map(([resourceLabel, count]) => ({ resourceLabel, count }))
          .filter((r) => r.count > 0) // Only show non-zero counts
          .toSorted((a, b) => b.count - a.count); // Sort by count descending

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

  return { relatedCounts, isLoading, error, hasPartialFailure };
}

export default useRelatedRecordCounts;
