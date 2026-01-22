/**
 * @deprecated Use OrganizationSlideOver instead.
 * This component will be removed in a future release.
 * See docs/decisions/ADR-005-organization-detail-view.md for migration details.
 *
 * Deprecation Timeline:
 * - Phase A (Current): This deprecation notice
 * - Phase B: Redirect to list with SlideOver
 * - Phase C: Remove this file
 */

import { formatDistance } from "date-fns";
import { UserPlus, Briefcase } from "lucide-react";
import {
  RecordContextProvider,
  ShowBase,
  useListContext,
  useRecordContext,
  useShowContext,
} from "ra-core";
import { Link as RouterLink, useLocation, useMatch, useNavigate } from "react-router-dom";
import { AdminButton } from "@/components/admin/AdminButton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReferenceManyField } from "@/components/ra-wrappers/reference-many-field";
import { SortButton } from "@/components/ra-wrappers/sort-button";
import { ResponsiveGrid } from "@/components/design-system";

import { ActivityLog } from "../activity-log/ActivityLog";
import { Avatar } from "../contacts/Avatar";
import { TagsList } from "../contacts/TagsList";
import { findOpportunityLabel } from "../opportunities/opportunity";
import { Status } from "../shared/components/Status";
import { usePipelineConfig } from "../root/ConfigurationContext";
import type { Company, Contact, Opportunity } from "../types";
import { formatName } from "../utils/formatName";
import { OrganizationAside } from "./OrganizationAside";
import { OrganizationAvatar } from "./OrganizationAvatar";
import { ActivitiesTab } from "./ActivitiesTab";
import { AuthorizationsTab } from "./AuthorizationsTab";
import { TrackRecordView } from "../components/TrackRecordView";

const OrganizationShow = () => (
  <ShowBase>
    <OrganizationShowContent />
  </ShowBase>
);

