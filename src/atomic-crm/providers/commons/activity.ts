import type { DataProvider, Identifier } from "ra-core";
import {
  ORGANIZATION_CREATED,
  CONTACT_CREATED,
  CONTACT_NOTE_CREATED,
  OPPORTUNITY_CREATED,
  OPPORTUNITY_NOTE_CREATED,
} from "../../consts";
import type {
  Activity,
  Company,
  Contact,
  ContactNote,
  Opportunity,
  OpportunityNote,
} from "../../types";

// FIXME: Requires 5 large queries to get the latest activities.
// Replace with a server-side view or a custom API endpoint.
export async function getActivityLog(
  dataProvider: DataProvider,
  organizationId?: Identifier,
  salesId?: Identifier,
) {
  const organizationFilter = {} as any;
  if (organizationId) {
    organizationFilter.id = organizationId;
  } else if (salesId) {
    organizationFilter["sales_id@in"] = `(${salesId})`;
  }

  const filter = {} as any;
  if (salesId) {
    filter["sales_id@in"] = `(${salesId})`;
  }

  const [newOrganizations, newContactsAndNotes, newOpportunitiesAndNotes] =
    await Promise.all([
      getNewOrganizations(dataProvider, organizationFilter),
      getNewContactsAndNotes(dataProvider, organizationId, salesId),
      getNewOpportunitiesAndNotes(dataProvider, organizationId, salesId),
    ]);
  return (
    [...newOrganizations, ...newContactsAndNotes, ...newOpportunitiesAndNotes]
      // sort by date desc
      .sort((a, b) =>
        a.date && b.date ? a.date.localeCompare(b.date) * -1 : 0,
      )
      // limit to 250 activities
      .slice(0, 250)
  );
}

const getNewOrganizations = async (
  dataProvider: DataProvider,
  filter: any,
): Promise<Activity[]> => {
  const { data: organizations } = await dataProvider.getList<Company>(
    "organizations",
    {
      filter,
      pagination: { page: 1, perPage: 250 },
      sort: { field: "created_at", order: "DESC" },
    },
  );
  return organizations.map((organization) => ({
    id: `organization.${organization.id}.created`,
    type: ORGANIZATION_CREATED,
    organization_id: organization.id,
    organization,
    sales_id: organization.sales_id,
    date: organization.created_at,
  }));
};

async function getNewContactsAndNotes(
  dataProvider: DataProvider,
  organizationId?: Identifier,
  salesId?: Identifier,
): Promise<Activity[]> {
  const contactFilter = {} as any;
  if (organizationId) {
    contactFilter.organization_id = organizationId;
  } else if (salesId) {
    contactFilter["sales_id@in"] = `(${salesId})`;
  }

  const { data: contacts } = await dataProvider.getList<Contact>("contacts", {
    filter: contactFilter,
    pagination: { page: 1, perPage: 250 },
    sort: { field: "first_seen", order: "DESC" },
  });

  const recentContactNotesFilter = {} as any;
  if (salesId) {
    recentContactNotesFilter["sales_id@in"] = `(${salesId})`;
  }
  if (organizationId && contacts.length > 0) {
    // Filter notes by the contacts that belong to this organization
    const contactIds = contacts.map((contact) => contact.id).join(",");
    recentContactNotesFilter["contact_id@in"] = `(${contactIds})`;
  }

  const { data: contactNotes } = await dataProvider.getList<ContactNote>(
    "contactNotes",
    {
      filter: recentContactNotesFilter,
      pagination: { page: 1, perPage: 250 },
      sort: { field: "created_at", order: "DESC" },
    },
  );

  const newContacts = contacts.map((contact) => ({
    id: `contact.${contact.id}.created`,
    type: CONTACT_CREATED,
    sales_id: contact.sales_id,
    contact,
    date: contact.first_seen,
  }));

  const newContactNotes = contactNotes.map((contactNote) => ({
    id: `contactNote.${contactNote.id}.created`,
    type: CONTACT_NOTE_CREATED,
    sales_id: contactNote.sales_id,
    contactNote,
    date: contactNote.date,
  }));

  return [...newContacts, ...newContactNotes];
}

async function getNewOpportunitiesAndNotes(
  dataProvider: DataProvider,
  organizationId?: Identifier,
  salesId?: Identifier,
): Promise<Activity[]> {
  const opportunityFilter = {} as any;

  if (organizationId) {
    // Filter opportunities where the organization appears in ANY role
    opportunityFilter["@or"] = {
      customer_organization_id: organizationId,
      principal_organization_id: organizationId,
      distributor_organization_id: organizationId,
    };
  } else if (salesId) {
    opportunityFilter["sales_id@in"] = `(${salesId})`;
  }

  const { data: opportunities } = await dataProvider.getList<Opportunity>(
    "opportunities",
    {
      filter: opportunityFilter,
      pagination: { page: 1, perPage: 250 },
      sort: { field: "created_at", order: "DESC" },
    },
  );

  const recentOpportunityNotesFilter = {} as any;
  if (salesId) {
    recentOpportunityNotesFilter["sales_id@in"] = `(${salesId})`;
  }
  if (organizationId && opportunities.length > 0) {
    // Filter notes by the opportunities that involve this organization
    const opportunityIds = opportunities
      .map((opportunity) => opportunity.id)
      .join(",");
    recentOpportunityNotesFilter["opportunity_id@in"] = `(${opportunityIds})`;
  }

  const { data: opportunityNotes } =
    await dataProvider.getList<OpportunityNote>("opportunityNotes", {
      filter: recentOpportunityNotesFilter,
      pagination: { page: 1, perPage: 250 },
      sort: { field: "created_at", order: "DESC" },
    });

  const newOpportunities = opportunities.map((opportunity) => ({
    id: `opportunity.${opportunity.id}.created`,
    type: OPPORTUNITY_CREATED,
    organization_id: opportunity.customer_organization_id,
    sales_id: opportunity.sales_id,
    opportunity,
    date: opportunity.created_at,
  }));

  const newOpportunityNotes = opportunityNotes.map((opportunityNote) => ({
    id: `opportunityNote.${opportunityNote.id}.created`,
    type: OPPORTUNITY_NOTE_CREATED,
    sales_id: opportunityNote.sales_id,
    opportunityNote,
    date: opportunityNote.date,
  }));

  return [...newOpportunities, ...newOpportunityNotes];
}
