/**
 * Generic hook for fetching and caching resource display names
 *
 * This replaces the duplicated logic in useSalesNames, useOrganizationNames, useTagNames
 * with a single, type-safe implementation.
 *
 * @module filters/hooks/useResourceNamesBase
 * @template T - Resource type (must have id field)
 */

import { useEffect, useState, useCallback, useMemo } from "react";
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

  // Create stable key for dependency array
  const idsKey = useMemo(() => ids?.join(",") || "", [ids]);

  useEffect(() => {
    if (!ids || ids.length === 0) {
      return;
    }

    const fetchNames = async () => {
      // Only fetch IDs we don't already have cached
      const idsToFetch = ids.filter((id) => !namesMap[id]);

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

        setNamesMap((prev) => ({ ...prev, ...newMap }));
      } catch (error: unknown) {
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
