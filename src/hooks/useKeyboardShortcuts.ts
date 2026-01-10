import { useEffect, useCallback } from "react";
import {
  isMac,
  isModifierPressed,
  shouldPreventShortcut,
  isTextarea,
  isInForm,
} from "@/utils/keyboard";

export interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onNew?: () => void;
  onSearch?: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;
  onDelete?: () => void;
  /** Arrow up handler for list navigation */
  onArrowUp?: () => void;
  /** Arrow down handler for list navigation */
  onArrowDown?: () => void;
  /** Enter handler for opening selected item */
  onEnter?: () => void;
}

/**
 * Global keyboard shortcut handler hook
 *
 * Implements keyboard shortcuts with cross-platform support and context awareness:
 * - Ctrl/Cmd + S: Save form
 * - Ctrl/Cmd + N: New record
 * - Ctrl/Cmd + K or /: Focus search
 * - Escape: Cancel/close modal
 * - Enter: Submit form or open selected item (not in textarea)
 * - Delete: Delete selected (with confirmation)
 * - Arrow Up/Down: Navigate list items
 *
 * @param handlers - Object with handler functions for each shortcut
 */
export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers = {}) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;
      const target = event.target;

      // Ctrl/Cmd + S: Save
      if (key === "s" && isModifierPressed(event)) {
        // Only in forms
        if (isInForm(target)) {
          event.preventDefault();
          handlers.onSave?.();
        }
        return;
      }

      // Ctrl/Cmd + N: New record
      if (key === "n" && isModifierPressed(event)) {
        // Don't prevent if in input fields
        if (!shouldPreventShortcut(target)) {
          event.preventDefault();
          handlers.onNew?.();
        }
        return;
      }

      // Ctrl/Cmd + K or /: Focus search
      if ((key === "k" && isModifierPressed(event)) || key === "/") {
        // Don't prevent if in input fields
        if (!shouldPreventShortcut(target)) {
          event.preventDefault();
          handlers.onSearch?.();

          // Focus the search input if it exists
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="search"], input[placeholder*="Search" i]'
          );
          searchInput?.focus();
        }
        return;
      }

      // Escape: Cancel/close modal
      if (key === "Escape") {
        handlers.onCancel?.();
        // Let default behavior also work (closing modals, etc.)
        return;
      }

      // Enter: Submit form (not in textarea)
      if (key === "Enter") {
        // Only in forms, not in textareas
        if (isInForm(target) && !isTextarea(target)) {
          // Let default form submit happen, but also call handler
          handlers.onSubmit?.();
        }
        return;
      }

      // Delete: Delete selected (with confirmation)
      if (key === "Delete") {
        // Only if not in input/textarea
        if (!shouldPreventShortcut(target)) {
          handlers.onDelete?.();
        }
        return;
      }

      // Arrow Up: Navigate list up
      if (key === "ArrowUp") {
        // Only if not in input/textarea
        if (!shouldPreventShortcut(target) && handlers.onArrowUp) {
          event.preventDefault();
          handlers.onArrowUp();
        }
        return;
      }

      // Arrow Down: Navigate list down
      if (key === "ArrowDown") {
        // Only if not in input/textarea
        if (!shouldPreventShortcut(target) && handlers.onArrowDown) {
          event.preventDefault();
          handlers.onArrowDown();
        }
        return;
      }

      // Enter: Open selected item (when not in form)
      if (key === "Enter" && !isInForm(target) && !shouldPreventShortcut(target)) {
        if (handlers.onEnter) {
          event.preventDefault();
          handlers.onEnter();
        }
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    isMac: isMac(),
    modifierKey: isMac() ? "⌘" : "Ctrl",
  };
};

/**
 * Format keyboard shortcut for display in tooltips
 *
 * @example
 * formatShortcut("n", true) // "⌘N" on Mac, "Ctrl+N" on Windows
 * formatShortcut("Escape") // "Esc"
 * formatShortcut("ArrowDown") // "↓"
 */
export function formatShortcut(key: string, withModifier = false, withShift = false): string {
  const mac = isMac();
  const parts: string[] = [];

  if (withModifier) {
    parts.push(mac ? "⌘" : "Ctrl");
  }
  if (withShift) {
    parts.push(mac ? "⇧" : "Shift");
  }

  // Format special keys
  const keyDisplay =
    key === "Escape"
      ? "Esc"
      : key === "ArrowDown"
        ? "↓"
        : key === "ArrowUp"
          ? "↑"
          : key === "ArrowLeft"
            ? "←"
            : key === "ArrowRight"
              ? "→"
              : key === "Delete"
                ? "Del"
                : key.toUpperCase();

  parts.push(keyDisplay);

  return mac ? parts.join("") : parts.join("+");
}
