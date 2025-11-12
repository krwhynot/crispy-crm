import { describe, it, expect, vi } from 'vitest';
import { KeyboardShortcutManager } from '../keyboardShortcuts';

describe('KeyboardShortcutManager', () => {
  it('should register and execute shortcuts', () => {
    const manager = new KeyboardShortcutManager();
    const handler = vi.fn();

    manager.register({
      key: 'n',
      ctrl: true,
      handler,
      description: 'New item'
    });

    // Simulate Ctrl+N
    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true
    });

    manager.handleKeyPress(event);

    expect(handler).toHaveBeenCalled();
  });

  it('should prevent default when shortcut matches', () => {
    const manager = new KeyboardShortcutManager();
    const preventDefault = vi.fn();

    manager.register({
      key: 'e',
      ctrl: true,
      handler: () => {},
      description: 'Export'
    });

    const event = new KeyboardEvent('keydown', {
      key: 'e',
      ctrlKey: true
    });
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });

    manager.handleKeyPress(event);

    expect(preventDefault).toHaveBeenCalled();
  });
});
