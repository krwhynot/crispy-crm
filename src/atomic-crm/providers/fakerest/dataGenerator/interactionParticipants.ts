import { datatype, lorem, random } from "faker/locale/en_US";

import type { InteractionParticipant } from "../../../types";
import type { Db } from "./types";

const participantRoles = [
  'participant',
  'organizer',
  'presenter',
  'observer',
  'decision_maker',
  'technical_lead',
  'stakeholder'
];

export const generateInteractionParticipants = (db: Db): InteractionParticipant[] => {
  const interactionParticipants: InteractionParticipant[] = [];
  let id = 0;

  // Generate participants for activities
  db.activities.forEach((activity) => {
    // Skip engagements for now, focus on interactions
    if (activity.activity_type === 'engagement') return;

    // Each interaction can have 1-4 participants
    const numParticipants = datatype.number({ min: 1, max: 4 });

    for (let i = 0; i < numParticipants; i++) {
      // If there's a contact_id on the activity, include them as first participant
      if (i === 0 && activity.contact_id) {
        interactionParticipants.push({
          id: id++,
          activity_id: activity.id,
          contact_id: activity.contact_id,
          organization_id: activity.organization_id,
          role: i === 0 ? 'organizer' : random.arrayElement(participantRoles),
          notes: datatype.boolean() ? lorem.sentence() : undefined,
          created_at: activity.created_at,
        });
      } else {
        // Add additional participants from the same organization or related organizations
        // Find related contacts from the same organization or related organizations in the opportunity
        const relatedContacts = db.contacts.filter(c => {
          if (c.company_id === activity.organization_id) return true;

          if (activity.opportunity_id && db.opportunityParticipants) {
            const relatedOrgIds = db.opportunityParticipants
              .filter(op => op.opportunity_id === activity.opportunity_id)
              .map(op => op.organization_id);
            return relatedOrgIds.includes(c.company_id);
          }

          return false;
        });

        if (relatedContacts.length > 0) {
          const participant = random.arrayElement(relatedContacts);

          interactionParticipants.push({
            id: id++,
            activity_id: activity.id,
            contact_id: participant.id,
            organization_id: participant.company_id,
            role: random.arrayElement(participantRoles),
            notes: datatype.boolean() ? lorem.sentence() : undefined,
            created_at: activity.created_at,
          });
        }
      }
    }
  });

  return interactionParticipants;
};