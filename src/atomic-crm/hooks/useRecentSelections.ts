import { useState, useCallback } from "react";
import { z } from "zod";
import { getStorageItem, setStorageItem, removeStorageItem } from "../utils/secureStorage";

interface RecentItem {
  id: string | number;
  label: string;
}

interface UseRecentSelectionsReturn {
  recentItems: RecentItem[];
  addRecent: (item: RecentItem) => void;
  clearRecent: () => void;
}

const MAX_RECENT_ITEMS = 5;

const recentItemSchema = z.strictObject({
  id: z.union([z.string(), z.number()]),
  label: z.string().max(255),
});
const recentItemsSchema = z.array(recentItemSchema).max(5);

export const useRecentSelections = (fieldType: string): UseRecentSelectionsReturn => {
  const storageKey = `crm_recent_${fieldType}`;

  const loadFromStorage = (): RecentItem[] => {
    return getStorageItem<RecentItem[]>(storageKey, {
      type: "local",
      schema: recentItemsSchema,
    }) ?? [];
  };

  const [recentItems, setRecentItems] = useState<RecentItem[]>(loadFromStorage);

  const saveToStorage = useCallback(
    (items: RecentItem[]) => {
      setStorageItem(storageKey, items, { type: "local" });
    },
    [storageKey]
  );

  const addRecent = useCallback(
    (item: RecentItem) => {
      setRecentItems((current) => {
        // Remove existing item with same ID if present
        const filtered = current.filter((existing) => existing.id !== item.id);

        // Add new item to front
        const updated = [item, ...filtered];

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
    removeStorageItem(storageKey);
  }, [storageKey]);

  return {
    recentItems,
    addRecent,
    clearRecent,
  };
};
