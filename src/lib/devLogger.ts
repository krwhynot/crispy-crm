/**
 * Development-only logging utilities.
 *
 * DEAD CODE ELIMINATION NOTES:
 * - Vite/esbuild will eliminate `if (import.meta.env.DEV)` blocks in production
 * - For simple logging, use devLog/devWarn/devError (argument eval is negligible)
 * - For expensive argument computation, use inline guards:
 *
 *   // GOOD - entire block eliminated in prod, including expensive call
 *   if (import.meta.env.DEV) {
 *     console.log('Result:', expensiveSerialize(data));
 *   }
 *
 *   // ACCEPTABLE - simple args, minimal prod overhead
 *   devLog('Context', 'message', simpleValue);
 *
 *   // BAD - expensiveSerialize runs in prod even though log is gated
 *   devLog('Context', 'message', expensiveSerialize(data));
 *
 * Usage:
 *   import { devLog, devWarn, devError, DEV } from '@/lib/devLogger';
 *
 *   // Simple logging
 *   devLog('MyComponent', 'loaded');
 *
 *   // With compile-time elimination for expensive args
 *   if (DEV) {
 *     console.log('[MyComponent]', 'data:', JSON.stringify(largeObject, null, 2));
 *   }
 */

/** Re-export for convenient inline guards */
export const DEV = import.meta.env.DEV;

/**
 * Development-only console.log wrapper.
 * Use for simple logging where argument evaluation cost is negligible.
 */
export function devLog(context: string, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.log(`[${context}]`, message, data !== undefined ? data : "");
  }
}

/**
 * Development-only console.warn wrapper.
 */
export function devWarn(context: string, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[${context}]`, message, data !== undefined ? data : "");
  }
}

/**
 * Development-only console.error wrapper.
 * Note: For actual error handling, use proper error boundaries/reporting.
 * This is only for debug output that should not appear in production.
 */
export function devError(context: string, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, message, data !== undefined ? data : "");
  }
}
