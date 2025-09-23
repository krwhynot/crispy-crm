import { sub, add } from "date-fns";
import { datatype, lorem, random } from "faker/locale/en_US";

import type { ActivityRecord } from "../../../types";
import type { Db } from "./types";
import { randomDate } from "./utils";

// Activity types for interactions and engagements
const activityTypes: ActivityRecord['type'][] = [
  'call',
  'email',
  'meeting',
  'demo',
  'follow_up',
  'visit',
  'proposal',
  'negotiation'
];

// Sentiment options
const sentiments: ActivityRecord['sentiment'][] = [
  'positive',
  'neutral',
  'negative'
];

// Sample subjects by type
const subjectsByType: Record<ActivityRecord['type'], string[]> = {
  'call': ['Discovery Call', 'Follow-up Call', 'Technical Discussion', 'Pricing Discussion'],
  'email': ['Project Update', 'Proposal Follow-up', 'Meeting Request', 'Document Sharing'],
  'meeting': ['Kickoff Meeting', 'Requirements Review', 'Progress Update', 'Final Review'],
  'demo': ['Product Demo', 'Feature Walkthrough', 'Technical Demo', 'Use Case Demo'],
  'follow_up': ['Project Follow-up', 'Status Check', 'Next Steps', 'Action Items Review'],
  'visit': ['Site Visit', 'Office Tour', 'Facility Review', 'On-site Meeting'],
  'proposal': ['Proposal Presentation', 'Proposal Review', 'Proposal Discussion', 'Terms Negotiation'],
  'negotiation': ['Contract Terms', 'Pricing Negotiation', 'Timeline Discussion', 'Final Terms']
};

export const generateActivities = (db: Db): ActivityRecord[] => {
  const activities: ActivityRecord[] = [];
  let id = 0;

  // Generate engagements (activities without opportunities)
  db.contacts.forEach((contact) => {
    const numEngagements = datatype.number({ min: 2, max: 8 });

    for (let i = 0; i < numEngagements; i++) {
      const type = random.arrayElement(activityTypes);
      const activity_date = randomDate(
        sub(new Date(), { months: 6 }),
        new Date()
      ).toISOString();

      activities.push({
        id: id++,
        activity_type: 'engagement',
        type,
        subject: random.arrayElement(subjectsByType[type]),
        description: datatype.boolean() ? lorem.paragraphs(1) : undefined,
        activity_date,
        duration_minutes: datatype.boolean() ? datatype.number({ min: 15, max: 120 }) : undefined,
        contact_id: contact.id,
        organization_id: contact.company_id,
        follow_up_required: datatype.boolean(),
        follow_up_date: datatype.boolean() ?
          add(new Date(activity_date), { days: datatype.number({ min: 1, max: 30 }) }).toISOString() :
          undefined,
        follow_up_notes: datatype.boolean() ? lorem.sentence() : undefined,
        outcome: datatype.boolean() ? lorem.sentence() : undefined,
        sentiment: datatype.boolean() ? random.arrayElement(sentiments) : undefined,
        location: datatype.boolean() ? `${lorem.words(2)} Office` : undefined,
        attendees: datatype.boolean() ? [lorem.words(2), lorem.words(2)] : undefined,
        tags: datatype.boolean() ? [lorem.word(), lorem.word()] : undefined,
        created_at: activity_date,
        updated_at: activity_date,
        created_by: contact.sales_id,
      });
    }
  });

  // Generate interactions (activities with opportunities)
  db.opportunities.forEach((opportunity) => {
    const numInteractions = datatype.number({ min: 3, max: 12 });

    // Get contacts for this opportunity
    const opportunityContacts = db.contacts.filter(c =>
      opportunity.contact_ids.includes(c.id)
    );

    for (let i = 0; i < numInteractions; i++) {
      const type = random.arrayElement(activityTypes);
      const contact = random.arrayElement(opportunityContacts);

      // Interactions should be after opportunity creation
      const activity_date = randomDate(
        new Date(opportunity.created_at),
        opportunity.actual_close_date ? new Date(opportunity.actual_close_date) : new Date()
      ).toISOString();

      activities.push({
        id: id++,
        activity_type: 'interaction',
        type,
        subject: random.arrayElement(subjectsByType[type]),
        description: datatype.boolean() ? lorem.paragraphs(1) : undefined,
        activity_date,
        duration_minutes: datatype.boolean() ? datatype.number({ min: 15, max: 180 }) : undefined,
        contact_id: contact.id,
        organization_id: opportunity.customer_organization_id,
        opportunity_id: opportunity.id,
        follow_up_required: datatype.boolean(),
        follow_up_date: datatype.boolean() ?
          add(new Date(activity_date), { days: datatype.number({ min: 1, max: 14 }) }).toISOString() :
          undefined,
        follow_up_notes: datatype.boolean() ? lorem.sentence() : undefined,
        outcome: datatype.boolean() ? lorem.sentence() : undefined,
        sentiment: random.arrayElement(sentiments),
        location: datatype.boolean() ? `${lorem.words(2)} Office` : undefined,
        attendees: datatype.boolean() ? [lorem.words(2), lorem.words(2)] : undefined,
        tags: datatype.boolean() ? [lorem.word(), lorem.word()] : undefined,
        created_at: activity_date,
        updated_at: activity_date,
        created_by: opportunity.sales_id,
      });
    }
  });

  return activities;
};