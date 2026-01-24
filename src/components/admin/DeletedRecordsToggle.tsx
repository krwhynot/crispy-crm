/**
 * Deleted Records Toggle Component
 *
 * Batch 3, Q14: Admin-only toggle to show/hide soft-deleted records in list views
 *
 * Features:
 * - Only visible to admin users
 * - Toggles `includeDeleted` filter parameter
 * - Data provider respects this flag to bypass deleted_at@is:null filter
 *
 * Usage:
 * ```tsx
 * import { DeletedRecordsToggle } from '@/components/admin/DeletedRecordsToggle';
 *
 * export const ContactList = () => (
 *   <List actions={<ListActions><DeletedRecordsToggle /></ListActions>}>
 *     <Datagrid>...</Datagrid>
 *   </List>
 * );
 * ```
 */

import { FormControlLabel, Switch } from '@mui/material';
import { useListContext } from 'react-admin';
import { useUserRole } from '@/hooks/useUserRole';

export const DeletedRecordsToggle = () => {
  const { filterValues, setFilters } = useListContext();
  const { isAdmin } = useUserRole();

  // Only show to admins (security: RLS still enforces admin role requirement)
  if (!isAdmin) return null;

  const includeDeleted = filterValues?.includeDeleted || false;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filterValues,
      includeDeleted: event.target.checked,
    }, {}, false); // false = don't debounce
  };

  return (
    <FormControlLabel
      control={
        <Switch
          checked={includeDeleted}
          onChange={handleChange}
          color="warning" // Warning color indicates non-standard view
          size="small"
        />
      }
      label="Show Deleted"
      className="ml-4"
    />
  );
};
