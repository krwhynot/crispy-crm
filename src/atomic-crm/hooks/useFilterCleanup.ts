import { useEffect, useRef } from "react";
import { useNotify, useStoreContext } from "ra-core";
import { isValidFilterField } from "../providers/supabase/filterRegistry";
import { safeJsonParse } from "../utils/safeJsonParse";
import { devLog } from "@/lib/devLogger";
import { logger } from "@/lib/logger";
import { listParamsSchema } from "../validation/filters";

/**
 * Text-filter fields that use @ilike operator per resource.
 * Used to migrate legacy bare keys (e.g., "name") to @ilike format.
 */
const TEXT_FILTER_FIELDS: Record<string, string[]> = {
  contacts: ["first_name"],
  organizations: ["name"],
  products: ["name"],
  tasks: ["title"],
};

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
function cleanStaleListParams(resource: string): boolean | "corrupted" {
  const key = `RaStoreCRM.${resource}.listParams`;
  const storedParams = localStorage.getItem(key);

  if (!storedParams) {
    return false;
  }

  const params = safeJsonParse(storedParams, listParamsSchema);

  if (!params) {
    logger.debug("Resource has corrupted localStorage, removing and resetting", {
      feature: "useFilterCleanup",
      resource,
    });
    localStorage.removeItem(key);
    return "corrupted";
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
            logger.debug("Found stale filter in localStorage, removing it", {
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

    // Migrate legacy bare text-filter keys to @ilike format.
    // Old localStorage may have bare keys (e.g., "name") for fields that now use
    // TextColumnFilter which writes to "${source}@ilike" keys.
    const textFields = TEXT_FILTER_FIELDS[resource];
    if (textFields && params.filter) {
      for (const field of textFields) {
        const ilikeKey = `${field}@ilike`;
        const bareValue = params.filter[field];
        if (bareValue !== undefined && params.filter[ilikeKey] === undefined) {
          const strValue = typeof bareValue === "string" ? bareValue : String(bareValue);
          // Collapse boundary %s, then wrap once
          const stripped = strValue.replace(/^%+|%+$/g, "").trim();
          if (stripped === "") {
            // Empty value — remove the key entirely (matches TextColumnFilter clear semantics)
            delete params.filter[field];
            modified = true;
          } else {
            params.filter[ilikeKey] = `%${stripped}%`;
            delete params.filter[field];
            modified = true;
          }
        } else if (bareValue !== undefined && params.filter[ilikeKey] !== undefined) {
          // Both exist — keep @ilike (current format), drop bare key
          delete params.filter[field];
          modified = true;
        }
      }
    }

    // Check sort field validity (runs regardless of filter presence).
    // RA stores sort as flat fields: { sort: "field_name", order: "ASC" }
    // See ra-core queryReducer SET_SORT and ListParams interface.
    if (typeof params.sort === "string" && params.sort) {
      const sortField = params.sort;
      if (!isValidFilterField(resource, sortField)) {
        logger.debug("Found stale sort field in localStorage, resetting to default", {
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
  const cleanedRef = useRef<{ resource: string; cleaned: boolean | "corrupted" } | null>(null);
  if (!cleanedRef.current || cleanedRef.current.resource !== resource) {
    const cleaned = cleanStaleListParams(resource);
    cleanedRef.current = { resource, cleaned };
  }

  // Phase 2: Sync RA's in-memory store if localStorage was modified.
  // The store.setItem triggers subscribers and a re-render with corrected values.
  // IMPORTANT: store.setItem() auto-prefixes with "RaStoreCRM.", so pass the
  // unprefixed key (e.g. "sales.listParams" not "RaStoreCRM.sales.listParams").
  useEffect(() => {
    if (cleanedRef.current?.cleaned === "corrupted") {
      // Corrupted localStorage entry was removed in Phase 1 — clear RA's in-memory store
      const storeKey = `${resource}.listParams`;
      store.removeItem(storeKey);
      cleanedRef.current = { resource, cleaned: false };
    } else if (cleanedRef.current?.cleaned) {
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
