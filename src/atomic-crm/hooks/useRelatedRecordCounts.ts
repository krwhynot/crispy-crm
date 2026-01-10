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
import type { RelatedRecordCount } from "@/components/admin/delete-confirm-dialog";

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
      setIsLoading(true);
      setError(null);

      try {
        // Group counts by label (some resources have multiple FK fields)
        const countsByLabel: Record<string, number> = {};

        // Fetch counts in parallel for all relationships and all parent IDs
        const promises = relationships.flatMap((rel) =>
          ids.map(async (id) => {
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
              // Silently skip on error (e.g., permission denied)
              console.debug(
                "Failed to fetch related count:",
                error instanceof Error ? error.message : String(error)
              );
              return { label: rel.label, count: 0 };
            }
          })
        );

        const results = await Promise.all(promises);

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
  }, [resource, ids, enabled, dataProvider]);

  return { relatedCounts, isLoading, error };
}

export default useRelatedRecordCounts;
