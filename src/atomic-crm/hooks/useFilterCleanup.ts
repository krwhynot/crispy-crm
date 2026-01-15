import { useEffect } from "react";
import { useNotify, useStore } from "ra-core";
import { z } from "zod";
import { isValidFilterField } from "../providers/supabase/filterRegistry";
import { safeJsonParse } from "../utils/safeJsonParse";
import { devLog } from "@/lib/devLogger";

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
 * Schema for React Admin list params stored in localStorage.
 * Defense-in-depth validation for cached URL parameters.
 */
const listParamsSchema = z
  .object({
    filter: z.record(z.string(), z.unknown()).optional(),
    sort: z
      .object({
        field: z.string().max(100),
        order: z.enum(["ASC", "DESC"]),
      })
      .optional(),
    page: z.number().int().positive().optional(),
    perPage: z.number().int().positive().max(1000).optional(),
    displayedFilters: z.record(z.string(), z.boolean()).optional(),
  })
  .passthrough(); // React Admin may add fields

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
  const [, storeApi] = useStore();
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
      console.warn(
        `[useFilterCleanup] Resource "${resource}" has corrupted localStorage. Skipping cleanup.`
      );
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
        storeApi.setItem(key, params);

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
  }, [resource, storeApi, notify]);
};
