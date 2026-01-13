import { RecordContextProvider } from "ra-core";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { NotesIterator } from "../../notes";
import { SidepaneEmptyState } from "@/components/layouts/sidepane/SidepaneEmptyState";
import { EMPTY_STATE_CONTENT } from "@/components/layouts/sidepane/empty-state-content";
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
 */
export function ContactNotesTab({ record, mode: _mode }: ContactNotesTabProps) {
  return (
    <RecordContextProvider value={record}>
      <div className="space-y-4" data-tutorial="contact-notes-section">
        <ReferenceManyField
          target="contact_id"
          reference="contact_notes"
          sort={{ field: "created_at", order: "DESC" }}
          empty={
            <SidepaneEmptyState
              title={EMPTY_STATE_CONTENT.notes.title}
              description={EMPTY_STATE_CONTENT.notes.description}
            />
          }
        >
          <NotesIterator reference="contacts" />
        </ReferenceManyField>
      </div>
    </RecordContextProvider>
  );
}
