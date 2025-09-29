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
  companyId?: Identifier,
  salesId?: Identifier,
) {
  const companyFilter = {} as any;
  if (companyId) {
    companyFilter.id = companyId;
  } else if (salesId) {
    companyFilter["sales_id@in"] = `(${salesId})`;
  }

  const filter = {} as any;
  if (companyId) {
    filter.company_id = companyId;
  } else if (salesId) {
    filter["sales_id@in"] = `(${salesId})`;
  }

  const [newCompanies, newContactsAndNotes, newOpportunitiesAndNotes] =
    await Promise.all([
      getNewCompanies(dataProvider, companyFilter),
      getNewContactsAndNotes(dataProvider, filter),
      getNewOpportunitiesAndNotes(dataProvider, filter),
    ]);
  return (
    [...newCompanies, ...newContactsAndNotes, ...newOpportunitiesAndNotes]
      // sort by date desc
      .sort((a, b) =>
        a.date && b.date ? a.date.localeCompare(b.date) * -1 : 0,
      )
      // limit to 250 activities
      .slice(0, 250)
  );
}

const getNewCompanies = async (
  dataProvider: DataProvider,
  filter: any,
): Promise<Activity[]> => {
  const { data: companies } = await dataProvider.getList<Company>(
    "organizations",
    {
      filter,
      pagination: { page: 1, perPage: 250 },
      sort: { field: "created_at", order: "DESC" },
    },
  );
  return companies.map((company) => ({
    id: `organization.${company.id}.created`,
    type: ORGANIZATION_CREATED,
    organization_id: company.id,
    organization: company,
    sales_id: company.sales_id,
    date: company.created_at,
  }));
};

async function getNewContactsAndNotes(
  dataProvider: DataProvider,
  filter: any,
): Promise<Activity[]> {
  const { data: contacts } = await dataProvider.getList<Contact>("contacts", {
    filter,
    pagination: { page: 1, perPage: 250 },
    sort: { field: "first_seen", order: "DESC" },
  });

  const recentContactNotesFilter = {} as any;
  if (filter.sales_id) {
    recentContactNotesFilter.sales_id = filter.sales_id;
  }
  if (filter.company_id) {
    // No company_id field in contactNote, filtering by related contacts instead.
    // This filter is only valid if a company has less than 250 contact.
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
    company_id: contact.company_id,
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
  filter: any,
): Promise<Activity[]> {
  const { data: opportunities } = await dataProvider.getList<Opportunity>(
    "opportunities",
    {
      filter,
      pagination: { page: 1, perPage: 250 },
      sort: { field: "created_at", order: "DESC" },
    },
  );

  const recentOpportunityNotesFilter = {} as any;
  if (filter.sales_id) {
    recentOpportunityNotesFilter.sales_id = filter.sales_id;
  }
  if (filter.company_id) {
    // No company_id field in opportunityNote, filtering by related opportunities instead.
    // This filter is only valid if an opportunity has less than 250 notes.
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
    company_id: opportunity.customer_organization_id,
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
