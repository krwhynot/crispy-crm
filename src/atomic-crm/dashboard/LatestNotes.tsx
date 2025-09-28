import { Card, CardContent } from "@/components/ui/card";
import { formatDistance } from "date-fns";
import { FileText } from "lucide-react";
import { useGetIdentity, useGetList } from "ra-core";

import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import type { Contact, ContactNote, OpportunityNote } from "../types";

export const LatestNotes = () => {
  const { identity } = useGetIdentity();
  const { data: contactNotesData, isPending: contactNotesLoading } = useGetList(
    "contactNotes",
    {
      pagination: { page: 1, perPage: 5 },
      sort: { field: "date", order: "DESC" },
      filter: { sales_id: identity?.id },
    },
    { enabled: Number.isInteger(identity?.id) },
  );
  const { data: opportunityNotesData, isPending: opportunityNotesLoading } =
    useGetList(
      "opportunityNotes",
      {
        pagination: { page: 1, perPage: 5 },
        sort: { field: "date", order: "DESC" },
        filter: { sales_id: identity?.id },
      },
      { enabled: Number.isInteger(identity?.id) },
    );
  if (contactNotesLoading || opportunityNotesLoading) {
    return null;
  }
  // TypeScript guards
  if (!contactNotesData || !opportunityNotesData) {
    return null;
  }

  const allNotes = ([] as any[])
    .concat(
      contactNotesData.map((note) => ({
        ...note,
        type: "contactNote",
      })),
      opportunityNotesData.map((note) => ({
        ...note,
        type: "opportunityNote",
      })),
    )
    .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf())
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="ml-8 mr-8 flex">
          <FileText className="text-muted-foreground w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-muted-foreground">
          My Latest Notes
        </h2>
      </div>
      <Card>
        <CardContent>
          {allNotes.map((note) => (
            <div
              id={`${note.type}_${note.id}`}
              key={`${note.type}_${note.id}`}
              className="mb-8"
            >
              <div className="text-sm text-muted-foreground">
                on{" "}
                {note.type === "opportunityNote" ? (
                  <Opportunity note={note} />
                ) : (
                  <Contact note={note} />
                )}
                , added{" "}
                {formatDistance(note.date, new Date(), {
                  addSuffix: true,
                })}
              </div>
              <div>
                <p className="text-sm line-clamp-3 overflow-hidden">
                  {note.text}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const Opportunity = ({ note }: any) => (
  <>
    Opportunity{" "}
    <ReferenceField
      record={note}
      source="opportunity_id"
      reference="opportunities"
      link="show"
    >
      <TextField source="name" />
    </ReferenceField>
  </>
);

const Contact = ({ note }: any) => (
  <>
    Contact{" "}
    <ReferenceField<ContactNote, Contact>
      record={note}
      source="contact_id"
      reference="contacts"
      link="show"
    />
  </>
);
