import { format, isValid, parseISO } from "date-fns";

/**
 * Centralized date formatting utility
 *
 * Replaces 5 duplicate implementations:
 * - SidepaneMetadata.tsx (toLocaleDateString)
 * - text-input.tsx (YYYY-MM-DD for inputs)
 * - OpportunityDetailsViewSection.tsx (MMM d, yyyy)
 * - notes.ts (formatDateForInput)
 * - dateFilterLabels.ts (formatDateValue)
 */

export type DateInput = Date | string | null | undefined;

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
export function formatDateDisplay(date: DateInput): string {
  if (!date) return "";

  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return String(date);

  return format(parsed, "MMM d, yyyy");
}

/**
 * Format date for HTML date input (YYYY-MM-DD)
 */
export function formatDateForInput(date: DateInput): string {
  if (!date) return "";

  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "";

  return format(parsed, "yyyy-MM-dd");
}

/**
 * Format date with locale (for metadata displays)
 *
 * NOTE: Defaults to "en-US" locale for consistency with existing implementations.
 * If i18n support is added in the future, this should be refactored to:
 * - Accept locale as parameter, OR
 * - Read from app-wide i18n context/config
 */
export function formatDateLocale(
  date: DateInput,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
  locale: string = "en-US"
): string {
  if (!date) return "";

  const parsed = typeof date === "string" ? new Date(date) : date;
  if (!isValid(parsed)) return String(date);

  return parsed.toLocaleDateString(locale, options);
}
