import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { subDays } from "date-fns";

export interface GlobalFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  salesRepId: number | null;
}

interface GlobalFilterContextValue {
  filters: GlobalFilters;
  setFilters: (filters: GlobalFilters) => void;
  resetFilters: () => void;
}

const defaultFilters: GlobalFilters = {
  dateRange: {
    start: subDays(new Date(), 30),
    end: new Date(),
  },
  salesRepId: null,
};

const GlobalFilterContext = createContext<GlobalFilterContextValue | undefined>(undefined);

const STORAGE_KEY = "reports.globalFilters";

export function GlobalFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<GlobalFilters>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          dateRange: {
            start: new Date(parsed.dateRange.start),
            end: new Date(parsed.dateRange.end),
          },
        };
      } catch {
        return defaultFilters;
      }
    }
    return defaultFilters;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const setFilters = (newFilters: GlobalFilters) => {
    setFiltersState(newFilters);
  };

  const resetFilters = () => {
    setFiltersState(defaultFilters);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <GlobalFilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilters() {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error("useGlobalFilters must be used within GlobalFilterProvider");
  }
  return context;
}
