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
import type { OpportunityStageValue, LeadSource } from "./validation/opportunities";
import type { SampleStatus } from "./validation/activities";
import type { Database } from "@/types/database.generated";

// Re-export enum types from canonical validation schemas (P1/P2 consolidation)
export type { OrganizationType, OrganizationPriority } from "./validation/organizations";
export type {
  LeadSource,
  OpportunityStageValue,
  OpportunityPriority,
} from "./validation/opportunities";
export type { SampleStatus, Sentiment } from "./validation/activities";
export type { SalesRole } from "./validation/sales";

// Use generated enum as single source of truth for interaction types
// Note: This comes from database.generated.ts, validation schema mirrors it
type InteractionType = Database["public"]["Enums"]["interaction_type"];

// SignUpData type removed - all users created through Sales management

export interface SalesFormData {
  avatar: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: "admin" | "manager" | "rep"; // Primary field (from DB enum)
  disabled: boolean;
}

export interface Sale extends Pick<RaRecord, "id"> {
  first_name: string;
  last_name: string;
  role: "admin" | "manager" | "rep"; // Primary field (single source of truth)
  administrator?: boolean; // Computed column (backward compatibility)
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;
  digest_opt_in?: boolean; // Email digest preference (default true)
  timezone?: string; // IANA timezone (e.g., 'America/New_York')

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
}

// Organization type (imported from validation)
export type { Organization } from "./validation/organizations";
// Company is an alias for Organization for backward compatibility
export type Company = Organization;

/**
 * Organization with hierarchy computed fields
 * Extends Organization with data from database views
 */
export interface OrganizationWithHierarchy extends Organization {
  child_branch_count?: number;
  parent_organization_name?: string;
  total_contacts_across_branches?: number;
  total_opportunities_across_branches?: number;
}

export interface EmailAndType {
  email: string;
  type: "Work" | "Home" | "Other";
}

export interface PhoneNumberAndType {
  number: string;
  type: "Work" | "Home" | "Other";
}

export interface Contact extends Pick<RaRecord, "id"> {
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

  // Sales assignment (optional - matches database schema where sales_id is nullable)
  sales_id?: Identifier | null;

  // Calculated fields from contacts_summary view
  nb_notes?: number;
  nb_tasks?: number;
  nb_activities?: number;
  company_name?: string;
}

// ContactOrganization interface removed - junction table was deprecated.
// Contacts now use a direct organization_id FK (single org per contact).

export interface OpportunityParticipant extends Pick<RaRecord, "id"> {
  id: Identifier;
  opportunity_id: Identifier;
  organization_id: Identifier;
  role: "customer" | "principal" | "distributor" | "competitor";
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: Identifier;
  deleted_at?: string;
  // Note: commission_rate removed - Phase 3 feature per PRD
}

/**
 * Opportunity Contact Junction Table Record
 * Links opportunities to contacts with additional metadata
 */
export interface OpportunityContact extends Pick<RaRecord, "id"> {
  id: Identifier;
  opportunity_id: Identifier;
  contact_id: Identifier;
  role?: string | null;
  is_primary: boolean;
  notes?: string | null;
  created_at: string;
}

// SampleStatus type removed - now imported from validation/activities.ts (P2 consolidation)

export interface ActivityRecord extends Pick<RaRecord, "id"> {
  id: Identifier;
  activity_type: "engagement" | "interaction";
  type: InteractionType;
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
  // Sample tracking (PRD §4.4) - only set when type === 'sample'
  sample_status?: SampleStatus;
  created_at: string;
  updated_at?: string;
  created_by?: Identifier;
  deleted_at?: string;
}

export interface InteractionParticipant extends Pick<RaRecord, "id"> {
  id: Identifier;
  activity_id: Identifier;
  contact_id?: Identifier;
  organization_id?: Identifier;
  role?: string;
  notes?: string;
  created_at: string;
}

export interface ContactNote extends Pick<RaRecord, "id"> {
  contact_id: Identifier;
  text: string;
  created_at: string;
  updated_at: string;
  status?: undefined;
  attachments?: AttachmentNote[];
  sales_id?: Identifier; // Note author (matches database schema)
}

// Deal type removed - use Opportunity instead
// LeadSource type removed - now imported from validation/opportunities.ts (P1 consolidation)

