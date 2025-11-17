import { Datagrid, DatagridProps } from 'react-admin';

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
}

/**
 * PremiumDatagrid Component
 *
 * Wraps React Admin's Datagrid with premium styling and custom row click handling.
 * All Datagrid props are passed through, ensuring full feature compatibility.
 */
export function PremiumDatagrid({ onRowClick, ...props }: PremiumDatagridProps) {
  return (
    <Datagrid
      {...props}
      rowClassName={() => "table-row-premium"}
      rowClick={
        onRowClick
          ? (id) => {
              onRowClick(id);
              return false; // Prevent default navigation
            }
          : props.rowClick
      }
    />
  );
}