const OrganizationShowContent = () => {
  const { record, isPending } = useShowContext<Company>();
  const navigate = useNavigate();

  // Get tab from URL or default to "activity"
  const tabMatch = useMatch("/organizations/:id/show/:tab");
  const currentTab = tabMatch?.params?.tab || "activity";

  const handleTabChange = (value: string) => {
    if (value === currentTab) return;
    if (value === "activity") {
      navigate(`/organizations/${record?.id}/show`);
      return;
    }
    navigate(`/organizations/${record?.id}/show/${value}`);
  };

  if (isPending || !record) return null;

  // Check if this organization is a distributor (shows Authorizations tab)
  const isDistributor = record.organization_type === "distributor";
  // Determine grid columns based on organization type
  const tabGridCols = isDistributor ? "grid-cols-5" : "grid-cols-4";

  return (
    <>
      <TrackRecordView />
      <ResponsiveGrid variant="dashboard" className="mt-2 mb-2">
        <main role="main" aria-label="Organization details">
          <Card>
            <CardContent className="p-6">
              <div className="flex mb-3">
                <OrganizationAvatar />
                <h2 className="text-xl ml-2 flex-1">{record.name}</h2>
              </div>
              <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
                <TabsList className={`grid w-full ${tabGridCols}`}>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="contacts">
                    {record.nb_contacts
                      ? record.nb_contacts === 1
                        ? "1 Contact"
                        : `${record.nb_contacts} Contacts`
                      : "No Contacts"}
                  </TabsTrigger>
                  <TabsTrigger value="opportunities">
                    {record.nb_opportunities
                      ? record.nb_opportunities === 1
                        ? "1 opportunity"
                        : `${record.nb_opportunities} opportunities`
                      : "No Opportunities"}
                  </TabsTrigger>
                  <TabsTrigger value="activities">Activities</TabsTrigger>
                  {isDistributor && (
                    <TabsTrigger value="authorizations">Authorizations</TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="activity" className="pt-2">
                  <ActivityLog organizationId={record.id} context="organization" />
                </TabsContent>
                <TabsContent value="activities" className="pt-2">
                  <ActivitiesTab organizationId={record.id} />
                </TabsContent>
                <TabsContent value="contacts">
                  {record.nb_contacts ? (
                    <ReferenceManyField
                      reference="contacts_summary"
                      target="organization_id"
                      sort={{ field: "last_name", order: "ASC" }}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-row justify-end space-x-2 mt-1">
                          {!!record.nb_contacts && (
                            <SortButton fields={["last_name", "first_name", "last_seen"]} />
                          )}
                          <CreateRelatedContactButton />
                        </div>
                        <ContactsIterator />
                      </div>
                    </ReferenceManyField>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-row justify-end space-x-2 mt-1">
                        <CreateRelatedContactButton />
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="opportunities">
                  {record.nb_opportunities ? (
                    <ReferenceManyField
                      reference="opportunities"
                      target="customer_organization_id"
                      sort={{ field: "name", order: "ASC" }}
                    >
                      <OpportunitiesIterator />
                    </ReferenceManyField>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-row justify-end space-x-2 mt-1">
                        <CreateRelatedOpportunityButton />
                      </div>
                    </div>
                  )}
                </TabsContent>
                {isDistributor && (
                  <TabsContent value="authorizations" className="pt-2">
                    <AuthorizationsTab distributorId={record.id} />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </main>

        <aside aria-label="Organization information">
          <OrganizationAside />
        </aside>
      </ResponsiveGrid>
    </>
  );
};

const ContactsIterator = () => {
  const location = useLocation();
  const { data: contacts, error, isPending } = useListContext<Contact>();

  if (isPending || error) return null;

  const now = Date.now();
  return (
    <div className="pt-0">
      {contacts.map((contact) => (
        <RecordContextProvider key={contact.id} value={contact}>
          <div className="p-0 text-sm">
            <RouterLink
              to={`/contacts/${contact.id}/show`}
              state={{ from: location.pathname }}
              className="flex items-center justify-between hover:bg-accent/10 py-2 transition-colors"
            >
              <div className="mr-4">
                <Avatar />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {formatName(contact.first_name, contact.last_name)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {contact.title}
                  {contact.nb_tasks
                    ? ` - ${contact.nb_tasks} task${contact.nb_tasks > 1 ? "s" : ""}`
                    : ""}
                  &nbsp; &nbsp;
                  <TagsList />
                </div>
              </div>
              {contact.last_seen && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    last activity {formatDistance(contact.last_seen, now)} ago{" "}
                    <Status status={contact.status} />
                  </div>
                </div>
              )}
            </RouterLink>
          </div>
        </RecordContextProvider>
      ))}
    </div>
  );
};

const CreateRelatedContactButton = () => {
  const organization = useRecordContext<Company>();
  return (
    <AdminButton variant="outline" asChild size="sm" className="h-11">
      <RouterLink
        to="/contacts/create"
        state={organization ? { record: { organization_id: organization.id } } : undefined}
        className="flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Add contact
      </RouterLink>
    </AdminButton>
  );
};

const CreateRelatedOpportunityButton = () => {
  const organization = useRecordContext<Company>();
  return (
    <AdminButton variant="outline" asChild size="sm" className="h-11">
      <RouterLink
        to="/opportunities/create"
        state={organization ? { record: { customer_organization_id: organization.id } } : undefined}
        className="flex items-center gap-2"
      >
        <Briefcase className="h-4 w-4" />
        Add opportunity
      </RouterLink>
    </AdminButton>
  );
};

const OpportunitiesIterator = () => {
  const { data: opportunities, error, isPending } = useListContext<Opportunity>();
  const { opportunityStages } = usePipelineConfig();
  if (isPending || error) return null;

  const now = Date.now();
  return (
    <div>
      <div>
        {opportunities.map((opportunity) => (
          <div key={opportunity.id} className="p-0 text-sm">
            <RouterLink
              to={`/opportunities/${opportunity.id}/show`}
              className="flex items-center justify-between hover:bg-accent/10 py-2 px-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium">{opportunity.name}</div>
                <div className="text-sm text-muted-foreground">
                  {findOpportunityLabel(opportunityStages, opportunity.stage)}
                  {opportunity.estimated_close_date
                    ? `, Expected close: ${new Date(
                        opportunity.estimated_close_date
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`
                    : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  last activity {formatDistance(opportunity.updated_at, now)} ago{" "}
                </div>
              </div>
            </RouterLink>
          </div>
        ))}
      </div>
    </div>
  );
};

export { OrganizationShow };
export default OrganizationShow;
