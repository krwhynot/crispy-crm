import { createContext, useContext } from "react";

/**
 * FilterLayoutMode determines how filter components render:
 * - "full": Expanded sidebar with collapsible categories (>=1280px desktop)
 * - "sheet": Full layout inside a slide-over sheet (<1280px)
 */
export type FilterLayoutMode = "full" | "sheet";

const FilterLayoutModeContext = createContext<FilterLayoutMode>("full");

export const FilterLayoutModeProvider = FilterLayoutModeContext.Provider;

export function useFilterLayoutMode(): FilterLayoutMode {
  return useContext(FilterLayoutModeContext);
}
