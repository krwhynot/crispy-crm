import { BulkExportButton } from "@/components/ra-wrappers/bulk-export-button";
import { BulkDeleteButton } from "@/components/ra-wrappers/bulk-delete-button";
import { BulkReassignButton } from "@/components/ra-wrappers/bulk-reassign-button";
import { contactKeys } from "../queryKeys";
import { formatName } from "@/atomic-crm/utils/formatName";
import type { Contact } from "../types";

/**
 * ContactBulkButtons - Bulk action buttons for the Contacts list
 *
 * Renders ONLY the action buttons (no toolbar wrapper).
 * UnifiedListPageLayout wraps these in the shared BulkActionsToolbar.
 *
 * Actions:
 * - Reassign: Bulk reassign contacts to a different sales rep
 * - Export: Export selected contacts
 * - Delete: Soft-delete selected contacts
 */
export const ContactBulkButtons = () => (
  <>
    <BulkReassignButton<Contact>
      resource="contacts"
      queryKeys={contactKeys}
      itemDisplayName={(contact) => formatName(contact.first_name, contact.last_name)}
      itemSubtitle={(contact) => contact.title || "No title"}
    />
    <BulkExportButton />
    <BulkDeleteButton />
  </>
);
