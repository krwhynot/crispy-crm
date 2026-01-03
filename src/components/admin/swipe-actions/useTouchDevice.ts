import { useState, useEffect } from "react";

/**
 * Detect if the current device is touch-only (no hover capability).
 * Handles SSR by starting with false and updating on mount.
 * Listens for media query changes to handle device mode switches.
 *
 * @returns true if device has no hover and uses coarse pointer (touch-only)
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
    setIsTouch(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isTouch;
}
