import { useRecordContext } from "react-admin";
import { ReferenceManyField } from "@/components/ra-wrappers/reference-many-field";
import { Separator } from "@/components/ui/separator";
import { ActivityNoteForm } from "../ActivityNoteForm";
import { NotesIterator } from "../../notes";
import type { Opportunity } from "../types";

export const OpportunityActivitySection = () => {
  const record = useRecordContext<Opportunity>();

  if (!record) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Activity History</h3>
      <ActivityNoteForm opportunity={record} />
      <Separator />
      <ReferenceManyField
        target="opportunity_id"
        reference="opportunity_notes"
        sort={{ field: "created_at", order: "DESC" }}
      >
        <NotesIterator reference="opportunities" />
      </ReferenceManyField>
    </div>
  );
};
