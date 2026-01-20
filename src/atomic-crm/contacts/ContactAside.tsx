import { Linkedin, Mail, Phone } from "lucide-react";
import { useRecordContext, WithRecord } from "ra-core";
import { AddTask } from "../tasks/AddTask";
import { TasksIterator } from "../tasks/TasksIterator";
import { TagsListEdit } from "./TagsListEdit";

import { ArrayField } from "@/components/ra-wrappers/array-field";
import { EditButton } from "@/components/ra-wrappers/edit-button";
import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { ReferenceManyField } from "@/components/ra-wrappers/reference-many-field";
import { ShowButton } from "@/components/ra-wrappers/show-button";
import { SingleFieldList } from "@/components/ra-wrappers/single-field-list";
import { TextField } from "@/components/ra-wrappers/text-field";
import { DateField } from "@/components/ra-wrappers/date-field";
import { EmailField } from "@/components/ra-wrappers/email-field";
import type { ReactNode } from "react";
import { AsideSection } from "@/components/ui";
import { SaleName } from "../sales/SaleName";
import type { Contact } from "../types";

export const ContactAside = ({ link = "edit" }: { link?: "edit" | "show" }) => {
  const record = useRecordContext<Contact>();
  if (!record) return null;
  return (
    <div className="hidden sm:block w-64 min-w-64 text-sm">
      <div className="mb-4 -ml-1">
        {link === "edit" ? (
          <EditButton label="Edit Contact" />
        ) : (
          <ShowButton label="Show Contact" />
        )}
      </div>

      <AsideSection title="Personal info">
        <ArrayField source="email">
          <SingleFieldList className="flex-col">
            <PersonalInfoRow
              icon={<Mail className="w-4 h-4 text-muted-foreground" />}
              primary={<EmailField source="email" />}
            />
          </SingleFieldList>
        </ArrayField>

        {record.linkedin_url && (
          <PersonalInfoRow
            icon={<Linkedin className="w-4 h-4 text-muted-foreground" />}
            primary={
              <a
                className="underline hover:no-underline text-sm text-muted-foreground"
                href={record.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                title={record.linkedin_url}
              >
                LinkedIn
              </a>
            }
          />
        )}
        <ArrayField source="phone">
          <SingleFieldList className="flex-col">
            <PersonalInfoRow
              icon={<Phone className="w-4 h-4 text-muted-foreground" />}
              primary={<TextField source="number" />}
              showType
            />
          </SingleFieldList>
        </ArrayField>
      </AsideSection>

      <AsideSection title="Position">
        <div className="flex flex-col gap-2 p-3 rounded-md bg-muted border-l-[3px] border-border">
          {record.organization_id && (
            <div className="text-lg font-bold text-foreground mb-1">
              <ReferenceField source="organization_id" reference="organizations">
                <TextField source="name" />
              </ReferenceField>
            </div>
          )}
          {record.department && (
            <div className="text-sm font-medium text-foreground leading-tight">
              <span className="text-sm text-muted-foreground">Dept: </span>
              {record.department}
            </div>
          )}
          {record.title && (
            <div className="text-sm text-muted-foreground leading-tight mt-0.5">
              <span>Title: </span>
              {record.title}
            </div>
          )}
        </div>
      </AsideSection>

      <AsideSection title="Contact info">
        <div className="text-muted-foreground">
          <span className="text-sm">Added on</span>{" "}
          <DateField
            source="first_seen"
            options={{ year: "numeric", month: "long", day: "numeric" }}
          />
        </div>

        <div className="text-muted-foreground">
          <span className="text-sm">Last activity on</span>{" "}
          <DateField
            source="last_seen"
            options={{ year: "numeric", month: "long", day: "numeric" }}
          />
        </div>

        <div className="text-muted-foreground">
          Followed by{" "}
          <ReferenceField source="sales_id" reference="sales">
            <SaleName />
          </ReferenceField>
        </div>
      </AsideSection>

      <AsideSection title="Tags">
        <TagsListEdit />
      </AsideSection>

      {record.notes && (
        <AsideSection title="Notes">
          <div className="text-sm text-foreground whitespace-pre-wrap bg-muted p-3 rounded-md border-l-[3px] border-border">
            {record.notes}
          </div>
        </AsideSection>
      )}

      <AsideSection title="Tasks">
        <ReferenceManyField
          target="contact_id"
          reference="tasks"
          sort={{ field: "due_date", order: "ASC" }}
        >
          <TasksIterator />
        </ReferenceManyField>
        <AddTask />
      </AsideSection>
    </div>
  );
};

const PersonalInfoRow = ({
  icon,
  primary,
  showType,
}: {
  icon: ReactNode;
  primary: ReactNode;
  showType?: boolean;
}) => (
  <div className="flex flex-row items-center gap-2 min-h-6">
    {icon}
    <div className="flex flex-wrap gap-x-2 gap-y-0">
      {primary}
      {showType ? (
        <WithRecord
          render={(row) =>
            row.type !== "Other" && <TextField source="type" className="text-muted-foreground" />
          }
        />
      ) : null}
    </div>
  </div>
);
