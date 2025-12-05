/**
 * Safely read a string from localStorage with validation.
 * Returns defaultValue if key doesn't exist, value is null, or access fails.
 *
 * @param key - localStorage key to read
 * @param defaultValue - fallback value (default: "")
 * @returns The stored string value or defaultValue
 */
export function getLocalStorageString(key: string, defaultValue = ""): string {
  try {
    const value = localStorage.getItem(key);
    return typeof value === "string" ? value : defaultValue;
  } catch {
    // localStorage access can fail in private browsing or when disabled
    return defaultValue;
  }
}

/**
 * Safely write a string to localStorage.
 * Fails silently if localStorage is unavailable.
 *
 * @param key - localStorage key to write
 * @param value - string value to store
 */
export function setLocalStorageString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Fail silently - localStorage may be unavailable
  }
}
