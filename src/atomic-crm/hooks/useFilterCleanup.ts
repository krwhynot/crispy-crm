import { useEffect, useRef } from "react";
import { useNotify, useStoreContext } from "ra-core";
import { isValidFilterField } from "../providers/supabase/filterRegistry";
import { safeJsonParse } from "../utils/safeJsonParse";
import { devLog } from "@/lib/devLogger";
import { logger } from "@/lib/logger";
import { listParamsSchema } from "../validation/filters";

/**
 * Default sort fields for each resource when stale sort is detected
 * Falls back to "id" if resource not in map
 */
const DEFAULT_SORT_FIELDS: Record<string, string> = {
  contacts: "last_seen",
  organizations: "name",
  opportunities: "created_at",
  activities: "activity_date",
  tasks: "due_date",
  sales: "first_name",
  tags: "name",
};

/**
 * Synchronously clean stale filters and sort from localStorage.
 *
 * This runs outside useEffect so that RA's useListParams reads clean
 * values on the very first render — preventing PostgREST 400 errors
 * and SortButton crashes from stale column names.
 *
 * Returns true if localStorage was modified (callers may want to
 * sync RA's in-memory store via store.setItem in an effect).
 */
function cleanStaleListParams(resource: string): boolean {
  const key = `RaStoreCRM.${resource}.listParams`;
  const storedParams = localStorage.getItem(key);

  if (!storedParams) {
    return false;
  }

  const params = safeJsonParse(storedParams, listParamsSchema);

  if (!params) {
    logger.warn("Resource has corrupted localStorage, skipping cleanup", {
      feature: "useFilterCleanup",
      resource,
    });
    return false;
  }

  try {
    let modified = false;

    // Clean stale filter fields
    if (params.filter) {
      const cleanedFilter: Record<string, unknown> = {};
      for (const filterKey in params.filter) {
        if (Object.prototype.hasOwnProperty.call(params.filter, filterKey)) {
          if (isValidFilterField(resource, filterKey)) {
            cleanedFilter[filterKey] = params.filter[filterKey];
          } else {
            logger.warn("Found stale filter in localStorage, removing it", {
              feature: "useFilterCleanup",
              resource,
              filterKey,
              reason: "Field no longer exists in database schema",
            });
            modified = true;
          }
        }
      }
      if (modified) {
        params.filter = cleanedFilter;
      }
    }

    // Check sort field validity (runs regardless of filter presence).
    // RA stores sort as flat fields: { sort: "field_name", order: "ASC" }
    // See ra-core queryReducer SET_SORT and ListParams interface.
    if (typeof params.sort === "string" && params.sort) {
      const sortField = params.sort;
      if (!isValidFilterField(resource, sortField)) {
        logger.warn("Found stale sort field in localStorage, resetting to default", {
          feature: "useFilterCleanup",
          resource,
          sortField,
          reason: "Field no longer exists in database schema",
        });
        params.sort = DEFAULT_SORT_FIELDS[resource] || "id";
        params.order = params.order || "DESC";
        modified = true;
      }
    }

    if (modified) {
      localStorage.setItem(key, JSON.stringify(params));
      devLog(
        "useFilterCleanup",
        `Cleaned stale filters/sort for resource "${resource}". localStorage updated.`
      );
    }

    return modified;
  } catch (error: unknown) {
    logger.error("Error parsing localStorage for resource", error, {
      feature: "useFilterCleanup",
      resource,
    });
    return false;
  }
}

/**
 * useFilterCleanup Hook - Client-side Filter & Sort Validation
 *
 * Proactively cleans stale cached filters AND sorts from localStorage and React Admin's
 * internal store for a given resource. This prevents UI inconsistencies and
 * ensures that filters and sorts are always valid.
 *
 * Cleanup runs in two phases:
 * 1. **Synchronous** (during render): fixes localStorage before RA reads it,
 *    preventing PostgREST 400 errors from stale column names on the first render.
 * 2. **Effect** (post-render): syncs RA's in-memory store so subsequent renders
 *    pick up the cleaned values, and notifies the user if state was corrupted.
 *
 * This hook complements the dataProvider-level validation (which prevents API errors)
 * by maintaining clean localStorage state across page loads and navigation.
 *
 * Usage:
 * ```typescript
 * export const ContactList = () => {
 *   useFilterCleanup('contacts');
 *   // ... rest of component
 * };
 * ```
 *
 * @param resource The React Admin resource name (e.g., 'contacts', 'organizations')
 */
export const useFilterCleanup = (resource: string) => {
  const store = useStoreContext();
  const notify = useNotify();

  // Phase 1: Synchronous localStorage cleanup before first render.
  // This ensures RA's useListParams reads valid values during render.
  const cleanedRef = useRef<{ resource: string; cleaned: boolean } | null>(null);
  if (!cleanedRef.current || cleanedRef.current.resource !== resource) {
    const cleaned = cleanStaleListParams(resource);
    cleanedRef.current = { resource, cleaned };
  }

  // Phase 2: Sync RA's in-memory store if localStorage was modified.
  // The store.setItem triggers subscribers and a re-render with corrected values.
  // IMPORTANT: store.setItem() auto-prefixes with "RaStoreCRM.", so pass the
  // unprefixed key (e.g. "sales.listParams" not "RaStoreCRM.sales.listParams").
  useEffect(() => {
    if (cleanedRef.current?.cleaned) {
      const localStorageKey = `RaStoreCRM.${resource}.listParams`;
      const storeKey = `${resource}.listParams`;
      const storedParams = localStorage.getItem(localStorageKey);
      if (storedParams) {
        const params = safeJsonParse(storedParams, listParamsSchema);
        if (params) {
          store.setItem(storeKey, params);
        }
      }
      cleanedRef.current = { resource, cleaned: false };
    }
  }, [resource, store, notify]);
};
