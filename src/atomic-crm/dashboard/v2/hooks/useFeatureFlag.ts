import { useMemo } from "react";

/**
 * Feature flag hook for dashboard v2 layout
 *
 * Detects ?layout=v2 query parameter in URL
 *
 * @returns true if layout=v2 is present, false otherwise
 */
export function useFeatureFlag(): boolean {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("layout") === "v2";
  }, []);
}
