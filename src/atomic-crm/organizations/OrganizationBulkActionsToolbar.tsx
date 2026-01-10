import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { BulkExportButton } from "@/components/admin/bulk-export-button";
import { BulkReassignButton } from "@/components/admin/bulk-reassign-button";
import { OrganizationBulkDeleteButton } from "./OrganizationBulkDeleteButton";
import { organizationKeys } from "../queryKeys";
import type { Organization } from "../types";

/**
 * OrganizationBulkActionsToolbar - Custom bulk actions for the organizations list
 *
 * Extends the generic BulkActionsToolbar with organization-specific actions:
 * - Reassign: Bulk reassign organizations to a different sales rep
 * - Export: Export selected organizations to CSV
 * - Delete: Soft delete selected organizations (blocked for orgs with child branches)
 *
 * Uses the floating card pattern from the base BulkActionsToolbar
 * which appears at the bottom of the screen when items are selected.
 */
export const OrganizationBulkActionsToolbar = () => {
  return (
    <BulkActionsToolbar>
      <BulkReassignButton<Organization>
        resource="organizations"
        queryKeys={organizationKeys}
        itemDisplayName={(org) => org.name}
        itemSubtitle={(org) => org.organization_type}
      />
      <BulkExportButton />
      <OrganizationBulkDeleteButton />
    </BulkActionsToolbar>
  );
};

export default OrganizationBulkActionsToolbar;
