/**
 * formatters.ts - Unified text formatting utilities for list pages
 */
import type { Sale, Tag } from "../types";

export const EMPTY_PLACEHOLDER = "--";

/**
 * Standard name formatting: trims and joins first/last name parts.
 * Does NOT sanitize literal "null" strings from CSV imports.
 *
 * Distinct from {@link formatName} in `formatName.ts` which additionally
 * sanitizes literal "null" strings stored in the database from CSV imports.
 * Use `formatName` when data may originate from imports or legacy records.
 * Use this function for display-only contexts with clean (validated) data.
 */
export function formatFullName(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim();
  const last = lastName?.trim();

  if (!first && !last) return EMPTY_PLACEHOLDER;
  if (first && last) return `${first} ${last}`;
  return first || last || EMPTY_PLACEHOLDER;
}

export function formatRoleAndDept(title?: string | null, department?: string | null): string {
  const titleTrimmed = title?.trim();
  const deptTrimmed = department?.trim();

  if (!titleTrimmed && !deptTrimmed) return EMPTY_PLACEHOLDER;
  if (!titleTrimmed) return deptTrimmed!;
  if (!deptTrimmed) return titleTrimmed;
  return `${titleTrimmed}, ${deptTrimmed}`;
}

export function formatSalesName(sales?: Pick<Sale, "first_name" | "last_name"> | null): string {
  if (!sales) return "";
  return formatFullName(sales.first_name, sales.last_name);
}

export function formatTagsForExport(
  tagIds: (number | string)[] | undefined,
  tagsMap: Record<number | string, Pick<Tag, "name">>
): string {
  if (!tagIds || tagIds.length === 0) return "";
  return tagIds
    .map((id) => tagsMap[id]?.name)
    .filter(Boolean)
    .join(", ");
}

export function formatCount(count?: number | null): number {
  return count ?? 0;
}

/**
 * Capitalizes the first character of a string.
 * Used primarily for formatting relative time strings.
 */
export function ucFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts snake_case field names to Title Case labels.
 * Example: "first_name" → "First Name"
 */
export function formatFieldLabel(fieldName: string): string {
  if (!fieldName) return "";
  return fieldName.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Generates initials from first and last name.
 * Example: ("John", "Doe") → "JD"
 * Handles null/undefined gracefully, returns "?" if both empty.
 */
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim().charAt(0)?.toUpperCase() || "";
  const last = lastName?.trim().charAt(0)?.toUpperCase() || "";
  return first + last || "?";
}

/**
 * Formats a number as currency using Intl.NumberFormat.
 * Defaults to USD with no decimal places.
 */
export function formatCurrency(
  amount: number | null | undefined,
  options?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (amount == null || isNaN(amount)) return EMPTY_PLACEHOLDER;

  const {
    currency = "USD",
    locale = "en-US",
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options ?? {};

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}
