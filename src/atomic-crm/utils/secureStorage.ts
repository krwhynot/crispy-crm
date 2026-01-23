/**
 * Secure storage utilities
 * Prefers sessionStorage (cleared on tab close) over localStorage
 *
 * Phase 1 Security Remediation - HIGH Priority
 *
 * Security Rationale:
 * - localStorage persists across browser sessions (privacy risk on shared devices)
 * - sessionStorage is cleared when browser tab closes (more secure)
 * - Filter preferences don't need to persist forever
 * - Reduces attack surface for XSS (session-only exposure)
 *
 * @module secureStorage
 */

import type { ZodSchema } from "zod";
import { logger } from "@/lib/logger";

export type StorageType = "session" | "local";

export interface StorageOptions<T = unknown> {
  /**
   * Preferred storage type
   * - 'session': Cleared when browser tab closes (more secure, recommended)
   * - 'local': Persists across sessions (convenience over security)
   */
  type?: StorageType;

  /**
   * Encrypt data before storing (future enhancement)
   * Currently not implemented, but structure supports it
   */
  encrypt?: boolean;

  /**
   * Optional Zod schema for runtime validation of parsed data
   * When provided, parsed JSON is validated against the schema
   * Invalid data returns null (fail-fast principle)
   */
  schema?: ZodSchema<T>;

  /**
   * Optional callback for error notification
   * Called when storage operations fail, allowing components to show user-facing errors
   *
   * @param error - The error that occurred
   * @param key - The storage key involved
   * @param operation - The type of operation that failed
   *
   * @example
   * // Components can handle storage errors:
   * const { getItem } = useSecureStorage({
   *   onError: (error, key, op) => notify(`Storage ${op} failed for ${key}`, { type: "error" })
   * });
   */
  onError?: (error: Error, key: string, operation: "read" | "write" | "remove") => void;
}

/**
 * Get item from storage
 * Tries sessionStorage first (more secure), falls back to localStorage for migration
 *
 * @param key - Storage key
 * @param options - Storage options (defaults to sessionStorage)
 * @returns Parsed value or null if not found
 *
 * @example
 * const stages = getStorageItem<string[]>('filter.opportunity_stages');
 * // Returns: ['new_lead', 'initial_outreach'] or null
 */
export function getStorageItem<T = unknown>(
  key: string,
  options: StorageOptions<T> = {}
): T | null {
  const storageType = options.type || "session";

  try {
    // Try preferred storage type first
    const storage = storageType === "session" ? sessionStorage : localStorage;
    const item = storage.getItem(key);

    if (item) {
      const parsed: unknown = JSON.parse(item);
      if (options.schema) {
        const result = options.schema.safeParse(parsed);
        if (!result.success) {
          const validationError = new Error(
            `Validation failed: ${JSON.stringify(result.error.flatten())}`
          );
          logger.error("Storage validation failed", validationError, {
            feature: "secureStorage",
            key,
            error: result.error.flatten(),
          });
          options.onError?.(validationError, key, "read");
          return null;
        }
        return result.data;
      }
      return parsed as T;
    }

    // Fallback to alternate storage if not found (migration path)
    const fallbackStorage = storageType === "session" ? localStorage : sessionStorage;
    const fallbackItem = fallbackStorage.getItem(key);

    if (fallbackItem) {
      // Migrate to preferred storage
      const parsed: unknown = JSON.parse(fallbackItem);
      if (options.schema) {
        const result = options.schema.safeParse(parsed);
        if (!result.success) {
          const validationError = new Error(
            `Validation failed: ${JSON.stringify(result.error.flatten())}`
          );
          logger.error("Storage fallback validation failed", validationError, {
            feature: "secureStorage",
            key,
            error: result.error.flatten(),
          });
          options.onError?.(validationError, key, "read");
          fallbackStorage.removeItem(key);
          return null;
        }
        setStorageItem(key, result.data, options);
        fallbackStorage.removeItem(key);
        return result.data;
      }
      setStorageItem(key, parsed as T, options);

      // Clean up old storage
      fallbackStorage.removeItem(key);

      return parsed as T;
    }
  } catch (error: unknown) {
    console.error(
      `[Storage] Error reading key "${key}":`,
      error instanceof Error ? error.message : String(error)
    );
    options.onError?.(error instanceof Error ? error : new Error(String(error)), key, "read");
  }

  return null;
}

