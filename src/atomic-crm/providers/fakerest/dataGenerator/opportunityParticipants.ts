import { datatype, random } from "faker/locale/en_US";

import type { OpportunityParticipant } from "../../../types";
import type { Db } from "./types";

// Participant roles (defined but not used in current implementation)
// const participantRoles: OpportunityParticipant['role'][] = [
//   'customer',
//   'principal',
//   'distributor',
//   'partner',
//   'competitor'
// ];

export const generateOpportunityParticipants = (db: Db): OpportunityParticipant[] => {
  const opportunityParticipants: OpportunityParticipant[] = [];
  let id = 0;

  db.opportunities.forEach((opportunity) => {
    // Every opportunity must have a customer (primary)
    opportunityParticipants.push({
      id: id++,
      opportunity_id: opportunity.id,
      organization_id: opportunity.customer_organization_id,
      role: 'customer',
      is_primary: true,
      created_at: opportunity.created_at,
      updated_at: opportunity.created_at,
      created_by: opportunity.sales_id,
    });

    // Add principal organizations (most opportunities have one, some have multiple)
    const numPrincipals = datatype.number({ min: 1, max: 3 });
    const principalCompanies = db.companies
      .filter(c => c.organization_type === 'principal' || c.is_principal)
      .slice(0, numPrincipals);

    principalCompanies.forEach((principal, index) => {
      opportunityParticipants.push({
        id: id++,
        opportunity_id: opportunity.id,
        organization_id: principal.id,
        role: 'principal',
        is_primary: index === 0, // First principal is primary
        commission_rate: datatype.boolean() ? datatype.number({ min: 0.05, max: 0.30, precision: 0.01 }) : undefined,
        territory: datatype.boolean() ? random.arrayElement(['North', 'South', 'East', 'West', 'National']) : undefined,
        notes: datatype.boolean() ? `Primary supplier for ${opportunity.category}` : undefined,
        created_at: opportunity.created_at,
        updated_at: opportunity.created_at,
        created_by: opportunity.sales_id,
      });
    });

    // Optionally add distributors (30% chance)
    if (datatype.number({ min: 1, max: 100 }) <= 30) {
      const distributorCompanies = db.companies
        .filter(c => c.organization_type === 'distributor' || c.is_distributor)
        .slice(0, datatype.number({ min: 1, max: 2 }));

      distributorCompanies.forEach((distributor, index) => {
        opportunityParticipants.push({
          id: id++,
          opportunity_id: opportunity.id,
          organization_id: distributor.id,
          role: 'distributor',
          is_primary: index === 0,
          commission_rate: datatype.number({ min: 0.05, max: 0.15, precision: 0.01 }),
          territory: random.arrayElement(['Regional', 'Local', 'Specialty']),
          notes: datatype.boolean() ? 'Channel partner' : undefined,
          created_at: opportunity.created_at,
          updated_at: opportunity.created_at,
          created_by: opportunity.sales_id,
        });
      });
    }

    // Optionally add partners (20% chance)
    if (datatype.number({ min: 1, max: 100 }) <= 20) {
      const partnerCompanies = db.companies
        .filter(c => c.organization_type === 'partner')
        .slice(0, 1);

      partnerCompanies.forEach((partner) => {
        opportunityParticipants.push({
          id: id++,
          opportunity_id: opportunity.id,
          organization_id: partner.id,
          role: 'partner',
          is_primary: true,
          notes: 'Strategic partner',
          created_at: opportunity.created_at,
          updated_at: opportunity.created_at,
          created_by: opportunity.sales_id,
        });
      });
    }

    // Rarely add competitors (5% chance)
    if (datatype.number({ min: 1, max: 100 }) <= 5) {
      const competitorCompanies = db.companies
        .filter(c => c.id !== opportunity.customer_organization_id)
        .slice(0, 1);

      if (competitorCompanies.length > 0) {
        opportunityParticipants.push({
          id: id++,
          opportunity_id: opportunity.id,
          organization_id: competitorCompanies[0].id,
          role: 'competitor',
          is_primary: false,
          notes: 'Competitive threat',
          created_at: opportunity.created_at,
          updated_at: opportunity.created_at,
          created_by: opportunity.sales_id,
        });
      }
    }
  });

  return opportunityParticipants;
};