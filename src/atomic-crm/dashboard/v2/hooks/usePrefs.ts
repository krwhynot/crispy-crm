import { useStore } from "react-admin";

/**
 * Type-safe wrapper around React Admin's useStore for localStorage persistence.
 * Prefixes keys with 'pd.' (principal dashboard) for namespacing.
 *
 * @param key - Preference key (will be prefixed with 'pd.')
 * @param defaultValue - Default value if key doesn't exist
 * @returns Tuple of [value, setValue] similar to useState
 *
 * @example
 * const [widths, setWidths] = usePrefs<number[]>('colWidths', [40, 30, 30]);
 * const [grouping, setGrouping] = usePrefs<TaskGrouping>('taskGrouping', 'due');
 */
export function usePrefs<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const prefixedKey = `pd.${key}`;
  const [storedValue, setStoredValue] = useStore<T>(prefixedKey, defaultValue);

  // If storedValue is undefined, return defaultValue
  const value = storedValue ?? defaultValue;

  return [value, setStoredValue];
}
