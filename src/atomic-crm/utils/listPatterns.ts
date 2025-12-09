/**
 * listPatterns.ts - Common patterns for list page configuration
 *
 * Design System: Desktop-first responsive (iPad 1024px as primary target)
 * @see docs/architecture/design-system.md
 */

/**
 * Semantic column visibility presets for responsive list pages.
 *
 * Usage:
 * ```tsx
 * <TextField source="email" {...COLUMN_VISIBILITY.desktopOnly} />
 * ```
 *
 * @property desktopOnly - Only visible on desktop (1024px+), hidden on tablet/mobile
 * @property tabletUp - Visible on tablet (768px+) and desktop, hidden on mobile only
 * @property alwaysVisible - Always visible on all screen sizes (use for critical columns)
 */
export const COLUMN_VISIBILITY = {
  /** Only visible on desktop (1024px+). Use for secondary information. */
  desktopOnly: {
    cellClassName: "hidden lg:table-cell",
    headerClassName: "hidden lg:table-cell",
  },
  /** Visible on tablet and desktop (768px+). Use for important but not critical columns. */
  tabletUp: {
    cellClassName: "hidden md:table-cell",
    headerClassName: "hidden md:table-cell",
  },
  /** Always visible on all screen sizes. Use for primary identifying columns (name, status). */
  alwaysVisible: {
    cellClassName: "",
    headerClassName: "",
  },
} as const;

/** @deprecated Use COLUMN_VISIBILITY.tabletUp instead */
export const hideMobile = COLUMN_VISIBILITY.tabletUp;
/** @deprecated Use COLUMN_VISIBILITY.desktopOnly instead */
export const hideTablet = COLUMN_VISIBILITY.desktopOnly;

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

/**
 * Helper function to get column visibility classes by semantic name.
 * Prefer direct object spread: `{...COLUMN_VISIBILITY.desktopOnly}` for better type inference.
 */
export function getColumnVisibility(visibility: keyof typeof COLUMN_VISIBILITY): {
  cellClassName: string;
  headerClassName: string;
} {
  return COLUMN_VISIBILITY[visibility];
}
