import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useListContext } from "ra-core";

const DEFAULT_STORAGE_KEY = "crm-filter-sidebar-collapsed";

/** System filter keys excluded from the active filter count */
const SYSTEM_FILTER_KEYS = new Set(["deleted_at", "deleted_at@is", "$or", "q"]);

interface FilterSidebarContextValue {
  /** Whether the desktop sidebar is collapsed */
  isCollapsed: boolean;
  /** Toggle the desktop sidebar collapse state */
  toggleSidebar: () => void;
  /** Whether the mobile filter sheet is open */
  isSheetOpen: boolean;
  /** Open or close the mobile filter sheet */
  setSheetOpen: (open: boolean) => void;
  /** Number of active user-facing filters (excludes system keys and search) */
  activeFilterCount: number;
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
  const { filterValues } = useListContext();

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

  // Active filter count — excludes system keys
  const activeFilterCount = useMemo(() => {
    if (!filterValues) return 0;
    return Object.keys(filterValues).filter((key) => !SYSTEM_FILTER_KEYS.has(key)).length;
  }, [filterValues]);

  const value = useMemo<FilterSidebarContextValue>(
    () => ({
      isCollapsed,
      toggleSidebar,
      isSheetOpen,
      setSheetOpen,
      activeFilterCount,
    }),
    [isCollapsed, toggleSidebar, isSheetOpen, activeFilterCount]
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
