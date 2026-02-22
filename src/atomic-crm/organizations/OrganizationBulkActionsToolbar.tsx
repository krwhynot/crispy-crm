import { BulkExportButton } from "@/components/ra-wrappers/bulk-export-button";
import { BulkReassignButton } from "@/components/ra-wrappers/bulk-reassign-button";
import { OrganizationBulkDeleteButton } from "./OrganizationBulkDeleteButton";
import { organizationKeys } from "../queryKeys";
import type { Organization } from "../types";

/**
 * OrganizationBulkButtons - Bulk action buttons for the Organizations list
 *
 * Renders ONLY the action buttons (no toolbar wrapper).
 * ListPageLayout wraps these in the shared BulkActionsToolbar.
 *
 * Actions:
 * - Reassign: Bulk reassign organizations to a different sales rep
 * - Export: Export selected organizations to CSV
 * - Delete: Soft delete selected organizations (blocked for orgs with child branches)
 */
export const OrganizationBulkButtons = () => (
  <>
    <BulkReassignButton<Organization>
      resource="organizations"
      queryKeys={organizationKeys}
      itemDisplayName={(org) => org.name}
      itemSubtitle={(org) => org.organization_type}
    />
    <BulkExportButton />
    <OrganizationBulkDeleteButton />
  </>
);
