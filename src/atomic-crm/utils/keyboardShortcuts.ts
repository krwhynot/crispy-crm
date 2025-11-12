interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
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
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  handleKeyPress = (e: KeyboardEvent) => {
    if (!this.enabled) return;

    // Don't trigger in input fields unless explicitly allowed
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      if (!e.ctrlKey && !e.metaKey) return;
    }

    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
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
    console.table(shortcuts.map(s => ({
      shortcut: this.buildKey(s),
      description: s.description
    })));
  }
}

// Create singleton instance
export const globalShortcuts = new KeyboardShortcutManager();

// Hook for React components
import { useEffect } from 'react';

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
