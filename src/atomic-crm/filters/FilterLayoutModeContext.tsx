import { createContext, useContext, type ReactNode } from "react";

/**
 * FilterLayoutMode determines how filter components render:
 * - "full": Expanded sidebar with collapsible categories (desktop)
 * - "icon-rail": Icon-only vertical strip with popover flyouts (narrow desktop)
 * - "sheet": Full layout inside a slide-over sheet (tablet/mobile)
 */
export type FilterLayoutMode = "full" | "icon-rail" | "sheet";

const FilterLayoutModeContext = createContext<FilterLayoutMode>("full");

export const FilterLayoutModeProvider = FilterLayoutModeContext.Provider;

export function useFilterLayoutMode(): FilterLayoutMode {
  return useContext(FilterLayoutModeContext);
}

/**
 * Hides children in icon-rail mode.
 * Use for non-FilterCategory elements (StarredFilterToggle, SearchInput, etc.)
 * that don't have an icon representation in the rail.
 */
export function FilterRailHidden({ children }: { children: ReactNode }) {
  const mode = useFilterLayoutMode();
  if (mode === "icon-rail") return null;
  return <>{children}</>;
}
