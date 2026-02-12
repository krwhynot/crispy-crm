import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { ReferenceManyField } from "@/components/ra-wrappers/reference-many-field";
import { TextField } from "@/components/ra-wrappers/text-field";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ContactDetailSkeleton } from "@/components/ui/list-skeleton";
import { ResponsiveGrid } from "@/components/design-system";
import { ShowBase, useShowContext } from "ra-core";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import { NoteCreate, NotesIterator } from "../notes";
import type { Contact } from "../types";
import { Avatar } from "./Avatar";
import { ContactAside } from "./ContactAside";
import { ActivitiesTab } from "./ActivitiesTab";
import { OpportunitiesTab } from "./OpportunitiesTab";
import { TrackRecordView } from "../components/TrackRecordView";

export const ContactShow = () => (
  <ShowBase>
    <ContactShowContent />
  </ShowBase>
);

const ContactShowContent = () => {
  const { record, isPending } = useShowContext<Contact>();
  if (isPending) return <ContactDetailSkeleton />;
  if (!record) return null;

  return (
    <>
      <TrackRecordView />
      <ResponsiveGrid variant="dashboard" className="mt-2 mb-2">
        <main role="main" aria-label="Contact details">
          <SectionCard contentClassName="p-6">
            <div className="flex">
              <Avatar />
              <div className="ml-2 flex-1">
                <h2 className="text-xl font-semibold">
                  {record.first_name} {record.last_name}
                </h2>
                <div className="text-sm text-muted-foreground">
                  {record.title}
                  {record.department && ` - ${record.department}`}
                  {record.title && record.organization_id && " at "}
                  {record.organization_id && (
                    <ReferenceField source="organization_id" reference="organizations" link="show">
                      <TextField source="name" />
                    </ReferenceField>
                  )}
                </div>
              </div>
              <div>
                {record.organization_id && (
                  <ReferenceField
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

            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="pt-2">
                {/* Organization Section - Single organization per contact */}
                {record.organization_id && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-4">Organization</h3>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <ReferenceField
                          source="organization_id"
                          reference="organizations"
                          link="show"
                          className="font-medium"
                        >
                          <TextField source="name" />
                        </ReferenceField>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="pt-2">
                <ReferenceManyField
                  target="contact_id"
                  reference="contact_notes"
                  sort={{ field: "created_at", order: "DESC" }}
                  empty={<NoteCreate reference="contacts" />}
                >
                  <NotesIterator reference="contacts" />
                </ReferenceManyField>
              </TabsContent>

              <TabsContent value="activities" className="pt-2">
                <ActivitiesTab contactId={record.id} organizationId={record.organization_id} />
              </TabsContent>

              <TabsContent value="opportunities" className="pt-2">
                <OpportunitiesTab />
              </TabsContent>
            </Tabs>
          </SectionCard>
        </main>

        <aside aria-label="Contact information">
          <ContactAside />
        </aside>
      </ResponsiveGrid>
    </>
  );
};

export default ContactShow;
