import type { BaseFieldProps } from "ra-core";
import type { ReactNode } from "react";

/**
 * Extended field props that include Datagrid column configuration.
 *
 * These props are passed by Datagrid/PremiumDatagrid to their child field components.
 * The field components destructure and filter them out before rendering to DOM elements.
 */
export interface FieldProps<RecordType extends Record<string, any> = Record<string, any>>
  extends Omit<BaseFieldProps<RecordType>, "resource"> {
  /**
   * The component to display when the field value is empty. Defaults to empty string.
   */
  empty?: ReactNode;

  // Datagrid column props - passed by Datagrid, filtered by field components
  /** Column header label */
  label?: ReactNode;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Field to sort by (if different from source) */
  sortBy?: string;
  /** Text alignment for the column */
  textAlign?: "left" | "center" | "right";
  /** CSS class for the cell */
  cellClassName?: string;
  /** CSS class for the header */
  headerClassName?: string;
  /** CSS class for the row */
  rowClassName?: string;
  /** Resource name (from context) */
  resource?: string;
  /** Default value when field value is undefined */
  defaultValue?: unknown;
}
