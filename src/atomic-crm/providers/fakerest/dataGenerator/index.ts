import { generateActivities } from "./activities";
import { generateCompanies } from "./companies";
import { generateContactNotes } from "./contactNotes";
import { generateContactOrganizations } from "./contactOrganizations";
import { generateContacts } from "./contacts";
import { generateDealNotes } from "./dealNotes";
import { generateDeals } from "./deals";
import { generateInteractionParticipants } from "./interactionParticipants";
import { generateOpportunities } from "./opportunities";
import { generateOpportunityNotes } from "./opportunityNotes";
import { generateOpportunityParticipants } from "./opportunityParticipants";
import { finalize } from "./finalize";
import { generateSales } from "./sales";
import { generateTags } from "./tags";
import { generateTasks } from "./tasks";
import type { Db } from "./types";

export default (): Db => {
  const db = {} as Db;

  // Generate base data first
  db.sales = generateSales(db);
  db.tags = generateTags(db);
  db.companies = generateCompanies(db);
  db.contacts = generateContacts(db);
  db.contactNotes = generateContactNotes(db);

  // Generate legacy deals for backward compatibility
  db.deals = generateDeals(db);
  db.dealNotes = generateDealNotes(db);

  // Generate new schema data
  db.opportunities = generateOpportunities(db);
  db.opportunityNotes = generateOpportunityNotes(db);
  db.contactOrganizations = generateContactOrganizations(db);
  db.opportunityParticipants = generateOpportunityParticipants(db);
  db.activities = generateActivities(db);
  db.interactionParticipants = generateInteractionParticipants(db);
  db.tasks = generateTasks(db);

  finalize(db);

  return db;
};
