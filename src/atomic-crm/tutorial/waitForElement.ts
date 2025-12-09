import type { TutorialStep } from "./types";

/** Selector for skeleton loading states - uses data-slot from Skeleton component */
const LOADING_SELECTOR = '[data-slot="skeleton"]';

/** Extended timeout when loading state is detected (15 seconds) */
const LOADING_EXTENDED_TIMEOUT = 15000;

/**
 * Polls the DOM for an element to appear.
 * Used after React Router navigation to wait for target elements.
 * Automatically extends timeout when loading skeletons are detected.
 *
 * @param selector - CSS selector for the element
 * @param timeout - Max wait time in ms (default 8000)
 * @returns Promise that resolves when element exists or rejects on timeout
 */
export async function waitForElement(selector: string, timeout = 8000): Promise<Element> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const element = document.querySelector(selector);

      if (element) {
        resolve(element);
        return;
      }

      // Check if still loading (skeleton visible) - extend timeout if so
      const isLoading = document.querySelector(LOADING_SELECTOR) !== null;
      const elapsed = Date.now() - startTime;
      const effectiveTimeout = isLoading ? Math.max(timeout, LOADING_EXTENDED_TIMEOUT) : timeout;

      if (elapsed >= effectiveTimeout) {
        reject(new Error(`Element "${selector}" not found within ${elapsed}ms`));
        return;
      }

      // Poll every 100ms
      requestAnimationFrame(check);
    };

    check();
  });
}

/**
 * Checks if an element exists in the DOM.
 * Used to validate tutorial steps before highlighting.
 *
 * @param selector - CSS selector for the element
 * @returns true if element exists
 */
export function elementExists(selector: string): boolean {
  return document.querySelector(selector) !== null;
}

/**
 * Filters steps to only include those with existing elements.
 * Handles edge case where React Admin conditionally renders components.
 *
 * @param steps - Array of tutorial steps
 * @returns Filtered steps with valid elements
 */
export function filterValidSteps(steps: TutorialStep[]): TutorialStep[] {
  return steps.filter((step) => {
    // Steps without elements (intro/outro) are always valid
    if (!step.element) return true;
    // Check if element exists in DOM
    return elementExists(step.element);
  });
}
