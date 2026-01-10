/**
 * Shared keyboard utilities for detecting platform and preventing shortcuts in input fields.
 *
 * Consolidated from:
 * - src/hooks/useKeyboardShortcuts.ts
 * - src/hooks/useListKeyboardNavigation.ts
 */

/**
 * Detect if running on Mac/iOS for Cmd vs Ctrl key handling
 *
 * Uses navigator.userAgentData when available (modern browsers),
 * falls back to navigator.platform for older browsers.
 */
export const isMac = (): boolean => {
  if (typeof window === "undefined") return false;

  // Modern approach: Use userAgentData API when available
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  if (nav.userAgentData?.platform) {
    return /macOS|iOS/i.test(nav.userAgentData.platform);
  }

  // Fallback: Use platform property for older browsers
  return /Mac|iPhone|iPod|iPad/.test(navigator.platform);
};

/**
 * Check if the modifier key (Cmd on Mac, Ctrl elsewhere) is pressed
 */
export const isModifierPressed = (event: KeyboardEvent): boolean => {
  return isMac() ? event.metaKey : event.ctrlKey;
};

/**
 * Check if target element should prevent shortcuts from firing.
 * Returns true if shortcuts should be blocked (e.g., user is typing in an input).
 *
 * Blocks shortcuts when:
 * - In input, textarea, or select elements
 * - In contenteditable elements
 * - Inside a contenteditable parent
 * - In elements with ARIA text input roles (textbox, searchbox, combobox)
 */
export const shouldPreventShortcut = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  const isContentEditable = target.isContentEditable;

  // Block shortcuts in inputs, textareas, selects, and contenteditable elements
  if (tagName === "input" || tagName === "textarea" || tagName === "select" || isContentEditable) {
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

/**
 * Check if element is a textarea or contenteditable
 */
export const isTextarea = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName.toLowerCase() === "textarea" || target.isContentEditable;
};

/**
 * Check if an element is inside a form
 */
export const isInForm = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("form") !== null;
};

/**
 * Get platform-specific modifier key display
 */
export const getModifierKey = (): string => {
  return isMac() ? "⌘" : "Ctrl";
};
