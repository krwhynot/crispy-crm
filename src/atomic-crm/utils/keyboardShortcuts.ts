/**
 * Unified Keyboard Shortcut Manager
 *
 * CONSOLIDATION NOTE (2025-11-12):
 * This implementation replaces previous implementations:
 * - src/hooks/useKeyboardShortcuts.ts (deprecated)
 * - src/providers/KeyboardShortcutsProvider.tsx (deprecated)
 *
 * Key improvements:
 * - Single source of truth for shortcuts
 * - Map-based registry for dynamic registration
 * - Mac/Windows/Linux compatible
 * - Comprehensive input field protection
 *
 * Migration: Update imports from old paths to this module
 */

/**
 * Detect if running on Mac for Cmd vs Ctrl
 */
const isMac = (): boolean => {
  return typeof window !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
};

/**
 * Check if target element should prevent shortcuts
 * Returns true if shortcuts should be blocked
 */
const shouldPreventShortcut = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  const isContentEditable = target.isContentEditable;

  // Block shortcuts in inputs, textareas, selects, and contenteditable elements
  if (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    isContentEditable
  ) {
    return true;
  }

  // Check if inside a contenteditable parent
  let element: HTMLElement | null = target;
  while (element) {
    if (element.isContentEditable) return true;
    element = element.parentElement;
  }

  // Check for ARIA text input roles
  const role = target.getAttribute("role");
  if (role === "textbox" || role === "searchbox" || role === "combobox") {
    return true;
  }

  return false;
};

export interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean; // Explicitly support Cmd key
  handler: () => void;
  description: string;
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, ShortcutHandler> = new Map();
  private enabled: boolean = true;

  register(shortcut: ShortcutHandler) {
    const key = this.buildKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  unregister(shortcut: ShortcutHandler) {
    const key = this.buildKey(shortcut);
    this.shortcuts.delete(key);
  }

  private buildKey(shortcut: ShortcutHandler): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.meta) parts.push('meta');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  handleKeyPress = (e: KeyboardEvent) => {
    if (!this.enabled) return;

    // Don't trigger in input fields unless modifier key is pressed
    if (shouldPreventShortcut(e.target)) {
      // Allow Ctrl/Cmd shortcuts even in input fields for common actions like save
      if (!e.ctrlKey && !e.metaKey) return;
    }

    const parts = [];
    // Keep Ctrl and Meta separate (don't normalize Cmd to Ctrl)
    if (e.ctrlKey) parts.push('ctrl');
    if (e.metaKey) parts.push('meta');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    parts.push(e.key.toLowerCase());

    const key = parts.join('+');
    const handler = this.shortcuts.get(key);

    if (handler) {
      e.preventDefault();
      e.stopPropagation();
      handler.handler();
    }
  };

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  getShortcuts(): ShortcutHandler[] {
    return Array.from(this.shortcuts.values());
  }

  showHelp() {
    const shortcuts = this.getShortcuts();
    if (process.env.NODE_ENV !== 'production') {
      console.table(shortcuts.map(s => ({
        shortcut: this.buildKey(s),
        description: s.description
      })));
    }
  }
}

// Create singleton instance
export const globalShortcuts = new KeyboardShortcutManager();

// Hook for React components
import { useEffect } from 'react';

/**
 * React hook for registering keyboard shortcuts
 *
 * WARNING: This hook uses dependency array for cleanup. To avoid infinite
 * re-registration, ensure shortcuts array is memoized with useMemo or useState.
 *
 * Example:
 * ```tsx
 * const shortcuts = useMemo(() => [
 *   { key: 's', ctrl: true, handler: handleSave, description: 'Save' }
 * ], [handleSave]);
 *
 * useKeyboardShortcuts(shortcuts);
 * ```
 *
 * @param shortcuts - Array of shortcut handlers to register
 */
export const useKeyboardShortcuts = (shortcuts: ShortcutHandler[]) => {
  useEffect(() => {
    shortcuts.forEach(s => globalShortcuts.register(s));

    const handleKeyPress = globalShortcuts.handleKeyPress;
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      shortcuts.forEach(s => globalShortcuts.unregister(s));
    };
  }, [shortcuts]);
};

/**
 * Utility to get platform-specific modifier key name
 * @returns "⌘" for Mac, "Ctrl" for others
 */
export const getModifierKeyName = (): string => {
  return isMac() ? "⌘" : "Ctrl";
};

/**
 * Check if running on Mac platform
 * @returns true if Mac/iOS, false otherwise
 */
export const getIsMac = (): boolean => {
  return isMac();
};
