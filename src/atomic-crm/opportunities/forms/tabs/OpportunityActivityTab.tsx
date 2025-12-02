import { useRecordContext } from "react-admin";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { Separator } from "@/components/ui/separator";
import { ActivityNoteForm } from "../../ActivityNoteForm";
import { NotesIterator } from "../../../notes";
import type { Opportunity } from "../../types";

export const OpportunityActivityTab = () => {
  const record = useRecordContext<Opportunity>();

  if (!record) return null;

  return (
    <div className="space-y-6">
      <ActivityNoteForm opportunity={record} />
      <Separator />
      <ReferenceManyField
        target="opportunity_id"
        reference="opportunityNotes"
        sort={{ field: "created_at", order: "DESC" }}
      >
        <NotesIterator reference="opportunities" />
      </ReferenceManyField>
    </div>
  );
};
