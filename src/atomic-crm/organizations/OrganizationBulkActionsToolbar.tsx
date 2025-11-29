import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { BulkExportButton } from "@/components/admin/bulk-export-button";
import { BulkDeleteButton } from "@/components/admin/bulk-delete-button";
import { BulkReassignButton } from "./BulkReassignButton";

/**
 * OrganizationBulkActionsToolbar - Custom bulk actions for the organizations list
 *
 * Extends the generic BulkActionsToolbar with organization-specific actions:
 * - Reassign: Bulk reassign organizations to a different sales rep
 * - Export: Export selected organizations to CSV
 * - Delete: Soft delete selected organizations
 *
 * Uses the floating card pattern from the base BulkActionsToolbar
 * which appears at the bottom of the screen when items are selected.
 */
export const OrganizationBulkActionsToolbar = () => {
  return (
    <BulkActionsToolbar>
      <BulkReassignButton />
      <BulkExportButton />
      <BulkDeleteButton />
    </BulkActionsToolbar>
  );
};

export default OrganizationBulkActionsToolbar;
