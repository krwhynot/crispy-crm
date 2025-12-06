import type { TutorialStep } from './types';

/**
 * Polls the DOM for an element to appear.
 * Used after React Router navigation to wait for target elements.
 *
 * @param selector - CSS selector for the element
 * @param timeout - Max wait time in ms (default 5000)
 * @returns Promise that resolves when element exists or rejects on timeout
 */
export async function waitForElement(
  selector: string,
  timeout = 5000
): Promise<Element> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const element = document.querySelector(selector);

      if (element) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime >= timeout) {
        reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
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
