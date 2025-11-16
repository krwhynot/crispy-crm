import { useMemo } from "react";

/**
 * Feature flag hook for dashboard v2 layout
 *
 * Detects ?layout=v2 query parameter in URL
 * Safe for SSR environments (returns false when window undefined)
 *
 * @returns true if layout=v2 is present, false otherwise
 */
export function useFeatureFlag(): boolean {
  return useMemo(() => {
    // SSR guard: return false if window is undefined
    if (typeof window === 'undefined') {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("layout") === "v2";
  }, []);
}
