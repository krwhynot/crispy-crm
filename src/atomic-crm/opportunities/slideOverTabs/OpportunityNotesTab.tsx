import { RecordContextProvider } from "ra-core";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidepaneSection } from "@/components/layouts/sidepane";
import { NotesIterator } from "../../notes";
import { ActivityNoteForm } from "../ActivityNoteForm";
import { ActivitiesList } from "../ActivitiesList";
import type { Opportunity } from "../../types";

interface OpportunityNotesTabProps {
  record: Opportunity;
  mode: "view" | "edit";
}

/**
 * Notes & Activities tab for OpportunitySlideOver.
 *
 * Combines:
 * - Quick Add Activity form (ActivityNoteForm with SelectUI contact picker)
 * - Recent Activities list filtered by interaction type
 * - Notes section with create/edit/delete functionality
 *
 * Both view and edit modes allow activity and note creation.
 */
export function OpportunityNotesTab({ record, mode }: OpportunityNotesTabProps) {
  return (
    <RecordContextProvider value={record}>
      <ScrollArea className="h-full">
        <div className="px-6 py-4 space-y-6">
          {/* Quick Add Activity Section */}
          <SidepaneSection label="Quick Add Activity">
            <div className="p-4 border border-border rounded-lg bg-muted/50">
              <ActivityNoteForm opportunity={record} />
            </div>
          </SidepaneSection>

          {/* Recent Activities Section */}
          <SidepaneSection label="Recent Activities">
            <ReferenceManyField
              target="opportunity_id"
              reference="activities"
              filter={{ activity_type: "interaction" }}
              sort={{ field: "activity_date", order: "DESC" }}
            >
              <ActivitiesList />
            </ReferenceManyField>
          </SidepaneSection>

          {/* Notes Section */}
          <SidepaneSection label="Notes">
            {/* Notes list with create form - NotesIterator includes NoteCreate internally */}
            <ReferenceManyField
              target="opportunity_id"
              reference="opportunityNotes"
              sort={{ field: "created_at", order: "DESC" }}
            >
              <NotesIterator reference="opportunities" />
            </ReferenceManyField>
          </SidepaneSection>
        </div>
      </ScrollArea>
    </RecordContextProvider>
  );
}
