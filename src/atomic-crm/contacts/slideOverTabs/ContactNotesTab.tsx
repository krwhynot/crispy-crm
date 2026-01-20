import { RecordContextProvider } from "ra-core";
import { ReferenceManyField } from "@/components/ra-wrappers/reference-many-field";
import { NotesIterator } from "../../notes";
import type { Contact } from "@/atomic-crm/validation/contacts/contacts-core";

interface ContactNotesTabProps {
  record: Contact;
  mode: "view" | "edit";
}

/**
 * Notes tab for ContactSlideOver.
 *
 * Wrapper around existing NotesIterator component from ContactShow.
 * Displays contact notes with create/edit/delete functionality.
 *
 * Both view and edit modes allow note creation and editing.
 *
 * Note: We don't use ReferenceManyField's `empty` prop because it would
 * hide the NoteCreate form when there are no notes. Instead, NotesIterator
 * handles the empty state internally while always showing the create form.
 */
export function ContactNotesTab({ record, mode: _mode }: ContactNotesTabProps) {
  return (
    <RecordContextProvider value={record}>
      <div className="space-y-4" data-tutorial="contact-notes-section">
        <ReferenceManyField
          target="contact_id"
          reference="contact_notes"
          sort={{ field: "created_at", order: "DESC" }}
          empty={false}
        >
          <NotesIterator reference="contacts" showEmptyState />
        </ReferenceManyField>
      </div>
    </RecordContextProvider>
  );
}
