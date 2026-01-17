import { RecordContextProvider } from "ra-core";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotesIterator } from "../../notes";
import type { OrganizationWithHierarchy } from "../../types";

interface OrganizationNotesTabProps {
  record: OrganizationWithHierarchy;
  mode: "view" | "edit";
}

/**
 * Notes tab for OrganizationSlideOver.
 *
 * Wrapper around existing NotesIterator component.
 * Displays organization notes with create/edit/delete functionality.
 *
 * Both view and edit modes allow note creation and editing.
 */
export function OrganizationNotesTab({ record, mode: _mode }: OrganizationNotesTabProps) {
  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4 space-y-4">
          {/* Notes list with create form - NotesIterator includes NoteCreate internally */}
          <ReferenceManyField
            target="organization_id"
            reference="organization_notes"
            sort={{ field: "created_at", order: "DESC" }}
          >
            <NotesIterator reference="organizations" showEmptyState />
          </ReferenceManyField>
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}