/**
 * Set item in storage
 *
 * @param key - Storage key
 * @param value - Value to store (will be JSON.stringify'd)
 * @param options - Storage options (defaults to sessionStorage)
 * @returns true if successful, false otherwise
 *
 * @example
 * setStorageItem('filter.opportunity_stages', ['new_lead', 'initial_outreach']);
 * // Stores in sessionStorage, cleared on tab close
 */
export function setStorageItem<T = any>(
  key: string,
  value: T,
  options: StorageOptions = {}
): boolean {
  const storageType = options.type || "session";

  try {
    const storage = storageType === "session" ? sessionStorage : localStorage;
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error: unknown) {
    console.error(
      `[Storage] Error writing key "${key}":`,
      error instanceof Error ? error.message : String(error)
    );

    // Try fallback storage if preferred fails (quota exceeded, etc.)
    try {
      const fallbackStorage = storageType === "session" ? localStorage : sessionStorage;
      fallbackStorage.setItem(key, JSON.stringify(value));
      console.warn(`[Storage] Used fallback storage for key "${key}"`);
      return true;
    } catch (fallbackError: unknown) {
      console.error(
        `[Storage] Fallback storage also failed:`,
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      );
      options.onError?.(
        fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
        key,
        "write"
      );
      return false;
    }
  }
}

/**
 * Remove item from both storage types
 * Ensures complete cleanup regardless of where data was stored
 *
 * @param key - Storage key to remove
 * @param options - Storage options (only onError is used)
 *
 * @example
 * removeStorageItem('filter.opportunity_stages');
 * // Removes from both sessionStorage and localStorage
 */
export function removeStorageItem(key: string, options: StorageOptions = {}): void {
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch (error: unknown) {
    console.error(
      `[Storage] Error removing key "${key}":`,
      error instanceof Error ? error.message : String(error)
    );
    options.onError?.(error instanceof Error ? error : new Error(String(error)), key, "remove");
  }
}

/**
 * Clear all items with a given prefix
 * Useful for logging out or clearing feature-specific data
 *
 * @param prefix - Key prefix to match (e.g., 'filter.' clears all filter data)
 *
 * @example
 * clearStorageByPrefix('filter.');
 * // Clears: filter.opportunity_stages, filter.precedence, etc.
 */
export function clearStorageByPrefix(prefix: string): void {
  const clearFromStorage = (storage: Storage) => {
    const keysToRemove: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => storage.removeItem(key));
  };

  try {
    clearFromStorage(sessionStorage);
    clearFromStorage(localStorage);
  } catch (error: unknown) {
    console.error(
      `[Storage] Error clearing prefix "${prefix}":`,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Get all keys matching a prefix
 * Useful for debugging or data export
 *
 * @param prefix - Key prefix to match
 * @returns Array of matching keys from both storage types
 *
 * @example
 * const filterKeys = getKeysByPrefix('filter.');
 * // Returns: ['filter.opportunity_stages', 'filter.precedence']
 */
export function getKeysByPrefix(prefix: string): string[] {
  const keys: Set<string> = new Set();

  const collectKeys = (storage: Storage) => {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.add(key);
      }
    }
  };

  try {
    collectKeys(sessionStorage);
    collectKeys(localStorage);
  } catch (error: unknown) {
    console.error(
      `[Storage] Error getting keys for prefix "${prefix}":`,
      error instanceof Error ? error.message : String(error)
    );
  }

  return Array.from(keys);
}
