import type { Identifier, RaRecord } from "ra-core";
import type { ComponentType } from "react";
import type {
  COMPANY_CREATED,
  CONTACT_CREATED,
  CONTACT_NOTE_CREATED,
  OPPORTUNITY_CREATED,
  OPPORTUNITY_NOTE_CREATED,
} from "./consts";

// Type definitions for enhanced CRM features
export type ContactRole = 'decision_maker' | 'influencer' | 'buyer' | 'end_user' | 'gatekeeper' | 'champion' | 'technical' | 'executive' | 'unknown';
export type PurchaseInfluence = 'High' | 'Medium' | 'Low' | 'Unknown';
export type DecisionAuthority = 'Decision Maker' | 'Influencer' | 'End User' | 'Gatekeeper';
export type OrganizationType = 'customer' | 'prospect' | 'vendor' | 'partner' | 'principal' | 'distributor' | 'unknown';
export type CompanyPriority = 'A' | 'B' | 'C' | 'D';

// SignUpData type removed - all users created through Sales management

export type SalesFormData = {
  avatar: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  administrator: boolean;
  disabled: boolean;
};

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

export type Company = {
  name: string;
  logo: RAFile;
  sector: string;
  size: 1 | 10 | 50 | 250 | 500;
  linkedin_url: string;
  website: string;
  phone_number: string;
  address: string;
  zipcode: string;
  city: string;
  stateAbbr: string;
  sales_id: Identifier;
  created_at: string;
  description: string;
  revenue: string;
  tax_identifier: string;
  country: string;
  context_links?: string[];
  nb_contacts?: number;
  nb_opportunities?: number;

  // New organization fields
  organization_type?: OrganizationType;
  is_principal?: boolean;
  is_distributor?: boolean;
  parent_company_id?: Identifier;
  segment?: string;
  priority?: CompanyPriority;
  deleted_at?: string;
} & Pick<RaRecord, "id">;

export type EmailAndType = {
  email: string;
  type: "Work" | "Home" | "Other";
};

export type PhoneNumberAndType = {
  number: string;
  type: "Work" | "Home" | "Other";
};

export type Contact = {
  first_name: string;
  last_name: string;
  title: string;
  company_id: Identifier; // Backward compatibility - primary organization
  email_jsonb: EmailAndType[];
  avatar?: Partial<RAFile>;
  linkedin_url?: string | null;
  first_seen: string;
  last_seen: string;
  has_newsletter: boolean;
  tags: Identifier[];
  gender: string;
  sales_id: Identifier;
  status: string;
  background: string;
  phone_jsonb: PhoneNumberAndType[];

  // Primary organization fields (backward compatibility)
  role?: ContactRole;
  department?: string;
  is_primary_contact?: boolean;
  purchase_influence?: PurchaseInfluence;
  decision_authority?: DecisionAuthority;
  deleted_at?: string;

  // Multi-organization support
  organizations?: ContactOrganization[]; // All organization relationships
  organization_ids?: Identifier[]; // For form input handling

  // Calculated fields
  nb_tasks?: number;
  company_name?: string;
  total_organizations?: number;
} & Pick<RaRecord, "id">;

export type ContactOrganization = {
  id?: Identifier; // Optional for new records
  contact_id: Identifier;
  organization_id: Identifier;
  is_primary_organization: boolean; // Fixed field name to match tests
  is_primary_contact?: boolean; // Legacy backward compatibility
  purchase_influence: PurchaseInfluence;
  decision_authority: DecisionAuthority;
  role?: ContactRole;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
};

export type OpportunityParticipant = {
  id: Identifier;
  opportunity_id: Identifier;
  organization_id: Identifier;
  role: 'customer' | 'principal' | 'distributor' | 'partner' | 'competitor';
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
  activity_type: 'engagement' | 'interaction';
  type: 'call' | 'email' | 'meeting' | 'demo' | 'follow_up' | 'visit' | 'proposal' | 'negotiation';
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
  sentiment?: 'positive' | 'neutral' | 'negative';
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
  date: string;
  sales_id: Identifier;
  status: string;
  attachments?: AttachmentNote[];
} & Pick<RaRecord, "id">;

// Deal type removed - use Opportunity instead

export type Opportunity = {
  name: string;
  customer_organization_id: Identifier;
  principal_organization_id?: Identifier;
  distributor_organization_id?: Identifier;
  contact_ids: Identifier[];
  category: string;
  stage: 'lead' | 'qualified' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'nurturing';
  status: 'active' | 'on_hold' | 'nurturing' | 'stalled' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  amount: number;
  probability: number;
  estimated_close_date?: string;
  actual_close_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  expected_closing_date: string;
  sales_id: Identifier;
  index: number;
  founding_interaction_id?: Identifier;
  stage_manual: boolean;
  status_manual: boolean;
  next_action?: string;
  next_action_date?: string;
  competition?: string;
  decision_criteria?: string;
  // Backward compatibility
  company_id?: Identifier;
  archived_at?: string;
} & Pick<RaRecord, "id">;

// DealNote type removed - use OpportunityNote instead

export type OpportunityNote = {
  opportunity_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  attachments?: AttachmentNote[];

  // This is defined for compatibility with `ContactNote`
  status?: undefined;
} & Pick<RaRecord, "id">;

export type Tag = {
  name: string;
  color: string;
} & Pick<RaRecord, "id">;

export type Task = {
  contact_id: Identifier;
  type: string;
  text: string;
  due_date: string;
  done_date?: string | null;
  sales_id?: Identifier;
} & Pick<RaRecord, "id">;

export type ActivityCompanyCreated = {
  type: typeof COMPANY_CREATED;
  company_id: Identifier;
  company: Company;
  sales_id: Identifier;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactCreated = {
  type: typeof CONTACT_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  contact: Contact;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactNoteCreated = {
  type: typeof CONTACT_NOTE_CREATED;
  sales_id?: Identifier;
  contactNote: ContactNote;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityOpportunityCreated = {
  type: typeof OPPORTUNITY_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  opportunity: Opportunity;
  date: string;
};

export type ActivityOpportunityNoteCreated = {
  type: typeof OPPORTUNITY_NOTE_CREATED;
  sales_id?: Identifier;
  opportunityNote: OpportunityNote;
  date: string;
};

export type Activity = RaRecord &
  (
    | ActivityCompanyCreated
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
