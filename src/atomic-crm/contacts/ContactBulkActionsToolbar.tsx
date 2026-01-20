import { BulkActionsToolbar } from "@/components/ra-wrappers/bulk-actions-toolbar";
import { BulkExportButton } from "@/components/ra-wrappers/bulk-export-button";
import { BulkDeleteButton } from "@/components/ra-wrappers/bulk-delete-button";
import { BulkReassignButton } from "@/components/ra-wrappers/bulk-reassign-button";
import { contactKeys } from "../queryKeys";
import { formatName } from "@/atomic-crm/utils/formatName";
import type { Contact } from "../types";

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
      <BulkReassignButton<Contact>
        resource="contacts"
        queryKeys={contactKeys}
        itemDisplayName={(contact) => formatName(contact.first_name, contact.last_name)}
        itemSubtitle={(contact) => contact.title || "No title"}
      />
      <BulkExportButton />
      <BulkDeleteButton />
    </BulkActionsToolbar>
  );
};

export default ContactBulkActionsToolbar;
