import {
  ReferenceField,
  ReferenceManyField,
  TextField,
} from "@/components/admin";
import { Card, CardContent } from "@/components/ui/card";
import { ShowBase, useShowContext } from "ra-core";
import { CompanyAvatar } from "../companies/CompanyAvatar";
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
                <div className="inline-flex text-sm text-muted-foreground">
                  {record.title}
                  {record.department && ` - ${record.department}`}
                  {record.title && record.company_id != null && " at "}
                  {record.company_id != null && (
                    <ReferenceField
                      source="company_id"
                      reference="companies"
                      link="show"
                    >
                      &nbsp;
                      <TextField source="name" />
                    </ReferenceField>
                  )}
                </div>
                {record.role && (
                  <div className="text-sm text-muted-foreground">
                    Role: {record.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {record.purchase_influence && record.purchase_influence !== 'Unknown' && (
                      <span> • Purchase Influence: {record.purchase_influence}</span>
                    )}
                    {record.decision_authority && record.decision_authority !== 'End User' && (
                      <span> • {record.decision_authority}</span>
                    )}
                  </div>
                )}
                {record.is_primary_contact && (
                  <div className="text-sm text-blue-600 font-medium">
                    Primary Contact
                  </div>
                )}
              </div>
              <div>
                <ReferenceField
                  source="company_id"
                  reference="companies"
                  link="show"
                  className="no-underline"
                >
                  <CompanyAvatar />
                </ReferenceField>
              </div>
            </div>
            {/* Organizations Section */}
            {record.organizations && record.organizations.length > 0 && (
              <div className="mt-6">
                <h6 className="text-lg font-semibold mb-4">Associated Organizations</h6>
                <div className="space-y-2">
                  {record.organizations.map((org: any) => {
                    // Skip primary organization if it's already shown above
                    if (org.organization_id === record.company_id) {
                      return null;
                    }

                    return (
                      <div key={org.organization_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <ReferenceField
                            record={{ company_id: org.organization_id }}
                            source="company_id"
                            reference="companies"
                            link="show"
                            className="font-medium"
                          >
                            <TextField source="name" />
                          </ReferenceField>
                          <div className="text-sm text-muted-foreground mt-1">
                            {org.role && (
                              <span>Role: {org.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                            )}
                            {org.purchase_influence && org.purchase_influence !== 'Unknown' && (
                              <span> • Influence: {org.purchase_influence}</span>
                            )}
                            {org.decision_authority && org.decision_authority !== 'End User' && (
                              <span> • {org.decision_authority}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm">
                          {org.is_primary_contact && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Primary
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <ReferenceManyField
              target="contact_id"
              reference="contactNotes"
              sort={{ field: "date", order: "DESC" }}
              empty={<NoteCreate reference="contacts" showStatus />}
            >
              <NotesIterator reference="contacts" showStatus />
            </ReferenceManyField>
          </CardContent>
        </Card>
      </div>
      <ContactAside />
    </div>
  );
};
