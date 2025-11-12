import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KeyboardShortcutManager, getModifierKeyName, getIsMac } from '../keyboardShortcuts';

describe('KeyboardShortcutManager', () => {
  let manager: KeyboardShortcutManager;

  beforeEach(() => {
    manager = new KeyboardShortcutManager();
  });

  it('should register and execute shortcuts', () => {
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

  it('should block shortcuts in input fields without modifiers', () => {
    const handler = vi.fn();

    manager.register({
      key: 'a',
      handler,
      description: 'Action'
    });

    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true
    });
    Object.defineProperty(event, 'target', { value: input, configurable: true });

    manager.handleKeyPress(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should allow shortcuts with modifiers in input fields', () => {
    const handler = vi.fn();

    manager.register({
      key: 's',
      ctrl: true,
      handler,
      description: 'Save'
    });

    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    });
    Object.defineProperty(event, 'target', { value: input, configurable: true });

    manager.handleKeyPress(event);

    expect(handler).toHaveBeenCalled();
  });

  it('should block shortcuts in textarea fields', () => {
    const handler = vi.fn();

    manager.register({
      key: 'x',
      handler,
      description: 'Cut'
    });

    const textarea = document.createElement('textarea');
    const event = new KeyboardEvent('keydown', {
      key: 'x',
      bubbles: true
    });
    Object.defineProperty(event, 'target', { value: textarea, configurable: true });

    manager.handleKeyPress(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should block shortcuts in select elements', () => {
    const handler = vi.fn();

    manager.register({
      key: 'ArrowDown',
      handler,
      description: 'Navigate'
    });

    const select = document.createElement('select');
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true
    });
    Object.defineProperty(event, 'target', { value: select, configurable: true });

    manager.handleKeyPress(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should block shortcuts in contenteditable elements', () => {
    const handler = vi.fn();

    manager.register({
      key: 'b',
      handler,
      description: 'Bold'
    });

    const div = document.createElement('div');
    div.contentEditable = 'true';

    // Mock isContentEditable property for JSDOM
    Object.defineProperty(div, 'isContentEditable', {
      get: () => true,
      configurable: true
    });

    const event = new KeyboardEvent('keydown', {
      key: 'b',
      bubbles: true
    });
    Object.defineProperty(event, 'target', { value: div, configurable: true });

    manager.handleKeyPress(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should block shortcuts in elements with ARIA textbox role', () => {
    const handler = vi.fn();

    manager.register({
      key: 'Delete',
      handler,
      description: 'Delete'
    });

    const div = document.createElement('div');
    div.setAttribute('role', 'textbox');
    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
      bubbles: true
    });
    Object.defineProperty(event, 'target', { value: div, configurable: true });

    manager.handleKeyPress(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should enable and disable shortcuts', () => {
    const handler = vi.fn();

    manager.register({
      key: 't',
      ctrl: true,
      handler,
      description: 'Test'
    });

    // Disable shortcuts
    manager.disable();

    const event = new KeyboardEvent('keydown', {
      key: 't',
      ctrlKey: true
    });

    manager.handleKeyPress(event);
    expect(handler).not.toHaveBeenCalled();

    // Enable shortcuts
    manager.enable();

    manager.handleKeyPress(event);
    expect(handler).toHaveBeenCalled();
  });

  it('should unregister shortcuts', () => {
    const handler = vi.fn();

    const shortcut = {
      key: 'r',
      ctrl: true,
      handler,
      description: 'Refresh'
    };

    manager.register(shortcut);
    manager.unregister(shortcut);

    const event = new KeyboardEvent('keydown', {
      key: 'r',
      ctrlKey: true
    });

    manager.handleKeyPress(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple modifier keys', () => {
    const handler = vi.fn();

    manager.register({
      key: 'z',
      ctrl: true,
      shift: true,
      handler,
      description: 'Redo'
    });

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      shiftKey: true
    });

    manager.handleKeyPress(event);

    expect(handler).toHaveBeenCalled();
  });

  it('should handle Meta key separately from Ctrl', () => {
    const ctrlHandler = vi.fn();
    const metaHandler = vi.fn();

    manager.register({
      key: 's',
      ctrl: true,
      handler: ctrlHandler,
      description: 'Save with Ctrl'
    });

    manager.register({
      key: 's',
      meta: true,
      handler: metaHandler,
      description: 'Save with Meta'
    });

    // Test Ctrl+S
    const ctrlEvent = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true
    });
    manager.handleKeyPress(ctrlEvent);
    expect(ctrlHandler).toHaveBeenCalled();
    expect(metaHandler).not.toHaveBeenCalled();

    ctrlHandler.mockClear();
    metaHandler.mockClear();

    // Test Meta+S (Cmd+S on Mac)
    const metaEvent = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true
    });
    manager.handleKeyPress(metaEvent);
    expect(metaHandler).toHaveBeenCalled();
    expect(ctrlHandler).not.toHaveBeenCalled();
  });

  it('should be case insensitive', () => {
    const handler = vi.fn();

    manager.register({
      key: 'p',
      ctrl: true,
      handler,
      description: 'Print'
    });

    // Test with uppercase P
    const event = new KeyboardEvent('keydown', {
      key: 'P',
      ctrlKey: true
    });

    manager.handleKeyPress(event);

    expect(handler).toHaveBeenCalled();
  });

  it('should return list of registered shortcuts', () => {
    manager.register({
      key: 'a',
      ctrl: true,
      handler: () => {},
      description: 'Action A'
    });

    manager.register({
      key: 'b',
      ctrl: true,
      handler: () => {},
      description: 'Action B'
    });

    const shortcuts = manager.getShortcuts();

    expect(shortcuts).toHaveLength(2);
    expect(shortcuts[0].description).toBe('Action A');
    expect(shortcuts[1].description).toBe('Action B');
  });
});

describe('Utility functions', () => {
  it('should return correct modifier key name', () => {
    const modifierKey = getModifierKeyName();
    expect(['⌘', 'Ctrl']).toContain(modifierKey);
  });

  it('should detect platform', () => {
    const isMac = getIsMac();
    expect(typeof isMac).toBe('boolean');
  });
});