/**
 * Opportunity entity - represents a sales deal in the CRM.
 *
 * OWNERSHIP PATTERN (3 fields, intentionally different from other entities):
 * - `opportunity_owner_id` - Sales rep who owns/drives this deal (closes it)
 * - `account_manager_id` - Sales rep who manages the customer relationship (may differ from owner)
 * - `created_by` - Audit trail: who originally created this opportunity
 *
 * This split ownership model supports enterprise sales scenarios where the deal owner
 * and account manager may be different people. Other entities (contacts, tasks, etc.)
 * use a simpler `sales_id` field for single ownership.
 *
 * RLS policies check ALL THREE fields for UPDATE access.
 */
export interface Opportunity extends Pick<RaRecord, "id"> {
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
  created_by?: Identifier;
  updated_at: string;
  stage_changed_at?: string;
  deleted_at?: string;
  opportunity_owner_id?: Identifier;
  account_manager_id?: Identifier;
  lead_source?: LeadSource;
  founding_interaction_id?: Identifier;
  stage_manual: boolean;
  status_manual: boolean;
  next_action?: string;
  next_action_date?: string;
  competition?: string;
  decision_criteria?: string;
  tags?: string[];
  campaign?: string; // Campaign name for grouping related opportunities (e.g., "Winter Fancy Food Show 2025")
  related_opportunity_id?: Identifier; // Parent opportunity ID for follow-up tracking
  notes?: string; // General notes about the opportunity (separate from activity log)

  // Computed fields from opportunities_summary view (read-only)
  nb_interactions?: number;
  last_interaction_date?: string;
  days_in_stage?: number;
  customer_organization_name?: string;
  principal_organization_name?: string;
  distributor_organization_name?: string;
  products?: Array<{
    id: Identifier;
    product_id_reference: Identifier;
    product_name: string;
    product_category?: string;
    principal_name?: string;
    notes?: string;
  }>;

  // Visual cue computed fields for Kanban cards (from opportunities_summary view)
  days_since_last_activity?: number | null;
  pending_task_count?: number;
  overdue_task_count?: number;

  // Close outcome tracking (for closed_won/closed_lost stages)
  win_reason?: string;
  loss_reason?: string;
  close_reason_notes?: string;
}

// DealNote type removed - use OpportunityNote instead

export interface OpportunityNote extends Pick<RaRecord, "id"> {
  opportunity_id: Identifier;
  text: string;
  created_at: string;
  updated_at: string;
  opportunity_owner_id: Identifier;
  attachments?: AttachmentNote[];
  sales_id?: Identifier; // Note author (matches database schema)

  // This is defined for compatibility with `ContactNote`
  status?: undefined;
}

export interface OrganizationNote extends Pick<RaRecord, "id"> {
  organization_id: Identifier;
  text: string;
  date: string;
  created_at: string;
  updated_at: string;
  sales_id: Identifier;
  attachments?: AttachmentNote[];

  // This is defined for compatibility with `ContactNote`
  status?: undefined;
}

export interface Tag extends Pick<RaRecord, "id"> {
  name: string;
  color: string;
}

export interface Task extends Pick<RaRecord, "id"> {
  title: string;
  description?: string | null;
  contact_id?: Identifier;
  organization_id?: Identifier;
  type: Database["public"]["Enums"]["task_type"];
  due_date: string;
  reminder_date?: string | null;
  completed?: boolean;
  completed_at?: string | null;
  priority?: Database["public"]["Enums"]["priority_level"];
  opportunity_id?: Identifier;
  sales_id?: Identifier;
  opportunity_owner_id?: Identifier;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityOrganizationCreated extends Pick<RaRecord, "id"> {
  type: typeof ORGANIZATION_CREATED;
  organization_id: Identifier;
  organization: Organization;
  opportunity_owner_id: Identifier;
  date: string;
}

export interface ActivityContactCreated extends Pick<RaRecord, "id"> {
  type: typeof CONTACT_CREATED;
  customer_organization_id: Identifier;
  opportunity_owner_id?: Identifier;
  contact: Contact;
  date: string;
}

export interface ActivityContactNoteCreated extends Pick<RaRecord, "id"> {
  type: typeof CONTACT_NOTE_CREATED;
  opportunity_owner_id?: Identifier;
  contactNote: ContactNote;
  date: string;
}

export interface ActivityOpportunityCreated {
  type: typeof OPPORTUNITY_CREATED;
  customer_organization_id: Identifier;
  opportunity_owner_id?: Identifier;
  opportunity: Opportunity;
  date: string;
}

export interface ActivityOpportunityNoteCreated {
  type: typeof OPPORTUNITY_NOTE_CREATED;
  opportunity_owner_id?: Identifier;
  opportunityNote: OpportunityNote;
  date: string;
}

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
