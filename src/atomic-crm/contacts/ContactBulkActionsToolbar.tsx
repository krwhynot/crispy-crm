import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { BulkExportButton } from "@/components/admin/bulk-export-button";
import { BulkDeleteButton } from "@/components/admin/bulk-delete-button";
import { ContactBulkReassignButton } from "./ContactBulkReassignButton";

/**
 * ContactBulkActionsToolbar - Custom bulk actions for the Contacts list
 *
 * Extends the base BulkActionsToolbar with:
 * - Reassign: Bulk reassign contacts to a different sales rep
 * - Export: Export selected contacts
 * - Delete: Soft-delete selected contacts
 *
 * Pattern follows organizations/OrganizationBulkActionsToolbar.tsx
 */
export const ContactBulkActionsToolbar = () => {
  return (
    <BulkActionsToolbar>
      <ContactBulkReassignButton />
      <BulkExportButton />
      <BulkDeleteButton />
    </BulkActionsToolbar>
  );
};

export default ContactBulkActionsToolbar;
