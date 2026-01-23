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
// Note: OpportunityStageValue, LeadSource, SampleStatus are re-exported below
// Database enum import removed - InteractionType now comes from re-exported ActivityRecord

// ============================================================================
// P2 TYPE CONSOLIDATION: Zod-inferred types as Single Source of Truth
// Manual interfaces are replaced with z.infer<typeof schema> types
// View types extend base types with computed fields from database views
// ============================================================================

// Re-export enum types from canonical validation schemas (P1/P2 consolidation)
export type { OrganizationType, OrganizationPriority } from "./validation/organizations";
export type {
  LeadSource,
  OpportunityStageValue,
  OpportunityPriority,
} from "./validation/opportunities";
export type { SampleStatus, Sentiment } from "./validation/activities";
export type { SalesRole, Sale } from "./validation/sales";

// Re-export Zod-inferred types from validation schemas (P2 consolidation)
export type { Tag } from "./validation/tags";
export type { Task, TaskType, PriorityLevel } from "./validation/task";
export type { RAFile } from "./validation/shared/ra-file";
import type { RAFile as RAFileBase } from "./validation/shared/ra-file";
export type {
  OpportunityParticipant,
  OpportunityContact,
  Opportunity,
} from "./validation/opportunities";
import type { Opportunity as OpportunityBase } from "./validation/opportunities";
export type { ProductFormData } from "./validation/products";
import type { ProductFormData as ProductBase } from "./validation/products";

// Contact and ActivityRecord types (P2 consolidation)
export type { Contact } from "./validation/contacts/contacts-core";
import type { Contact as ContactBase } from "./validation/contacts/contacts-core";
export type { ActivityRecord } from "./validation/activities";
import type { ActivityRecord as ActivityRecordBase } from "./validation/activities";

// InteractionType is now derived from ActivityRecord schema
// (exported from validation/activities.ts as part of P2 consolidation)

// SignUpData type removed - all users created through Sales management

export interface SalesFormData {
  avatar_url: string;
  email: string;
  password?: string; // Optional - user sets via invite email
  first_name: string;
  last_name: string;
  role: "admin" | "manager" | "rep"; // Primary field (from DB enum)
  disabled: boolean;
}

// Sale type is now exported from validation/sales.ts (P2 consolidation)
// The schema includes: id, first_name, last_name, email, avatar_url, role, user_id,
// administrator, disabled, digest_opt_in, timezone, etc.

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
  value: string;
  type: "work" | "home" | "other";
}

export interface PhoneNumberAndType {
  value: string;
  type: "work" | "home" | "other";
}

// Contact type is now exported from validation/contacts/contacts-core.ts (P2 consolidation)
// The schema includes: id, first_name, last_name, name, title, email, phone, avatar,
// linkedin_url, first_seen, last_seen, tags, gender, status, notes, organization_id,
// department, department_type, manager_id, sales_id, district_code, territory_name,
// birthday, twitter_handle, address fields, created_at/updated_at/deleted_at,
// nb_notes, nb_tasks, nb_activities, company_name (computed view fields)
//
// Legacy fields removed (not in database schema):
// - has_newsletter, opportunity_owner_id, background

// ContactOrganization interface removed - junction table was deprecated.
// Contacts now use a direct organization_id FK (single org per contact).

// OpportunityParticipant type is now exported from validation/opportunities (P2 consolidation)
// Defined in validation/opportunities/opportunities-junctions.ts

// OpportunityContact type is now exported from validation/opportunities (P2 consolidation)
// Defined in validation/opportunities/opportunities-junctions.ts

// SampleStatus type removed - now imported from validation/activities.ts (P2 consolidation)

// ActivityRecord type is now exported from validation/activities.ts (P2 consolidation)
// The schema includes: id, activity_type, type, subject, description, activity_date,
// duration_minutes, contact_id, organization_id, opportunity_id, follow_up_required,
// follow_up_date, follow_up_notes, outcome, sentiment, attachments, location, attendees,
// tags, sample_status, created_by, created_at, updated_at, deleted_at,
// and STI task fields (due_date, reminder_date, completed, priority, etc.)

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

// Opportunity type is now exported from validation/opportunities (P2 consolidation)
// The schema includes all core fields plus:
// - Organization relationships (customer, principal, distributor)
// - Ownership pattern (opportunity_owner_id, account_manager_id, created_by)
// - Stage workflow (stage, status, stage_manual, status_manual)
// - Close tracking (win_reason, loss_reason, close_reason_notes)
// - Computed view fields (days_in_stage, task counts, etc.)
//
// See validation/opportunities/opportunities-core.ts for complete field list

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

// Tag type is now exported from validation/tags.ts (P2 consolidation)

// Task type is now exported from validation/task.ts (P2 consolidation)
// The schema includes: id, title, description, due_date, reminder_date, completed,
// completed_at, priority, type, contact_id, opportunity_id, organization_id,
// sales_id, snooze_until, created_by, created_at, updated_at, deleted_at

export interface DashboardSnapshot extends Pick<RaRecord, "id"> {
  snapshot_date: string; // ISO date string (YYYY-MM-DD)
  sales_id: Identifier;
  // Performance metrics (matching useMyPerformance hook)
  activities_count: number;
  tasks_completed_count: number;
  deals_moved_count: number;
  open_opportunities_count: number;
  // KPI metrics (matching useKPIMetrics hook)
  total_opportunities_count: number;
  overdue_tasks_count: number;
  activities_this_week_count: number;
  stale_deals_count: number;
  // Metadata
  created_at: string;
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
  contact: ContactBase;
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
  opportunity: OpportunityBase;
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

// RAFile type is now exported from validation/shared/ra-file.ts (P2 consolidation)
// Extended RAFile type with legacy fields for backward compatibility
export type RAFileView = RAFileBase & {
  path?: string;
  type?: string;
};

export type AttachmentNote = RAFileBase;
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

// Product base type from validation/products.ts (P2 consolidation)
// ProductFormData is re-exported above
/**
 * Product type - combines Zod schema base with view/database fields
 * Base: ProductFormData from validation schema
 * Extended: Fields from database columns and products_summary view
 */
export type Product = ProductBase & {
  id?: Identifier;
  // Database columns not in the form schema
  manufacturer_part_number?: string | null;
  list_price?: number | null;
  currency_code?: string | null;
  unit_of_measure?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  // Computed fields from products_summary view (read-only)
  principal_name?: string;
};
