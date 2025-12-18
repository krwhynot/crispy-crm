/**
 * Contact List Column Configuration
 *
 * Defines column visibility settings for the ContactList DataTable.
 * Protected columns cannot be hidden by users.
 * Default visibility determines initial state (persisted to localStorage).
 */

export interface ColumnConfig {
  /** Field source path (must match DataTable.Col source) */
  source: string;
  /** Display label for column selector */
  label: string;
  /** If false, column cannot be hidden by user */
  hideable: boolean;
  /** Initial visibility state */
  defaultVisible: boolean;
}

/**
 * Column definitions for ContactList
 *
 * Order matters: defines the default column order in the selector.
 * Protected columns (hideable: false) are always visible regardless of user preference.
 */
export const CONTACT_COLUMNS: ColumnConfig[] = [
  // Protected columns - always visible (core identifiers)
  {
    source: "full_name",
    label: "Name",
    hideable: false,
    defaultVisible: true,
  },
  {
    source: "organization_id",
    label: "Organization",
    hideable: false,
    defaultVisible: true,
  },
  {
    source: "status",
    label: "Status",
    hideable: false,
    defaultVisible: true,
  },

  // Hideable columns - user can toggle visibility
  {
    source: "avatar",
    label: "Avatar",
    hideable: true,
    defaultVisible: true,
  },
  {
    source: "title",
    label: "Role",
    hideable: true,
    defaultVisible: true,
  },
  {
    source: "nb_notes",
    label: "Notes",
    hideable: true,
    defaultVisible: false, // Hidden by default (less critical info)
  },
  {
    source: "last_seen",
    label: "Last Activity",
    hideable: true,
    defaultVisible: false, // Hidden by default on smaller screens
  },
];

/**
 * Columns hidden by default
 * Used as DataTable's defaultHiddenColumns prop
 */
export const CONTACT_HIDDEN_COLUMNS = CONTACT_COLUMNS.filter(
  (col) => !col.defaultVisible
).map((col) => col.source);

/**
 * Columns that cannot be hidden
 * Used to disable checkboxes in ColumnsButton
 */
export const CONTACT_PROTECTED_COLUMNS = CONTACT_COLUMNS.filter(
  (col) => !col.hideable
).map((col) => col.source);

/**
 * Storage key for column visibility preferences
 * Must be unique per resource to avoid conflicts
 */
export const CONTACT_COLUMNS_STORE_KEY = "contacts.datatable";
