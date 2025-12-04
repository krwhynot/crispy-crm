import { parseISO, isValid } from 'date-fns';

/**
 * Safely parse an ISO date string with validation.
 *
 * Per ADR utilities-best-practices: Use parseISO() instead of new Date()
 * for ISO string parsing, and always validate with isValid().
 *
 * @example
 * ```ts
 * const date = parseDateSafely('2025-12-03T10:00:00Z');
 * if (date) {
 *   // date is guaranteed to be valid
 *   format(date, 'PP');
 * }
 * ```
 *
 * @param dateString - ISO 8601 date string to parse
 * @returns Valid Date object or null if invalid/empty
 */
export function parseDateSafely(dateString: string | null | undefined): Date | null {
  if (!dateString) {
    return null;
  }

  const date = parseISO(dateString);
  return isValid(date) ? date : null;
}

