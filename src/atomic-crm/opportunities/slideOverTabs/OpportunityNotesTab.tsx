import { RecordContextProvider } from "ra-core";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { NotesIterator } from "../../notes";
import type { Opportunity } from "../../types";

interface OpportunityNotesTabProps {
  record: Opportunity;
  mode: "view" | "edit";
}

/**
 * Notes tab for OpportunitySlideOver.
 *
 * Wrapper around existing NotesIterator component.
 * Displays opportunity notes with create/edit/delete functionality.
 *
 * Both view and edit modes allow note creation and editing.
 */
export function OpportunityNotesTab({ record, mode }: OpportunityNotesTabProps) {
  return (
    <RecordContextProvider value={record}>
      <div className="space-y-4">
        {/* Notes list with create form - NotesIterator includes NoteCreate internally */}
        <ReferenceManyField
          target="opportunity_id"
          reference="opportunityNotes"
          sort={{ field: "created_at", order: "DESC" }}
        >
          <NotesIterator reference="opportunities" />
        </ReferenceManyField>

        {/* Helper text for empty state */}
        <div className="text-sm text-muted-foreground text-center py-4">
          {mode === "view"
            ? "Notes are visible to all team members"
            : "Add notes to track important information about this opportunity"}
        </div>
      </div>
    </RecordContextProvider>
  );
}
