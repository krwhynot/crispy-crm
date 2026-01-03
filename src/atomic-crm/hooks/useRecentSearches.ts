import { useSyncExternalStore, useCallback } from "react";
import { z } from "zod";

/**
 * Entity types that support recent searches
 */
export type SearchableEntityType =
  | "organizations"
  | "contacts"
  | "opportunities";

/**
 * A recently searched/viewed item
 */
export interface RecentSearchItem {
  id: string | number;
  label: string;
  entityType: SearchableEntityType;
  timestamp: number;
}

interface UseRecentSearchesReturn {
  recentItems: RecentSearchItem[];
  addRecent: (item: Omit<RecentSearchItem, "timestamp">) => void;
  clearRecent: () => void;
}

const MAX_RECENT_ITEMS = 10;
const STORAGE_KEY = "crm_recent_searches";

/**
 * Zod schema for validating recent search items
 * Uses strictObject to prevent mass assignment (security best practice)
 */
const recentSearchItemSchema = z.strictObject({
  id: z.union([z.string(), z.number()]),
  label: z.string().max(255),
  entityType: z.enum(["organizations", "contacts", "opportunities"]),
  timestamp: z.number(),
});

const recentSearchesSchema = z.array(recentSearchItemSchema).max(MAX_RECENT_ITEMS);

// Module-level subscriber set for same-tab synchronization
const listeners = new Set<() => void>();

// Cached snapshot - CRITICAL: getSnapshot must return stable reference
// to avoid infinite re-render loops in useSyncExternalStore
let cachedSnapshot: RecentSearchItem[] = [];

/**
 * Load items from localStorage and update cached snapshot
 * Only creates a new array reference when data actually changes
 */
function loadFromStorage(): RecentSearchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    const result = recentSearchesSchema.safeParse(parsed);

    if (!result.success) {
      console.error(
        "[RecentSearches] Validation failed:",
        result.error.flatten()
      );
      return [];
    }

    // Sort by timestamp descending (most recent first)
    return result.data.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("[RecentSearches] Error reading from storage:", e);
    return [];
  }
}

// Initialize cached snapshot on module load
cachedSnapshot = loadFromStorage();

/**
 * External store for recent searches
 *
 * Uses useSyncExternalStore pattern per React docs:
 * - getSnapshot: returns CACHED reference (must be stable!)
 * - subscribe: registers callbacks for state changes
 * - emitChange: refreshes cache and notifies subscribers
 *
 * IMPORTANT: getSnapshot must return the same reference unless data changed.
 * Creating a new array on every call causes infinite re-renders.
 */
const recentSearchesStore = {
  /**
   * Return cached snapshot - MUST return stable reference!
   * Do NOT create new arrays here (no .sort(), no spread, no .map())
   */
  getSnapshot: (): RecentSearchItem[] => cachedSnapshot,

  /**
   * Subscribe to store changes
   * Called by React to register re-render callbacks
   */
  subscribe: (callback: () => void) => {
    listeners.add(callback);

    // Cross-tab sync: browser fires 'storage' event when localStorage
    // changes in another tab (but NOT in the same tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        // Refresh cache from storage and notify
        cachedSnapshot = loadFromStorage();
        callback();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
      window.removeEventListener("storage", handleStorageChange);
    };
  },

  /**
   * Refresh cache from localStorage and notify all subscribers
   * Creates new snapshot reference to trigger re-renders
   */
  refreshCache: () => {
    cachedSnapshot = loadFromStorage();
    listeners.forEach((fn) => fn());
  },
};

/**
 * Hook for managing cross-entity recent searches
 *
 * Uses useSyncExternalStore to sync state across all hook instances.
 * When any component calls addRecent(), all components using this hook
 * will automatically re-render with the updated items.
 *
 * Stores up to 10 recently viewed records across all entity types.
 * Items are persisted to localStorage and sorted by recency.
 *
 * @returns Object with recentItems array and control functions
 *
 * @example
 * ```tsx
 * const { recentItems, addRecent, clearRecent } = useRecentSearches();
 *
 * // Add a recent item when viewing a record
 * addRecent({ id: 123, label: "Acme Corp", entityType: "organizations" });
 *
 * // Clear all recent items
 * clearRecent();
 * ```
 */
export function useRecentSearches(): UseRecentSearchesReturn {
  const recentItems = useSyncExternalStore(
    recentSearchesStore.subscribe,
    recentSearchesStore.getSnapshot,
    () => [] // Server snapshot for SSR (returns empty array)
  );

  const addRecent = useCallback(
    (item: Omit<RecentSearchItem, "timestamp">) => {
      // Read current items from cached snapshot
      const current = cachedSnapshot;

      // Remove existing item with same ID AND entityType (deduplicate)
      const filtered = current.filter(
        (existing) =>
          !(existing.id === item.id && existing.entityType === item.entityType)
      );

      // Create new item with timestamp
      const newItem: RecentSearchItem = {
        ...item,
        timestamp: Date.now(),
      };

      // Add new item to front, limit to max items
      const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);

      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Update cache and trigger re-render in all subscribers
      recentSearchesStore.refreshCache();
    },
    []
  );

  const clearRecent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    recentSearchesStore.refreshCache();
  }, []);

  return {
    recentItems,
    addRecent,
    clearRecent,
  };
}
