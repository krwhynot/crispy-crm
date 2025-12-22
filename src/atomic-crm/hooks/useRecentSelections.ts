import { useState, useCallback } from "react";
import { z } from "zod";
import { safeJsonParse } from "../utils/safeJsonParse";

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

export const useRecentSelections = (fieldType: string): UseRecentSelectionsReturn => {
  const storageKey = `crm_recent_${fieldType}`;

  const loadFromStorage = (): RecentItem[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const [recentItems, setRecentItems] = useState<RecentItem[]>(loadFromStorage);

  const saveToStorage = useCallback(
    (items: RecentItem[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch {
        // Silently fail if localStorage is unavailable
      }
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
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, [storageKey]);

  return {
    recentItems,
    addRecent,
    clearRecent,
  };
};
