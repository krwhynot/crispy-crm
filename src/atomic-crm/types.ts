import type { Identifier, RaRecord } from "ra-core";
import type { ComponentType } from "react";
import type {
  ORGANIZATION_CREATED,
  CONTACT_CREATED,
  CONTACT_NOTE_CREATED,
  OPPORTUNITY_CREATED,
  OPPORTUNITY_NOTE_CREATED,
} from "./consts";
import type { Organization } from "./validation/organizations";
import type { OpportunityStageValue } from "./opportunities/stageConstants";

// Type definitions for enhanced CRM features
export type OrganizationType =
  | "customer"
  | "prospect"
  | "principal"
  | "distributor"
  | "unknown";
export type CompanyPriority = "A" | "B" | "C" | "D";

// SignUpData type removed - all users created through Sales management

export interface SalesFormData {
  avatar: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  administrator: boolean;
  disabled: boolean;
}

export type Sale = {
  first_name: string;
  last_name: string;
  administrator: boolean;
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;

  /**
   * This is a copy of the user's email, to make it easier to handle by react admin
   * DO NOT UPDATE this field directly, it should be updated by the backend
   */
  email: string;

  /**
   * This is used by the fake rest provider to store the password
   * DO NOT USE this field in your code besides the fake rest provider
   * @deprecated
   */
  password?: string;
} & Pick<RaRecord, "id">;

// Organization type (imported from validation)
export type { Organization } from "./validation/organizations";
// Company is an alias for Organization for backward compatibility
export type Company = Organization;

export interface EmailAndType {
  email: string;
  type: "Work" | "Home" | "Other";
}

export interface PhoneNumberAndType {
  number: string;
  type: "Work" | "Home" | "Other";
}

export type Contact = {
  first_name: string;
  last_name: string;
  title: string;
  email: EmailAndType[];
  avatar?: Partial<RAFile>;
  linkedin_url?: string | null;
  first_seen: string;
  last_seen: string;
  has_newsletter: boolean;
  tags: Identifier[];
  gender: string;
  opportunity_owner_id: Identifier;
  status: string;
  background: string;
  phone: PhoneNumberAndType[];

  // Organization relationship (one-to-many)
  organization_id?: Identifier | null;
  department?: string;
  deleted_at?: string;

  // Calculated fields
  nb_tasks?: number;
  company_name?: string;
} & Pick<RaRecord, "id">;

export interface ContactOrganization {
  id?: Identifier; // Optional for new records
  contact_id: Identifier;
  organization_id: Identifier;
  is_primary: boolean; // Matches database schema column name
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export type OpportunityParticipant = {
  id: Identifier;
  opportunity_id: Identifier;
  organization_id: Identifier;
  role: "customer" | "principal" | "distributor" | "competitor";
  is_primary: boolean;
  commission_rate?: number;
  territory?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: Identifier;
  deleted_at?: string;
} & Pick<RaRecord, "id">;

export type ActivityRecord = {
  id: Identifier;
  activity_type: "engagement" | "interaction";
  type:
    | "call"
    | "email"
    | "meeting"
    | "demo"
    | "follow_up"
    | "visit"
    | "proposal"
    | "negotiation";
  subject: string;
  description?: string;
  activity_date: string;
  duration_minutes?: number;
  contact_id?: Identifier;
  organization_id?: Identifier;
  opportunity_id?: Identifier; // NULL for engagements, required for interactions
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  outcome?: string;
  sentiment?: "positive" | "neutral" | "negative";
  attachments?: string[];
  location?: string;
  attendees?: string[];
  tags?: string[];
  created_at: string;
  updated_at?: string;
  created_by?: Identifier;
  deleted_at?: string;
} & Pick<RaRecord, "id">;

export type InteractionParticipant = {
  id: Identifier;
  activity_id: Identifier;
  contact_id?: Identifier;
  organization_id?: Identifier;
  role?: string;
  notes?: string;
  created_at: string;
} & Pick<RaRecord, "id">;

export type ContactNote = {
  contact_id: Identifier;
  text: string;
  created_at: string;
  updated_at: string;
  opportunity_owner_id: Identifier;
  status: string;
  attachments?: AttachmentNote[];
} & Pick<RaRecord, "id">;

// Deal type removed - use Opportunity instead


// Lead Source type
export type LeadSource =
  | "referral"
  | "trade_show"
  | "website"
  | "cold_call"
  | "email_campaign"
  | "social_media"
  | "partner"
  | "existing_customer";


export type Opportunity = {
  name: string;
  customer_organization_id: Identifier;
  principal_organization_id?: Identifier;
  distributor_organization_id?: Identifier;
  contact_ids: Identifier[];
  stage: OpportunityStageValue;
  status: "active" | "on_hold" | "nurturing" | "stalled" | "expired";
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  estimated_close_date: string;
  actual_close_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  opportunity_owner_id?: Identifier;
  account_manager_id?: Identifier;
  lead_source?: LeadSource;
  index: number;
  founding_interaction_id?: Identifier;
  stage_manual: boolean;
  status_manual: boolean;
  next_action?: string;
  next_action_date?: string;
  competition?: string;
  decision_criteria?: string;
} & Pick<RaRecord, "id">;

// DealNote type removed - use OpportunityNote instead

export type OpportunityNote = {
  opportunity_id: Identifier;
  text: string;
  created_at: string;
  updated_at: string;
  opportunity_owner_id: Identifier;
  attachments?: AttachmentNote[];

  // This is defined for compatibility with `ContactNote`
  status?: undefined;
} & Pick<RaRecord, "id">;

export type Tag = {
  name: string;
  color: string;
} & Pick<RaRecord, "id">;

export type Task = {
  title: string;
  description?: string | null;
  contact_id: Identifier;
  type: string;
  due_date: string;
  reminder_date?: string | null;
  completed?: boolean;
  completed_at?: string | null;
  priority?: "low" | "medium" | "high";
  opportunity_id?: Identifier;
  sales_id?: Identifier;
  opportunity_owner_id?: Identifier;
  created_at?: string;
  updated_at?: string;
} & Pick<RaRecord, "id">;

export type ActivityOrganizationCreated = {
  type: typeof ORGANIZATION_CREATED;
  organization_id: Identifier;
  organization: Organization;
  opportunity_owner_id: Identifier;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactCreated = {
  type: typeof CONTACT_CREATED;
  customer_organization_id: Identifier;
  opportunity_owner_id?: Identifier;
  contact: Contact;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactNoteCreated = {
  type: typeof CONTACT_NOTE_CREATED;
  opportunity_owner_id?: Identifier;
  contactNote: ContactNote;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityOpportunityCreated = {
  type: typeof OPPORTUNITY_CREATED;
  customer_organization_id: Identifier;
  opportunity_owner_id?: Identifier;
  opportunity: Opportunity;
  date: string;
};

export type ActivityOpportunityNoteCreated = {
  type: typeof OPPORTUNITY_NOTE_CREATED;
  opportunity_owner_id?: Identifier;
  opportunityNote: OpportunityNote;
  date: string;
};

export type Activity = RaRecord &
  (
    | ActivityOrganizationCreated
    | ActivityContactCreated
    | ActivityContactNoteCreated
    | ActivityOpportunityCreated
    | ActivityOpportunityNoteCreated
  );

export interface RAFile {
  src: string;
  title: string;
  path?: string;
  rawFile: File;
  type?: string;
}

export type AttachmentNote = RAFile;
// DealStage interface removed - use OpportunityStage instead

export interface NoteStatus {
  value: string;
  label: string;
  color: string;
}

export interface ContactGender {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}
