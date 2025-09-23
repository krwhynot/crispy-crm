import type {
  ActivityRecord,
  Company,
  Contact,
  ContactNote,
  ContactOrganization,
  Deal,
  DealNote,
  InteractionParticipant,
  Opportunity,
  OpportunityNote,
  OpportunityParticipant,
  Sale,
  Tag,
  Task,
} from "../../../types";

export interface Db {
  companies: Required<Company>[];
  contacts: Required<Contact>[];
  contactNotes: ContactNote[];
  contactOrganizations: ContactOrganization[];
  deals: Deal[];
  dealNotes: DealNote[];
  opportunities: Opportunity[];
  opportunityNotes: OpportunityNote[];
  opportunityParticipants: OpportunityParticipant[];
  activities: ActivityRecord[];
  interactionParticipants: InteractionParticipant[];
  sales: Sale[];
  tags: Tag[];
  tasks: Task[];
}
