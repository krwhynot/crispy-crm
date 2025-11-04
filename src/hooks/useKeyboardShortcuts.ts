import { useEffect, useCallback } from 'react';

/**
 * Detect if running on Mac for Cmd vs Ctrl
 */
const isMac = () => {
  return typeof window !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
};

/**
 * Check if the modifier key (Cmd on Mac, Ctrl elsewhere) is pressed
 */
const isModifierPressed = (event: KeyboardEvent): boolean => {
  return isMac() ? event.metaKey : event.ctrlKey;
};

/**
 * Check if target element should prevent shortcuts
 * Returns true if shortcuts should be blocked
 */
const shouldPreventShortcut = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  const isContentEditable = target.isContentEditable;

  // Block shortcuts in inputs, textareas, and contenteditable elements
  if (tagName === 'input' || tagName === 'textarea' || isContentEditable) {
    return true;
  }

  // Check if inside a contenteditable parent
  let element: HTMLElement | null = target;
  while (element) {
    if (element.isContentEditable) return true;
    element = element.parentElement;
  }

  return false;
};

/**
 * Check if element is a textarea or contenteditable
 */
const isTextarea = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName.toLowerCase() === 'textarea' || target.isContentEditable;
};

/**
 * Check if an element is a form
 */
const isInForm = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest('form') !== null;
};

export interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onNew?: () => void;
  onSearch?: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;
  onDelete?: () => void;
}

/**
 * Global keyboard shortcut handler hook
 *
 * Implements keyboard shortcuts with cross-platform support and context awareness:
 * - Ctrl/Cmd + S: Save form
 * - Ctrl/Cmd + N: New record
 * - Ctrl/Cmd + K or /: Focus search
 * - Escape: Cancel/close modal
 * - Enter: Submit form (not in textarea)
 * - Delete: Delete selected (with confirmation)
 *
 * @param handlers - Object with handler functions for each shortcut
 */
export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers = {}) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;
      const target = event.target;

      // Ctrl/Cmd + S: Save
      if (key === 's' && isModifierPressed(event)) {
        // Only in forms
        if (isInForm(target)) {
          event.preventDefault();
          handlers.onSave?.();
        }
        return;
      }

      // Ctrl/Cmd + N: New record
      if (key === 'n' && isModifierPressed(event)) {
        // Don't prevent if in input fields
        if (!shouldPreventShortcut(target)) {
          event.preventDefault();
          handlers.onNew?.();
        }
        return;
      }

      // Ctrl/Cmd + K or /: Focus search
      if ((key === 'k' && isModifierPressed(event)) || key === '/') {
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
      if (key === 'Escape') {
        handlers.onCancel?.();
        // Let default behavior also work (closing modals, etc.)
        return;
      }

      // Enter: Submit form (not in textarea)
      if (key === 'Enter') {
        // Only in forms, not in textareas
        if (isInForm(target) && !isTextarea(target)) {
          // Let default form submit happen, but also call handler
          handlers.onSubmit?.();
        }
        return;
      }

      // Delete: Delete selected (with confirmation)
      if (key === 'Delete') {
        // Only if not in input/textarea
        if (!shouldPreventShortcut(target)) {
          handlers.onDelete?.();
        }
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    isMac: isMac(),
    modifierKey: isMac() ? '⌘' : 'Ctrl',
  };
};
