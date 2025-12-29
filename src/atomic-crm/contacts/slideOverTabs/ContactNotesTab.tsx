import { RecordContextProvider } from "ra-core";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { NotesIterator } from "../../notes";
import type { Contact } from "../types";

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
export function ContactNotesTab({ record, mode }: ContactNotesTabProps) {
  return (
    <RecordContextProvider value={record}>
      <div className="space-y-4" data-tutorial="contact-notes-section">
        {/* Notes list with create form - NotesIterator includes NoteCreate internally */}
        <ReferenceManyField
          target="contact_id"
          reference="contactNotes"
          sort={{ field: "created_at", order: "DESC" }}
        >
          <NotesIterator reference="contacts" />
        </ReferenceManyField>

        {/* Helper text for empty state */}
        <div className="text-sm text-muted-foreground text-center py-4">
          {mode === "view"
            ? "Notes are visible to all team members"
            : "Add notes to track important information about this contact"}
        </div>
      </div>
    </RecordContextProvider>
  );
}
