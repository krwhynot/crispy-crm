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
import { countActiveUserFiltersWithOrSource } from "./listFilterSemantics";

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
  /** Tracks who set the current $or filter: "preset" (quick filters), "owner" (OwnerFilterDropdown), or null (unknown/URL-restored) */
  orSource: "preset" | "owner" | null;
  /** Set the $or filter origin */
  setOrSource: (source: "preset" | "owner" | null) => void;
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

  // orSource tracks WHO set the current $or filter: "preset" (quick filters),
  // "owner" (OwnerFilterDropdown), or null (unknown -- e.g. URL-restored).
  // null is treated as "owner" (safe default): URL-restored preset $or won't
  // count toward active filters, won't be cleared by "Clear all", and won't
  // trigger filtered-empty-state. This is intentional -- sidecar metadata is
  // session-only and cannot survive page refresh.
  const [orSource, setOrSource] = useState<"preset" | "owner" | null>(null);

  // Sync effect: prevent stale sidecar when $or is externally removed
  useEffect(() => {
    if (!filterValues?.$or && orSource !== null) {
      setOrSource(null);
    }
  }, [filterValues?.$or, orSource]);

  // Active filter count — excludes system keys, counts preset $or as user filter
  const activeFilterCount = useMemo(
    () => countActiveUserFiltersWithOrSource(filterValues, orSource),
    [filterValues, orSource]
  );

  const value = useMemo<FilterSidebarContextValue>(
    () => ({
      isCollapsed,
      toggleSidebar,
      isSheetOpen,
      setSheetOpen,
      activeFilterCount,
      hasToolbar,
      setHasToolbar,
      orSource,
      setOrSource,
    }),
    [isCollapsed, toggleSidebar, isSheetOpen, activeFilterCount, hasToolbar, orSource]
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

/** Non-throwing version for components that may render outside FilterSidebarProvider */
export function useOptionalFilterSidebarContext(): FilterSidebarContextValue | null {
  return useContext(FilterSidebarContext);
}
