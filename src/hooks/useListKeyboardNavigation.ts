import { useState, useCallback, useEffect } from "react";
import { useListContext, useCreatePath, useResourceContext } from "ra-core";
import { useNavigate } from "react-router-dom";
import { isMac, shouldPreventShortcut } from "@/utils/keyboard";

export interface UseListKeyboardNavigationOptions {
  /**
   * Callback when a row is selected (via Enter key)
   * If not provided, defaults to opening the row in view mode
   */
  onSelect?: (id: number | string) => void;

  /**
   * Whether keyboard navigation is enabled
   * Useful for disabling when a modal/slide-over is open
   * @default true
   */
  enabled?: boolean;
}

export interface UseListKeyboardNavigationReturn {
  /** Currently focused row index (-1 if none) */
  focusedIndex: number;
  /** ID of the currently focused record */
  focusedId: number | string | null;
  /** Set focus to a specific index */
  setFocusedIndex: (index: number) => void;
  /** Clear focus */
  clearFocus: () => void;
  /** Whether keyboard shortcuts are active (Mac detection) */
  isMac: boolean;
  /** The modifier key name (⌘ or Ctrl) */
  modifierKey: string;
}

/**
 * Hook for keyboard navigation in list views
 *
 * Provides:
 * - Arrow Up/Down: Navigate between rows
 * - Enter: Open selected row (or trigger custom onSelect)
 * - Cmd/Ctrl + N: Navigate to create form
 * - Cmd/Ctrl + K or /: Focus search input
 *
 * @example
 * ```tsx
 * const { focusedIndex, focusedId } = useListKeyboardNavigation({
 *   onSelect: (id) => openSlideOver(Number(id), "view"),
 *   enabled: !isSlideOverOpen,
 * });
 * ```
 */
export function useListKeyboardNavigation({
  onSelect,
  enabled = true,
}: UseListKeyboardNavigationOptions = {}): UseListKeyboardNavigationReturn {
  const { data } = useListContext();
  const resource = useResourceContext();
  const createPath = useCreatePath();
  const navigate = useNavigate();

  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Get the ID of the currently focused record
  const focusedId =
    data && focusedIndex >= 0 && focusedIndex < data.length ? data[focusedIndex].id : null;

  const clearFocus = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  // Navigate to create form
  const handleCreate = useCallback(() => {
    if (!resource) return;
    const path = createPath({ resource, type: "create" });
    navigate(path);
  }, [resource, createPath, navigate]);

  // Focus search input
  const handleSearch = useCallback(() => {
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[type="search"], input[placeholder*="Search" i], input[aria-label*="Search" i]'
    );
    searchInput?.focus();
  }, []);

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      const target = event.target;
      const isModifier = isMac() ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + N: Create new record
      if (key === "n" && isModifier) {
        if (!shouldPreventShortcut(target)) {
          event.preventDefault();
          handleCreate();
        }
        return;
      }

      // Cmd/Ctrl + K or /: Focus search
      if ((key === "k" && isModifier) || (key === "/" && !shouldPreventShortcut(target))) {
        event.preventDefault();
        handleSearch();
        return;
      }

      // Arrow navigation - only when not in input fields
      if (shouldPreventShortcut(target)) return;
      if (!data || data.length === 0) return;

      // Arrow Up: Move focus up
      if (key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) => {
          if (prev <= 0) return data.length - 1; // Wrap to bottom
          return prev - 1;
        });
        return;
      }

      // Arrow Down: Move focus down
      if (key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) => {
          if (prev < 0 || prev >= data.length - 1) return 0; // Wrap to top
          return prev + 1;
        });
        return;
      }

      // Enter: Open selected row
      if (key === "Enter" && focusedIndex >= 0 && focusedIndex < data.length) {
        event.preventDefault();
        const id = data[focusedIndex].id;
        if (onSelect) {
          onSelect(id);
        } else {
          // Default: navigate to show view
          const path = createPath({ resource, type: "show", id });
          navigate(path);
        }
        return;
      }

      // Home: Jump to first row
      if (key === "Home") {
        event.preventDefault();
        setFocusedIndex(0);
        return;
      }

      // End: Jump to last row
      if (key === "End") {
        event.preventDefault();
        setFocusedIndex(data.length - 1);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    data,
    focusedIndex,
    onSelect,
    handleCreate,
    handleSearch,
    resource,
    createPath,
    navigate,
  ]);

  // Reset focus when data changes (e.g., pagination, filtering)
  useEffect(() => {
    setFocusedIndex(-1);
  }, [data]);

  return {
    focusedIndex,
    focusedId,
    setFocusedIndex,
    clearFocus,
    isMac: isMac(),
    modifierKey: isMac() ? "⌘" : "Ctrl",
  };
}
