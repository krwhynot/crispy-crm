/**
 * formatters.ts - Unified text formatting utilities for list pages
 */
import type { Sale, Tag } from "../types";

export const EMPTY_PLACEHOLDER = "--";

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
