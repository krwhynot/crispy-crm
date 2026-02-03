/**
 * Generic hook for fetching and caching resource display names
 *
 * This replaces the duplicated logic in useSalesNames, useOrganizationNames, useTagNames
 * with a single, type-safe implementation.
 *
 * @module filters/hooks/useResourceNamesBase
 * @template T - Resource type (must have id field)
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useDataProvider } from "ra-core";
import type {
  ResourceWithId,
  FetchedResource,
  DisplayNameExtractor,
  ResourceNamesResult,
} from "../types/resourceTypes";
import { logger } from "@/lib/logger";

/**
 * Base hook for resource name lookups with full type safety
 *
 * @param resourceName - React Admin resource name (e.g., "sales", "organizations")
 * @param ids - Array of IDs to fetch names for
 * @param getDisplayName - Type-safe function to extract display name from resource
 * @param fallbackPrefix - Prefix for fallback names (e.g., "Sales" → "Sales #123")
 * @returns ResourceNamesResult with namesMap, getName function, and loading state
 *
 * @example
 * ```typescript
 * // Type-safe usage - compiler catches errors like s.firs_name
 * const result = useResourceNamesBase<Sales>(
 *   "sales",
 *   salesIds,
 *   (s) => `${s.first_name} ${s.last_name}`,
 *   "Sales"
 * );
 * ```
 */
export function useResourceNamesBase<T extends ResourceWithId>(
  resourceName: string,
  ids: string[] | undefined,
  getDisplayName: DisplayNameExtractor<T>,
  fallbackPrefix: string
): ResourceNamesResult {
  const dataProvider = useDataProvider();
  const [namesMap, setNamesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Track IDs that returned no results to avoid infinite retry loops.
  // When getMany returns empty data for certain IDs, the old code would
  // call setNamesMap(prev => ({...prev})) creating a new reference,
  // which re-triggered the effect, causing an infinite loop.
  const failedIdsRef = useRef<Set<string>>(new Set());

  // Create stable key for dependency array
  const idsKey = useMemo(() => ids?.join(",") || "", [ids]);

  useEffect(() => {
    if (!ids || ids.length === 0) {
      return;
    }

    const fetchNames = async () => {
      // Only fetch IDs we don't already have cached or previously failed
      const idsToFetch = ids.filter((id) => !namesMap[id] && !failedIdsRef.current.has(id));

      if (idsToFetch.length === 0) {
        return;
      }

      setLoading(true);
      try {
        // dataProvider.getMany returns records that always have id
        const { data } = await dataProvider.getMany<FetchedResource<T>>(resourceName, {
          ids: idsToFetch,
        });

        // Type-safe reduce - FetchedResource<T> is known, no `any` needed
        const newMap = data.reduce<Record<string, string>>((acc, item) => {
          acc[String(item.id)] = getDisplayName(item);
          return acc;
        }, {});

        // Track IDs that were not returned by getMany
        const resolvedIds = new Set(data.map((item) => String(item.id)));
        for (const id of idsToFetch) {
          if (!resolvedIds.has(id)) {
            failedIdsRef.current.add(id);
          }
        }

        // Only update state if we actually got new names.
        // Skipping no-op updates prevents creating a new namesMap reference
        // that would re-trigger this effect (infinite loop).
        if (Object.keys(newMap).length > 0) {
          setNamesMap((prev) => ({ ...prev, ...newMap }));
        }
      } catch (error: unknown) {
        // Mark all attempted IDs as failed on error to prevent retry loops
        for (const id of idsToFetch) {
          failedIdsRef.current.add(id);
        }
        logger.error("Failed to fetch resource names", error, {
          feature: "useResourceNamesBase",
          resource: resourceName,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNames();
  }, [idsKey, ids, namesMap, dataProvider, resourceName, getDisplayName]);

  /**
   * Get display name by ID with fallback
   */
  const getName = useCallback(
    (id: string): string => {
      return namesMap[id] || `${fallbackPrefix} #${id}`;
    },
    [namesMap, fallbackPrefix]
  );

  return {
    namesMap,
    getName,
    loading,
  };
}
