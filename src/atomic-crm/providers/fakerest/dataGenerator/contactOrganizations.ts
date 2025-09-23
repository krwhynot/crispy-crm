import { datatype, random } from "faker/locale/en_US";

import type { ContactOrganization } from "../../../types";
import type { Db } from "./types";

// Purchase influence levels
const purchaseInfluences: ContactOrganization['purchase_influence'][] = [
  'High',
  'Medium',
  'Low',
  'Unknown'
];

// Decision authority levels
const decisionAuthorities: ContactOrganization['decision_authority'][] = [
  'Decision Maker',
  'Influencer',
  'End User',
  'Gatekeeper'
];

// Role types
const roles: NonNullable<ContactOrganization['role']>[] = [
  'decision_maker',
  'influencer',
  'buyer',
  'end_user',
  'gatekeeper',
  'champion',
  'technical',
  'executive'
];

export const generateContactOrganizations = (db: Db): ContactOrganization[] => {
  const contactOrganizations: ContactOrganization[] = [];
  let id = 0;

  // Create primary relationships for existing contacts
  db.contacts.forEach((contact) => {
    if (contact.company_id) {
      const created_at = contact.first_seen;

      contactOrganizations.push({
        id: id++,
        contact_id: contact.id,
        organization_id: contact.company_id,
        is_primary_contact: contact.is_primary_contact || datatype.boolean(),
        purchase_influence: contact.purchase_influence || random.arrayElement(purchaseInfluences),
        decision_authority: contact.decision_authority || random.arrayElement(decisionAuthorities),
        role: contact.role || random.arrayElement(roles),
        created_at,
        updated_at: created_at,
      });
    }
  });

  // Add some secondary organization relationships (10% of contacts)
  const contactsWithSecondary = db.contacts
    .filter(() => datatype.number({ min: 1, max: 100 }) <= 10)
    .slice(0, Math.floor(db.contacts.length * 0.1));

  contactsWithSecondary.forEach((contact) => {
    // Pick a different company for secondary relationship
    const otherCompanies = db.companies.filter(c => c.id !== contact.company_id);
    if (otherCompanies.length > 0) {
      const secondaryCompany = random.arrayElement(otherCompanies);
      const created_at = new Date(contact.first_seen);
      created_at.setDate(created_at.getDate() + datatype.number({ min: 30, max: 365 }));

      contactOrganizations.push({
        id: id++,
        contact_id: contact.id,
        organization_id: secondaryCompany.id,
        is_primary_contact: false, // Secondary relationships are not primary
        purchase_influence: random.arrayElement(purchaseInfluences),
        decision_authority: random.arrayElement(decisionAuthorities),
        role: random.arrayElement(roles),
        created_at: created_at.toISOString(),
        updated_at: created_at.toISOString(),
      });
    }
  });

  return contactOrganizations;
};