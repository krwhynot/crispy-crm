import { formatDistance } from "date-fns";
import { UserPlus } from "lucide-react";
import {
  RecordContextProvider,
  ShowBase,
  useListContext,
  useRecordContext,
  useShowContext,
} from "ra-core";
import {
  Link as RouterLink,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { SortButton } from "@/components/admin/sort-button";

import { ActivityLog } from "../activity/ActivityLog";
import { Avatar } from "../contacts/Avatar";
import { TagsList } from "../contacts/TagsList";
import { findOpportunityLabel } from "../opportunities/opportunity";
import { Status } from "../misc/Status";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Company, Contact, Opportunity } from "../types";
import { OrganizationAside } from "./OrganizationAside";
import { OrganizationAvatar } from "./OrganizationAvatar";

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

  return (
    <div className="mt-2 flex pb-2 gap-8">
      <div className="flex-1">
        <Card>
          <CardContent>
            <div className="flex mb-3">
              <OrganizationAvatar />
              <h5 className="text-xl ml-2 flex-1">{record.name}</h5>
            </div>
            <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="contacts">
                  {record.nb_contacts
                    ? record.nb_contacts === 1
                      ? "1 Contact"
                      : `${record.nb_contacts} Contacts`
                    : "No Contacts"}
                </TabsTrigger>
                {record.nb_opportunities ? (
                  <TabsTrigger value="opportunities">
                    {record.nb_opportunities === 1
                      ? "1 opportunity"
                      : `${record.nb_opportunities} opportunities`}
                  </TabsTrigger>
                ) : null}
              </TabsList>
              <TabsContent value="activity" className="pt-2">
                <ActivityLog
                  organizationId={record.id}
                  context="organization"
                />
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
                          <SortButton
                            fields={["last_name", "first_name", "last_seen"]}
                          />
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
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <OrganizationAside />
    </div>
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
              className="flex items-center justify-between hover:bg-[oklch(99%_0.006_92)] py-2 transition-colors"
            >
              <div className="mr-4">
                <Avatar />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {`${contact.first_name} ${contact.last_name}`}
                </div>
                <div className="text-sm text-[color:var(--text-subtle)]">
                  {contact.title}
                  {contact.nb_tasks
                    ? ` - ${contact.nb_tasks} task${
                        contact.nb_tasks > 1 ? "s" : ""
                      }`
                    : ""}
                  &nbsp; &nbsp;
                  <TagsList />
                </div>
              </div>
              {contact.last_seen && (
                <div className="text-right">
                  <div className="text-sm text-[color:var(--text-subtle)]">
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
    <Button variant="outline" asChild size="sm" className="h-9">
      <RouterLink
        to="/contacts/create"
        state={
          organization
            ? { record: { organization_id: organization.id } }
            : undefined
        }
        className="flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Add contact
      </RouterLink>
    </Button>
  );
};

const OpportunitiesIterator = () => {
  const {
    data: opportunities,
    error,
    isPending,
  } = useListContext<Opportunity>();
  const { opportunityStages } = useConfigurationContext();
  if (isPending || error) return null;

  const now = Date.now();
  return (
    <div>
      <div>
        {opportunities.map((opportunity) => (
          <div key={opportunity.id} className="p-0 text-sm">
            <RouterLink
              to={`/opportunities/${opportunity.id}/show`}
              className="flex items-center justify-between hover:bg-[oklch(99%_0.006_92)] py-2 px-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium">{opportunity.name}</div>
                <div className="text-sm text-[color:var(--text-subtle)]">
                  {findOpportunityLabel(opportunityStages, opportunity.stage)},{" "}
                  {opportunity.amount.toLocaleString("en-US", {
                    notation: "compact",
                    style: "currency",
                    currency: "USD",
                    currencyDisplay: "narrowSymbol",
                    minimumSignificantDigits: 3,
                  })}
                  {opportunity.category ? `, ${opportunity.category}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[color:var(--text-subtle)]">
                  last activity {formatDistance(opportunity.updated_at, now)}{" "}
                  ago{" "}
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
