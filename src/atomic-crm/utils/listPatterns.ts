/**
 * listPatterns.ts - Common patterns for list page configuration
 */

/**
 * Canonical column visibility presets for iPad-first list pages.
 *
 * Breakpoint map:
 * - always: all viewports
 * - tabletUp: >=768px (md)
 * - ipadPlus: >=1024px (lg)
 * - desktopPlus: >=1280px (xl)
 */
const BASE_COLUMN_VISIBILITY = {
  always: {
    cellClassName: "",
    headerClassName: "",
  },
  tabletUp: {
    cellClassName: "!hidden md:!table-cell",
    headerClassName: "!hidden md:!table-cell",
  },
  ipadPlus: {
    cellClassName: "!hidden lg:!table-cell",
    headerClassName: "!hidden lg:!table-cell",
  },
  desktopPlus: {
    cellClassName: "!hidden xl:!table-cell",
    headerClassName: "!hidden xl:!table-cell",
  },
} as const;

/**
 * Semantic column visibility presets with deprecated aliases for migration safety.
 */
export const COLUMN_VISIBILITY = {
  ...BASE_COLUMN_VISIBILITY,

  /** @deprecated Use COLUMN_VISIBILITY.always */
  alwaysVisible: BASE_COLUMN_VISIBILITY.always,
  /** @deprecated Use COLUMN_VISIBILITY.ipadPlus */
  desktopOnly: BASE_COLUMN_VISIBILITY.ipadPlus,
  /** @deprecated Use COLUMN_VISIBILITY.desktopPlus */
  largeDesktopOnly: BASE_COLUMN_VISIBILITY.desktopPlus,
} as const;

/** @deprecated Use COLUMN_VISIBILITY.tabletUp instead */
export const hideMobile = COLUMN_VISIBILITY.tabletUp;
/** @deprecated Use COLUMN_VISIBILITY.ipadPlus instead */
export const hideTablet = COLUMN_VISIBILITY.ipadPlus;

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

export function getColumnVisibility(visibility: keyof typeof COLUMN_VISIBILITY): {
  cellClassName: string;
  headerClassName: string;
} {
  return COLUMN_VISIBILITY[visibility];
}
