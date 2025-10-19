import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { TextField } from "@/components/admin/text-field";
import { Card, CardContent } from "@/components/ui/card";
import { ShowBase, useShowContext } from "ra-core";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import { NoteCreate, NotesIterator } from "../notes";
import type { Contact } from "../types";
import { Avatar } from "./Avatar";
import { ContactAside } from "./ContactAside";

export const ContactShow = () => (
  <ShowBase>
    <ContactShowContent />
  </ShowBase>
);

const ContactShowContent = () => {
  const { record, isPending } = useShowContext<Contact>();
  if (isPending || !record) return null;

  return (
    <div className="mt-2 mb-2 flex gap-8">
      <div className="flex-1">
        <Card>
          <CardContent>
            <div className="flex">
              <Avatar />
              <div className="ml-2 flex-1">
                <h5 className="text-xl font-semibold">
                  {record.first_name} {record.last_name}
                </h5>
                <div className="text-sm text-[color:var(--text-subtle)]">
                  {record.title}
                  {record.department && ` - ${record.department}`}
                  {record.title &&
                    record.organizations?.find((org) => org.is_primary) &&
                    " at "}
                  {record.organizations?.find((org) => org.is_primary) && (
                    <ReferenceField
                      record={{
                        organization_id: record.organizations.find(
                          (org) => org.is_primary,
                        )?.organization_id,
                      }}
                      source="organization_id"
                      reference="organizations"
                      link="show"
                    >
                      <TextField source="name" />
                    </ReferenceField>
                  )}
                </div>
              </div>
              <div>
                {record.organizations?.find((org) => org.is_primary) && (
                  <ReferenceField
                    record={{
                      organization_id: record.organizations.find(
                        (org) => org.is_primary,
                      )?.organization_id,
                    }}
                    source="organization_id"
                    reference="organizations"
                    link="show"
                    className="no-underline"
                  >
                    <OrganizationAvatar />
                  </ReferenceField>
                )}
              </div>
            </div>
            {/* Organizations Section */}
            {record.organizations && record.organizations.length > 0 && (
              <div className="mt-6">
                <h6 className="text-lg font-semibold mb-4">
                  Associated Organizations
                </h6>
                <div className="space-y-2">
                  {record.organizations.map((org: any) => (
                    <div
                      key={org.organization_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <ReferenceField
                          record={{ organization_id: org.organization_id }}
                          source="organization_id"
                          reference="organizations"
                          link="show"
                          className="font-medium"
                        >
                          <TextField source="name" />
                        </ReferenceField>
                      </div>
                      <div className="text-sm">
                        {org.is_primary && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ReferenceManyField
              target="contact_id"
              reference="contactNotes"
              sort={{ field: "created_at", order: "DESC" }}
              empty={<NoteCreate reference="contacts" />}
            >
              <NotesIterator reference="contacts" />
            </ReferenceManyField>
          </CardContent>
        </Card>
      </div>
      <ContactAside />
    </div>
  );
};

export default ContactShow;
