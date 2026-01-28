import { useCallback } from "react";
import type { DatagridProps } from "react-admin";
import { Datagrid, DatagridConfigurable, useListContext } from "react-admin";
import { cn } from "@/lib/utils";

/**
 * PremiumDatagrid - Enhanced Datagrid wrapper with premium hover effects
 *
 * A thin wrapper around React Admin's Datagrid component that applies premium
 * table row styling and optionally customizes row click behavior.
 *
 * @example
 * ```tsx
 * <PremiumDatagrid onRowClick={(id) => openSlideOver(id)}>
 *   <TextField source="name" />
 *   <TextField source="email" />
 * </PremiumDatagrid>
 * ```
 *
 * Features:
 * - Automatic premium hover effects (border reveal, shadow, lift animation)
 * - Custom row click handling (e.g., open slide-over instead of navigation)
 * - Keyboard navigation support with visual focus indicator
 * - Full compatibility with all React Admin Datagrid features
 * - Sorting, filtering, bulk actions, and pagination work out of the box
 *
 * @see {@link https://marmelab.com/react-admin/Datagrid.html} React Admin Datagrid docs
 */
export interface PremiumDatagridProps extends DatagridProps {
  /**
   * Custom row click handler.
   * When provided, overrides the default rowClick behavior.
   * Return value is ignored - use this for side effects like opening slide-overs.
   *
   * @param id - The record ID (number or string)
   * @returns void
   */
  onRowClick?: (id: number | string) => void;

  /**
   * Index of the row that should show keyboard focus styling.
   * Use with useListKeyboardNavigation hook for arrow key navigation.
   * Pass -1 or undefined to disable focus styling.
   */
  focusedIndex?: number;

  /**
   * Enable column visibility controls via DatagridConfigurable.
   * When true, renders DatagridConfigurable instead of Datagrid,
   * allowing users to show/hide columns via SelectColumnsButton.
   *
   * @default false
   */
  configurable?: boolean;

  /**
   * Storage key for persisting column visibility preferences.
   * Required when configurable=true.
   * Stored in localStorage as "RaStore.preferences.{preferenceKey}.columns"
   *
   * @example "organizations.datagrid"
   */
  preferenceKey?: string;
}

/**
 * PremiumDatagrid Component
 *
 * Wraps React Admin's Datagrid with premium styling and custom row click handling.
 * All Datagrid props are passed through, ensuring full feature compatibility.
 */
export function PremiumDatagrid({
  onRowClick,
  focusedIndex,
  configurable = false,
  preferenceKey,
  rowClassName: externalRowClassName,
  ...props
}: PremiumDatagridProps) {
  const { data } = useListContext();

  // Stable row click handler using useCallback to prevent infinite re-renders
  // Only wraps onRowClick - props.rowClick is passed directly when onRowClick is not provided
  const handleRowClick = useCallback(
    (id: string | number) => {
      onRowClick?.(id);
      return false; // Prevent default navigation
    },
    [onRowClick]
  );

  // Generate row className with keyboard focus indicator
  // React Admin's rowClassName receives (record, index) as arguments
  const getRowClassName = useCallback(
    (record: unknown, index: number) => {
      const isFocused = focusedIndex !== undefined && focusedIndex >= 0 && index === focusedIndex;

      // Compute external className if it's a function
      const externalClassName =
        typeof externalRowClassName === "function"
          ? externalRowClassName(record, index)
          : externalRowClassName;

      return cn(
        "table-row-premium",
        isFocused && "ring-2 ring-primary ring-inset bg-primary/5",
        externalClassName // Merge external styles
      );
    },
    [focusedIndex, externalRowClassName]
  );

  // Scroll focused row into view
  // This effect ensures keyboard-navigated rows are visible
  const scrollFocusedRowIntoView = useCallback(() => {
    if (focusedIndex === undefined || focusedIndex < 0 || !data) return;

    // Find the table row by index (0-based, excluding header)
    const tableBody = document.querySelector(".RaDatagrid-tableWrapper tbody");
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll("tr");
    const focusedRow = rows[focusedIndex] as HTMLElement | undefined;
    if (focusedRow) {
      focusedRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focusedIndex, data]);

  // Trigger scroll when focused index changes
  // Using setTimeout to ensure DOM has updated
  if (focusedIndex !== undefined && focusedIndex >= 0) {
    setTimeout(scrollFocusedRowIntoView, 0);
  }

  // Conditionally use DatagridConfigurable when column visibility is enabled
  const DatagridComponent = configurable ? DatagridConfigurable : Datagrid;

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <DatagridComponent
        {...props}
        {...(configurable && preferenceKey ? { preferenceKey } : {})}
        rowClassName={getRowClassName}
        rowClick={onRowClick ? handleRowClick : props.rowClick}
      />
    </div>
  );
}
