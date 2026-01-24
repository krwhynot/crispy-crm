import { useEffect } from "react";
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
 * useFilterCleanup Hook - Client-side Filter & Sort Validation
 *
 * Proactively cleans stale cached filters AND sorts from localStorage and React Admin's
 * internal store for a given resource. This prevents UI inconsistencies and
 * ensures that filters and sorts are always valid.
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
 *
 * Note: This hook runs on component mount and whenever the resource changes.
 * It modifies both localStorage and the React Admin store to trigger a re-render
 * if invalid filters or sorts are detected and removed.
 */
export const useFilterCleanup = (resource: string) => {
  const store = useStoreContext();
  const notify = useNotify();

  useEffect(() => {
    // IMPORTANT: Key must match the store name initialized in CRM.tsx (line 123)
    // where React Admin store is configured with storeName="CRM", resulting in
    // localStorage keys like "RaStoreCRM.{resource}.listParams"
    const key = `RaStoreCRM.${resource}.listParams`;
    const storedParams = localStorage.getItem(key);

    if (!storedParams) {
      return; // No stored params, nothing to clean
    }

    const params = safeJsonParse(storedParams, listParamsSchema);

    if (!params) {
      logger.warn("Resource has corrupted localStorage, skipping cleanup", {
        feature: "useFilterCleanup",
        resource,
      });
      return;
    }

    try {
      if (!params?.filter) {
        return; // No filters, nothing to clean
      }

      const cleanedFilter: Record<string, any> = {};
      let modified = false;

      // Iterate through all filter keys and validate each one
      for (const filterKey in params.filter) {
        if (Object.prototype.hasOwnProperty.call(params.filter, filterKey)) {
          if (isValidFilterField(resource, filterKey)) {
            // Valid filter - keep it
            cleanedFilter[filterKey] = params.filter[filterKey];
          } else {
            // Invalid filter - log and remove
            console.warn(
              `[useFilterCleanup] Resource "${resource}" found stale filter "${filterKey}" in localStorage. ` +
                `This field no longer exists in the database schema. Removing it.`
            );
            modified = true;
          }
        }
      }

      // Check sort field validity
      // Sort fields should be valid filterable fields (they're columns in the DB)
      if (params.sort?.field) {
        const sortField = params.sort.field;
        if (!isValidFilterField(resource, sortField)) {
          console.warn(
            `[useFilterCleanup] Resource "${resource}" found stale sort field "${sortField}" in localStorage. ` +
              `This field no longer exists in the database schema. Resetting to default.`
          );
          params.sort = {
            field: DEFAULT_SORT_FIELDS[resource] || "id",
            order: params.sort.order || "DESC",
          };
          modified = true;
        }
      }

      // Only update if we actually removed something
      if (modified) {
        params.filter = cleanedFilter;
        localStorage.setItem(key, JSON.stringify(params));
        store.setItem(key, params);

        devLog(
          "useFilterCleanup",
          `Cleaned stale filters/sort for resource "${resource}". localStorage and React Admin store updated.`
        );
      }
    } catch (error: unknown) {
      console.error(
        `[useFilterCleanup] Error parsing localStorage for resource "${resource}":`,
        error
      );
      notify(`Filter state for ${resource} was corrupted and has been reset.`, {
        type: "warning",
      });
    }
  }, [resource, store, notify]);
};
