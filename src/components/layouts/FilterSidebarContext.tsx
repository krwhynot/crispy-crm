import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ListContext } from "ra-core";
import { countActiveUserFilters } from "./listFilterSemantics";

const DEFAULT_STORAGE_KEY = "crm-filter-sidebar-collapsed";

interface FilterSidebarContextValue {
  /** Whether the desktop sidebar is collapsed */
  isCollapsed: boolean;
  /** Toggle the desktop sidebar collapse state */
  toggleSidebar: () => void;
  /** Whether the mobile filter sheet is open */
  isSheetOpen: boolean;
  /** Open or close the mobile filter sheet */
  setSheetOpen: (open: boolean) => void;
  /** Number of active user-facing filters (excludes only internal system keys) */
  activeFilterCount: number;
  /** Whether a ListToolbar is present (owns the filter trigger at <1024px) */
  hasToolbar: boolean;
  /** Called by ListToolbar on mount to claim filter trigger ownership */
  setHasToolbar: (value: boolean) => void;
}

const FilterSidebarContext = createContext<FilterSidebarContextValue | null>(null);

interface FilterSidebarProviderProps {
  children: ReactNode;
  /** localStorage key for sidebar collapse state */
  storageKey?: string;
}

export function FilterSidebarProvider({
  children,
  storageKey = DEFAULT_STORAGE_KEY,
}: FilterSidebarProviderProps) {
  // Use ListContext directly (returns null outside <List>) instead of
  // useListContext() which throws when no ListContext provider exists.
  // This makes the provider safe for non-List pages like Reports.
  const listContext = useContext(ListContext);
  const filterValues = listContext?.filterValues;

  // Desktop sidebar collapse state — persisted to localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) return stored === "true";
    return false;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(isCollapsed));
  }, [isCollapsed, storageKey]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Mobile sheet open state
  const [isSheetOpen, setSheetOpen] = useState(false);

  // Whether a ListToolbar is mounted (owns the filter trigger at <1024px)
  const [hasToolbar, setHasToolbar] = useState(false);

  // Active filter count — excludes system keys
  const activeFilterCount = useMemo(() => countActiveUserFilters(filterValues), [filterValues]);

  const value = useMemo<FilterSidebarContextValue>(
    () => ({
      isCollapsed,
      toggleSidebar,
      isSheetOpen,
      setSheetOpen,
      activeFilterCount,
      hasToolbar,
      setHasToolbar,
    }),
    [isCollapsed, toggleSidebar, isSheetOpen, activeFilterCount, hasToolbar]
  );

  return <FilterSidebarContext.Provider value={value}>{children}</FilterSidebarContext.Provider>;
}

export function useFilterSidebarContext(): FilterSidebarContextValue {
  const context = useContext(FilterSidebarContext);
  if (!context) {
    throw new Error("useFilterSidebarContext must be used within a FilterSidebarProvider");
  }
  return context;
}
