import { Linkedin, Mail, Phone } from "lucide-react";
import { useRecordContext, WithRecord } from "ra-core";
import { AddTask } from "../tasks/AddTask";
import { TasksIterator } from "../tasks/TasksIterator";
import { TagsListEdit } from "./TagsListEdit";

import { ArrayField } from "@/components/admin/array-field";
import { EditButton } from "@/components/admin/edit-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { ShowButton } from "@/components/admin/show-button";
import { SingleFieldList } from "@/components/admin/single-field-list";
import { TextField } from "@/components/admin/text-field";
import { DateField } from "@/components/admin/date-field";
import { EmailField } from "@/components/admin/email-field";
import type { ReactNode } from "react";
import { AsideSection } from "../misc/AsideSection";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { SaleName } from "../sales/SaleName";
import type { Contact } from "../types";

export const ContactAside = ({ link = "edit" }: { link?: "edit" | "show" }) => {
  const { contactGender } = useConfigurationContext();
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
              icon={<Mail className="w-4 h-4 text-[color:var(--text-subtle)]" />}
              primary={<EmailField source="email" />}
            />
          </SingleFieldList>
        </ArrayField>

        {record.linkedin_url && (
          <PersonalInfoRow
            icon={<Linkedin className="w-4 h-4 text-[color:var(--text-subtle)]" />}
            primary={
              <a
                className="underline hover:no-underline text-sm text-[color:var(--text-subtle)]"
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
              icon={<Phone className="w-4 h-4 text-[color:var(--text-subtle)]" />}
              primary={<TextField source="number" />}
              showType
            />
          </SingleFieldList>
        </ArrayField>
        {contactGender
          .map((genderOption) => {
            if (record.gender === genderOption.value) {
              return (
                <PersonalInfoRow
                  key={genderOption.value}
                  icon={
                    <genderOption.icon className="w-4 h-4 text-[color:var(--text-subtle)]" />
                  }
                  primary={<span>{genderOption.label}</span>}
                />
              );
            }
            return null;
          })
          .filter(Boolean)}
      </AsideSection>

      <AsideSection title="Position">
        <div className="flex flex-col gap-2 p-3 rounded-md bg-[color:var(--background-subtle)] border-l-[3px] border-[color:var(--border)]">
          {record.organization_id && (
            <div className="text-lg font-bold text-[color:var(--text)] mb-1">
              <ReferenceField source="organization_id" reference="organizations">
                <TextField source="name" />
              </ReferenceField>
            </div>
          )}
          {record.department && (
            <div className="text-[15px] font-medium text-[color:var(--text)] leading-tight">
              <span className="text-sm text-[color:var(--text-subtle)]">Dept: </span>
              {record.department}
            </div>
          )}
          {record.title && (
            <div className="text-sm text-[color:var(--text-subtle)] leading-tight mt-0.5">
              <span>Title: </span>
              {record.title}
            </div>
          )}
        </div>
      </AsideSection>

      <AsideSection title="Contact info">
        <div className="text-[color:var(--text-subtle)]">
          <span className="text-sm">Added on</span>{" "}
          <DateField
            source="first_seen"
            options={{ year: "numeric", month: "long", day: "numeric" }}
          />
        </div>

        <div className="text-[color:var(--text-subtle)]">
          <span className="text-sm">Last activity on</span>{" "}
          <DateField
            source="last_seen"
            options={{ year: "numeric", month: "long", day: "numeric" }}
          />
        </div>

        <div className="text-[color:var(--text-subtle)]">
          Followed by{" "}
          <ReferenceField source="sales_id" reference="sales">
            <SaleName />
          </ReferenceField>
        </div>
      </AsideSection>

      <AsideSection title="Tags">
        <TagsListEdit />
      </AsideSection>

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
            row.type !== "Other" && (
              <TextField source="type" className="text-[color:var(--text-subtle)]" />
            )
          }
        />
      ) : null}
    </div>
  </div>
);
