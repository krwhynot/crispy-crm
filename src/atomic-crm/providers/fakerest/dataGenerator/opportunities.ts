import { add } from "date-fns";
import { datatype, lorem, random } from "faker/locale/en_US";

import {
  defaultOpportunityCategories,
  defaultOpportunityStages,
} from "../../../root/defaultConfiguration";
import type { Opportunity } from "../../../types";
import type { Db } from "./types";
import { randomDate } from "./utils";

// Opportunity stages based on the new schema
const opportunityStages: Opportunity['stage'][] = defaultOpportunityStages.map(stage => stage.value) as Opportunity['stage'][];

// Opportunity statuses
const opportunityStatuses: Opportunity['status'][] = [
  'active',
  'on_hold',
  'nurturing',
  'stalled',
  'expired'
];

// Priority levels
const priorityLevels: Opportunity['priority'][] = [
  'low',
  'medium',
  'high',
  'critical'
];

export const generateOpportunities = (db: Db): Opportunity[] => {
  const opportunities = Array.from(Array(50).keys()).map((id) => {
    const company = random.arrayElement(db.companies);
    company.nb_deals = (company.nb_deals || 0) + 1; // Keep nb_deals for backward compatibility

    const contacts = random.arrayElements(
      db.contacts.filter((contact) => contact.company_id === company.id),
      datatype.number({ min: 1, max: 3 }),
    );

    const lowercaseName = lorem.words();
    const created_at = randomDate(new Date(company.created_at)).toISOString();
    const stage = random.arrayElement(opportunityStages);

    // Set probability based on stage
    const probabilityByStage: Record<Opportunity['stage'], number> = {
      'lead': datatype.number({ min: 5, max: 25 }),
      'qualified': datatype.number({ min: 20, max: 40 }),
      'needs_analysis': datatype.number({ min: 30, max: 50 }),
      'proposal': datatype.number({ min: 40, max: 70 }),
      'negotiation': datatype.number({ min: 60, max: 85 }),
      'closed_won': 100,
      'closed_lost': 0,
      'nurturing': datatype.number({ min: 10, max: 30 })
    };

    const estimated_close_date = randomDate(
      new Date(created_at),
      add(new Date(created_at), { months: 6 }),
    ).toISOString();

    // Determine if this is closed
    const isClosed = stage === 'closed_won' || stage === 'closed_lost';
    const actual_close_date = isClosed ?
      randomDate(new Date(created_at), new Date()).toISOString() :
      undefined;

    return {
      id,
      name: lowercaseName[0].toUpperCase() + lowercaseName.slice(1),
      customer_organization_id: company.id,
      contact_ids: contacts.map((contact) => contact.id),
      category: random.arrayElement(defaultOpportunityCategories),
      stage,
      status: isClosed ? 'active' : random.arrayElement(opportunityStatuses),
      priority: random.arrayElement(priorityLevels),
      description: lorem.paragraphs(datatype.number({ min: 1, max: 4 })),
      amount: datatype.number(1000) * 100,
      probability: probabilityByStage[stage],
      estimated_close_date,
      actual_close_date,
      created_at,
      updated_at: randomDate(new Date(created_at)).toISOString(),
      expected_closing_date: estimated_close_date, // Backward compatibility
      sales_id: company.sales_id,
      index: 0,
      stage_manual: datatype.boolean(),
      status_manual: datatype.boolean(),
      next_action: datatype.boolean() ? lorem.sentence() : undefined,
      next_action_date: datatype.boolean() ?
        randomDate(new Date(), add(new Date(), { weeks: 2 })).toISOString() :
        undefined,
      competition: datatype.boolean() ? lorem.words(2) : undefined,
      decision_criteria: datatype.boolean() ? lorem.sentence() : undefined,
      // Backward compatibility fields
      company_id: company.id,
    };
  });

  // Compute index based on stage (similar to deals)
  defaultOpportunityStages.forEach((stageConfig) => {
    opportunities
      .filter((opportunity) => opportunity.stage === stageConfig.value)
      .forEach((opportunity, index) => {
        opportunities[opportunity.id].index = index;
      });
  });

  return opportunities;
};