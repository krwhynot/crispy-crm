import { useStore } from "react-admin";
import { useCallback } from "react";

/**
 * Represents a recently viewed record for quick navigation.
 * Stores minimal data - no sensitive field values.
 */
export interface RecentItem {
  id: string | number;
  resource: string; // e.g., 'contacts', 'organizations', 'opportunities'
  title: string; // Display name for the record
  viewedAt: string; // ISO 8601 timestamp
}

/** Maximum number of recent items to store */
const MAX_RECENT_ITEMS = 10;

/** useStore key - scoped to CRM namespace */
const STORE_KEY = "crm.recentItems";

/**
 * Hook to track recently viewed records across all resources.
 *
 * Uses React Admin's useStore for persistence:
 * - Automatically persists to localStorage
 * - Clears on logout (handled by React Admin)
 * - Scoped by store key to prevent collisions
 *
 * @example
 * ```tsx
 * const { recentItems, addRecentItem, clearRecentItems } = useRecentItems();
 *
 * // When viewing a record
 * addRecentItem({ id: record.id, resource: 'contacts', title: record.name });
 *
 * // Display recent items
 * recentItems.map(item => <Link to={`/${item.resource}/${item.id}`}>{item.title}</Link>)
 * ```
 */
export const useRecentItems = () => {
  const [recentItems, setRecentItems] = useStore<RecentItem[]>(STORE_KEY, []);

  const addRecentItem = useCallback(
    (item: Omit<RecentItem, "viewedAt">) => {
      setRecentItems((prev) => {
        // Remove existing entry for same record (by id + resource combo)
        // This allows same ID across different resources (e.g., contact #5 vs org #5)
        const filtered = prev.filter((i) => !(i.id === item.id && i.resource === item.resource));

        // Add to front with current timestamp, limit to max items
        return [{ ...item, viewedAt: new Date().toISOString() }, ...filtered].slice(
          0,
          MAX_RECENT_ITEMS
        );
      });
    },
    [setRecentItems]
  );

  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
  }, [setRecentItems]);

  return { recentItems, addRecentItem, clearRecentItems };
};
