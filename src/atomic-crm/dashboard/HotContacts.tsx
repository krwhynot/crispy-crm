import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Users } from "lucide-react";
import { useGetIdentity, useGetList } from "ra-core";
import { Link } from "react-router-dom";

import { SimpleList } from "../simple-list/SimpleList";
import { Avatar } from "../contacts/Avatar";
import type { Contact } from "../types";

const trackDashboardEvent = (cardType: string) => {
  console.log(`dashboard_card_click: ${cardType}`, {
    timestamp: new Date().toISOString(),
    viewport: window.innerWidth < 768 ? 'mobile' : 'desktop'
  });
};

export const HotContacts = () => {
  const { identity } = useGetIdentity();
  const {
    data: contactData,
    total: contactTotal,
    isPending: contactsLoading,
  } = useGetList<Contact>(
    "contacts",
    {
      pagination: { page: 1, perPage: 10 },
      sort: { field: "last_seen", order: "DESC" },
      filter: { sales_id: identity?.id },
    },
    { enabled: Number.isInteger(identity?.id) },
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        <div className="mr-3 flex">
          <Users className="text-[color:var(--text-subtle)] w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-[color:var(--text-title)] uppercase tracking-tight">
          Hot Contacts
        </h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-muted-foreground"
                asChild
              >
                <Link to="/contacts/create">
                  <Plus className="w-4 h-4 text-primary" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create contact</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Card
        className="rounded-xl py-0 cursor-pointer"
        onClick={() => trackDashboardEvent('contacts')}
      >
        <SimpleList<Contact>
          linkType="show"
          data={contactData}
          total={contactTotal}
          isPending={contactsLoading}
          resource="contacts"
          className="[&>li:first-child>a]:rounded-t-xl [&>li:last-child>a]:rounded-b-xl"
          primaryText={(contact) =>
            `${contact.first_name} ${contact.last_name}`
          }
          secondaryText={(contact) => (
            <>
              {contact.title} at {contact.company_name}
            </>
          )}
          leftAvatar={(contact) => <Avatar record={contact} />}
          empty={
            <div className="p-4">
              <p className="text-sm">
                Your recently seen contacts will appear here.
              </p>
            </div>
          }
        />
      </Card>
    </div>
  );
};
