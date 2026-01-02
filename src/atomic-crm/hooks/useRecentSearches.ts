import { useState, useCallback } from "react";
import { z } from "zod";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "../utils/secureStorage";

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

/**
 * Hook for managing cross-entity recent searches
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
export const useRecentSearches = (): UseRecentSearchesReturn => {
  const loadFromStorage = (): RecentSearchItem[] => {
    const items =
      getStorageItem<RecentSearchItem[]>(STORAGE_KEY, {
        type: "local",
        schema: recentSearchesSchema,
      }) ?? [];

    // Sort by timestamp descending (most recent first)
    return items.sort((a, b) => b.timestamp - a.timestamp);
  };

  const [recentItems, setRecentItems] =
    useState<RecentSearchItem[]>(loadFromStorage);

  const saveToStorage = useCallback((items: RecentSearchItem[]) => {
    setStorageItem(STORAGE_KEY, items, { type: "local" });
  }, []);

  const addRecent = useCallback(
    (item: Omit<RecentSearchItem, "timestamp">) => {
      setRecentItems((current) => {
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

        // Add new item to front
        const updated = [newItem, ...filtered];

        // Limit to max items
        const limited = updated.slice(0, MAX_RECENT_ITEMS);

        saveToStorage(limited);
        return limited;
      });
    },
    [saveToStorage]
  );

  const clearRecent = useCallback(() => {
    setRecentItems([]);
    removeStorageItem(STORAGE_KEY);
  }, []);

  return {
    recentItems,
    addRecent,
    clearRecent,
  };
};
