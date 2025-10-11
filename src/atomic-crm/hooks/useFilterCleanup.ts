import { useEffect } from 'react';
import { useStore } from 'ra-core';
import { isValidFilterField } from '../providers/supabase/filterRegistry';

/**
 * useFilterCleanup Hook - Client-side Filter Validation
 *
 * Proactively cleans stale cached filters from localStorage and React Admin's
 * internal store for a given resource. This prevents UI inconsistencies and
 * ensures that filters displayed to users are always valid.
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
 * if invalid filters are detected and removed.
 */
export const useFilterCleanup = (resource: string) => {
  const [, storeApi] = useStore();

  useEffect(() => {
    // IMPORTANT: Key must match the store name initialized in CRM.tsx (line 123)
    // where React Admin store is configured with storeName="CRM", resulting in
    // localStorage keys like "RaStoreCRM.{resource}.listParams"
    const key = `RaStoreCRM.${resource}.listParams`;
    const storedParams = localStorage.getItem(key);

    if (!storedParams) {
      return; // No stored params, nothing to clean
    }

    try {
      const params = JSON.parse(storedParams);

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

      // Only update if we actually removed something
      if (modified) {
        params.filter = cleanedFilter;
        localStorage.setItem(key, JSON.stringify(params));
        storeApi.setItem(key, params);

        console.info(
          `[useFilterCleanup] Cleaned stale filters for resource "${resource}". ` +
          `localStorage and React Admin store updated.`
        );
      }
    } catch (error) {
      console.error(
        `[useFilterCleanup] Error parsing localStorage for resource "${resource}":`,
        error
      );
      // Don't throw - fail gracefully and let the app continue
      // Optionally, could clear the corrupted key: localStorage.removeItem(key);
    }
  }, [resource, storeApi]);
};
