/**
 * listPatterns.ts - Common patterns for list page configuration
 */

export const COLUMN_VISIBILITY = {
  /** Hide on mobile (< 768px), show on tablet and up */
  hideMobile: {
    cellClassName: "hidden md:table-cell",
    headerClassName: "hidden md:table-cell",
  },
  /** Hide on mobile and tablet (< 1024px), show on desktop */
  hideTablet: {
    cellClassName: "hidden lg:table-cell",
    headerClassName: "hidden lg:table-cell",
  },
  /** Always visible */
  alwaysVisible: {
    cellClassName: "",
    headerClassName: "",
  },
} as const;

export const SORT_FIELDS = {
  contacts: ["first_name", "last_name", "last_seen"],
  organizations: ["name", "organization_type", "priority"],
  opportunities: ["created_at", "stage", "estimated_close_date"],
  activities: ["activity_date", "type"],
  tasks: ["due_date", "priority", "title"],
  sales: ["first_name", "last_name", "role"],
} as const;

export const DEFAULT_PER_PAGE = {
  default: 25,
  opportunities: 100,
  tasks: 100,
  activities: 50,
} as const;

export function getColumnVisibility(
  visibility: keyof typeof COLUMN_VISIBILITY
): { cellClassName: string; headerClassName: string } {
  return COLUMN_VISIBILITY[visibility];
}
