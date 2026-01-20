import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { TextField } from "@/components/ra-wrappers/text-field";
import { useRecordContext } from "ra-core";
import { Avatar } from "../contacts/Avatar";
import { RelativeDate } from "@/components/ui";
import { SaleName } from "../sales/SaleName";
import type { ActivityContactNoteCreated, Contact } from "../types";
import { useActivityLogContext } from "./ActivityLogContext";
import { ActivityLogNote } from "./ActivityLogNote";

interface ActivityLogContactNoteCreatedProps {
  activity: ActivityContactNoteCreated;
}

function ContactAvatar() {
  const record = useRecordContext<Contact>();
  return <Avatar width={20} height={20} record={record} />;
}

export function ActivityLogContactNoteCreated({ activity }: ActivityLogContactNoteCreatedProps) {
  const context = useActivityLogContext();
  const { contactNote } = activity;
  return (
    <ActivityLogNote
      header={
        <div className="flex items-center gap-2 w-full">
          <ReferenceField source="contact_id" reference="contacts" record={activity.contactNote}>
            <ContactAvatar />
          </ReferenceField>

          <div className="flex flex-row flex-grow">
            <div className="text-sm text-muted-foreground flex-grow">
              <ReferenceField source="sales_id" reference="sales" record={activity}>
                <SaleName />
              </ReferenceField>{" "}
              added a note about{" "}
              <ReferenceField
                source="contact_id"
                reference="contacts"
                record={activity.contactNote}
              >
                <TextField source="first_name" /> <TextField source="last_name" />
              </ReferenceField>
            </div>

            {context === "company" && (
              <span className="text-muted-foreground text-sm">
                <RelativeDate date={activity.date} />
              </span>
            )}
          </div>
        </div>
      }
      text={contactNote.text}
    />
  );
}
