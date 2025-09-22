/**
 * TypeScript Type Definitions for Merged CRM Database
 * Generated for Stage 1 Migration
 * Date: 2025-01-22
 */

// =====================================================
// ENUM TYPES
// =====================================================

export type OrganizationType =
  | 'customer'
  | 'principal'
  | 'distributor'
  | 'prospect'
  | 'vendor'
  | 'partner'
  | 'unknown';

export type ContactRole =
  | 'decision_maker'
  | 'influencer'
  | 'buyer'
  | 'end_user'
  | 'gatekeeper'
  | 'champion'
  | 'technical'
  | 'executive';

export type OpportunityStage =
  | 'lead'
  | 'qualified'
  | 'needs_analysis'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'nurturing';

export type OpportunityStatus =
  | 'active'
  | 'on_hold'
  | 'nurturing'
  | 'stalled'
  | 'expired';

export type InteractionType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'demo'
  | 'proposal'
  | 'follow_up'
  | 'trade_show'
  | 'site_visit'
  | 'contract_review'
  | 'check_in'
  | 'social';

export type ActivityType = 'engagement' | 'interaction';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export type PurchaseInfluence = 'High' | 'Medium' | 'Low' | 'Unknown';

export type DecisionAuthority =
  | 'Decision Maker'
  | 'Influencer'
  | 'End User'
  | 'Gatekeeper';

export type RelationshipType =
  | 'professional'
  | 'personal'
  | 'historical'
  | 'competitive';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type ParticipantRole =
  | 'customer'
  | 'principal'
  | 'distributor'
  | 'partner'
  | 'competitor';

// =====================================================
// BASE TYPES
// =====================================================

interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  deleted_at?: string | null;
}

// =====================================================
// CORE ENTITIES
// =====================================================

export interface Company extends BaseEntity {
  name: string;
  industry?: string | null;
  website?: string | null;
  address?: string | null;
  archived_at?: string | null;
  email_jsonb?: Record<string, any> | null;
  phone_jsonb?: Record<string, any> | null;
  logo?: Record<string, any> | null;

  // New fields from migration
  organization_type: OrganizationType;
  is_principal: boolean;
  is_distributor: boolean;
  parent_company_id?: number | null;
  segment: string;
  priority: 'A' | 'B' | 'C' | 'D';
  import_session_id?: string | null;
  search_tsv?: any;
}

export interface Contact extends BaseEntity {
  name: string;
  title?: string | null;
  email_jsonb?: Record<string, any> | null;
  phone_jsonb?: Record<string, any> | null;
  avatar?: Record<string, any> | null;
  company_id?: number | null;  // Legacy, use ContactOrganization
  sale_id?: number | null;
  archived_at?: string | null;

  // New fields from migration
  role?: ContactRole | null;
  department?: string | null;
  is_primary_contact: boolean;
  purchase_influence: PurchaseInfluence;
  decision_authority: DecisionAuthority;
  search_tsv?: any;
}

export interface Opportunity extends BaseEntity {
  name: string;
  description?: string | null;
  company_id?: number | null;  // Legacy
  contact_id?: number | null;
  contact_ids?: number[] | null;
  sale_id?: number | null;
  archived_at?: string | null;

  // New fields from migration
  stage: OpportunityStage;
  status: OpportunityStatus;
  priority: PriorityLevel;
  probability: number;
  estimated_value?: number | null;
  estimated_close_date?: string | null;
  actual_close_date?: string | null;
  customer_organization_id?: number | null;
  principal_organization_id?: number | null;  // Legacy
  distributor_organization_id?: number | null;  // Legacy
  founding_interaction_id?: number | null;
  stage_manual: boolean;
  status_manual: boolean;
  next_action?: string | null;
  next_action_date?: string | null;
  competition?: string | null;
  decision_criteria?: string | null;
  search_tsv?: any;
}

export interface Activity extends BaseEntity {
  activity_type: ActivityType;
  type: InteractionType;
  subject: string;
  description?: string | null;
  activity_date: string;
  duration_minutes?: number | null;
  contact_id?: number | null;
  organization_id?: number | null;
  opportunity_id?: number | null;  // Required for interactions
  follow_up_required: boolean;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  outcome?: string | null;
  sentiment?: Sentiment | null;
  attachments?: string[] | null;
  location?: string | null;
  attendees?: string[] | null;
  tags?: string[] | null;
}

export interface Sales extends BaseEntity {
  email: string;
  name?: string | null;
  user_id?: string | null;
  archived_at?: string | null;
}

export interface Task extends BaseEntity {
  name: string;
  description?: string | null;
  due_date?: string | null;
  completed: boolean;
  company_id?: number | null;
  contact_id?: number | null;
  deal_id?: number | null;
  sale_id?: number | null;
  archived_at?: string | null;
}

// =====================================================
// JUNCTION TABLES
// =====================================================

export interface ContactOrganization extends BaseEntity {
  contact_id: number;
  organization_id: number;
  is_primary_decision_maker: boolean;
  is_primary_contact: boolean;
  role?: ContactRole | null;
  purchase_influence: PurchaseInfluence;
  decision_authority: DecisionAuthority;
  relationship_start_date?: string;
  relationship_end_date?: string | null;
  notes?: string | null;
}

export interface ContactPreferredPrincipal extends BaseEntity {
  contact_id: number;
  principal_organization_id: number;
  advocacy_strength: number;  // 1-10
  advocacy_notes?: string | null;
  relationship_type: RelationshipType;
  purchase_influence_for_principal: PurchaseInfluence;
  last_interaction_date?: string | null;
}

export interface OpportunityParticipant extends BaseEntity {
  opportunity_id: number;
  organization_id: number;
  role: ParticipantRole;
  is_primary: boolean;
  commission_rate?: number | null;  // 0-1
  territory?: string | null;
  notes?: string | null;
}

export interface OpportunityProduct extends BaseEntity {
  opportunity_id: number;
  product_id?: number | null;
  product_name: string;
  product_category?: string | null;
  quantity: number;
  unit_price?: number | null;
  extended_price?: number | null;  // Generated
  discount_percent: number;
  final_price?: number | null;  // Generated
  notes?: string | null;
}

export interface InteractionParticipant {
  id: number;
  activity_id: number;
  contact_id?: number | null;
  organization_id?: number | null;
  role: string;
  notes?: string | null;
  created_at: string;
}

// =====================================================
// STAGE 1.5 - SIMPLE PRINCIPAL FEATURES
// =====================================================

export interface Product extends BaseEntity {
  principal_id: number;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  unit_price?: number | null;
  unit_cost?: number | null;
  is_active: boolean;
  min_order_quantity: number;
}

export interface PrincipalDistributorRelationship extends BaseEntity {
  principal_id: number;
  distributor_id: number;
  relationship_status: 'active' | 'pending' | 'terminated';
  start_date?: string;
  end_date?: string | null;
  commission_percent?: number | null;
  notes?: string | null;
}

// =====================================================
// NOTE TABLES
// =====================================================

export interface CompanyNote extends BaseEntity {
  company_id: number;
  note: string;
  sale_id?: number | null;
}

export interface ContactNote extends BaseEntity {
  contact_id: number;
  note: string;
  sale_id?: number | null;
}

export interface OpportunityNote extends BaseEntity {
  opportunity_id: number;  // Renamed from deal_id
  note: string;
  sale_id?: number | null;
}

// =====================================================
// HELPER TYPES
// =====================================================

export interface MigrationHistory {
  id: number;
  phase_number: string;
  phase_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  rollback_sql?: string | null;
  created_at: string;
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface ContactInfluenceProfile {
  contact_id: number;
  contact_name: string;
  title?: string | null;
  organization_count: number;
  advocated_principals_count: number;
  avg_advocacy_strength: number;
  highest_role: string;
  organizations?: string | null;
  advocated_principals?: string | null;
}

export interface PrincipalAdvocacyDashboard {
  principal_id: number;
  principal_name: string;
  advocate_count: number;
  reached_organizations: number;
  avg_advocacy_strength: number;
  strong_advocates: number;
  moderate_advocates: number;
  weak_advocates: number;
}

export interface OpportunitiesWithParticipants extends Opportunity {
  primary_customer?: {
    id: number;
    name: string;
    type: OrganizationType;
  } | null;
  principals?: Array<{
    id: number;
    name: string;
    is_primary: boolean;
  }> | null;
  distributors?: Array<{
    id: number;
    name: string;
    is_primary: boolean;
    commission_rate?: number | null;
  }> | null;
  participant_count: number;
  principal_count: number;
}

export interface EngagementAnalytics {
  month: string;
  engagement_type: InteractionType;
  total_count: number;
  unique_contacts: number;
  unique_organizations: number;
  avg_duration?: number | null;
  follow_ups_required: number;
  positive_sentiment: number;
  negative_sentiment: number;
}

export interface InteractionAnalytics {
  opportunity_id: number;
  opportunity_name: string;
  opportunity_stage: OpportunityStage;
  total_interactions: number;
  last_interaction?: string | null;
  first_interaction?: string | null;
  interaction_types_used: number;
  avg_duration?: number | null;
  positive_interactions: number;
  negative_interactions: number;
  days_since_last_interaction?: number | null;
}

export interface ContactEngagementSummary {
  contact_id: number;
  contact_name: string;
  total_activities: number;
  engagements: number;
  interactions: number;
  opportunities_touched: number;
  last_activity?: string | null;
  avg_interaction_duration?: number | null;
  activity_types?: string | null;
}

// =====================================================
// STAGE 1.5 VIEW TYPES
// =====================================================

export interface PrincipalProductSummary {
  principal_id: number;
  principal_name: string;
  product_count: number;
  active_product_count: number;
  category_count: number;
  distributor_count: number;
  avg_commission_percent?: number | null;
}

export interface DistributorRelationshipSummary {
  distributor_id: number;
  distributor_name: string;
  principal_count: number;
  available_products: number;
  avg_commission?: number | null;
  principal_names?: string | null;
}

// =====================================================
// FUNCTION PARAMETER TYPES
// =====================================================

export interface CreateOpportunityParams {
  opportunity_data: {
    name: string;
    description?: string;
    stage?: OpportunityStage;
    status?: OpportunityStatus;
    priority?: PriorityLevel;
    estimated_value?: number;
    estimated_close_date?: string;
    contact_id?: number;
    sale_id?: number;
  };
  participants: Array<{
    organization_id: number;
    role: ParticipantRole;
    is_primary?: boolean;
    commission_rate?: number;
    territory?: string;
    notes?: string;
    created_by?: number;
  }>;
}

export interface LogEngagementParams {
  type: InteractionType;
  subject: string;
  description?: string;
  contact_id?: number;
  organization_id?: number;
  activity_date?: string;
  duration_minutes?: number;
  follow_up_required?: boolean;
  follow_up_date?: string;
  outcome?: string;
  created_by?: number;
}

export interface LogInteractionParams extends LogEngagementParams {
  opportunity_id: number;
  sentiment?: Sentiment;
}

// Stage 1.5 Function Parameters
export interface AddProductParams {
  principal_id: number;
  name: string;
  sku: string;
  category?: string;
  unit_price?: number;
  description?: string;
  created_by?: number;
}

// =====================================================
// DATABASE CLIENT TYPES
// =====================================================

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Partial<Company>;
        Update: Partial<Company>;
      };
      contacts: {
        Row: Contact;
        Insert: Partial<Contact>;
        Update: Partial<Contact>;
      };
      opportunities: {
        Row: Opportunity;
        Insert: Partial<Opportunity>;
        Update: Partial<Opportunity>;
      };
      activities: {
        Row: Activity;
        Insert: Partial<Activity>;
        Update: Partial<Activity>;
      };
      contact_organizations: {
        Row: ContactOrganization;
        Insert: Partial<ContactOrganization>;
        Update: Partial<ContactOrganization>;
      };
      contact_preferred_principals: {
        Row: ContactPreferredPrincipal;
        Insert: Partial<ContactPreferredPrincipal>;
        Update: Partial<ContactPreferredPrincipal>;
      };
      opportunity_participants: {
        Row: OpportunityParticipant;
        Insert: Partial<OpportunityParticipant>;
        Update: Partial<OpportunityParticipant>;
      };
      opportunity_products: {
        Row: OpportunityProduct;
        Insert: Partial<OpportunityProduct>;
        Update: Partial<OpportunityProduct>;
      };
      sales: {
        Row: Sales;
        Insert: Partial<Sales>;
        Update: Partial<Sales>;
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task>;
        Update: Partial<Task>;
      };
      products: {
        Row: Product;
        Insert: Partial<Product>;
        Update: Partial<Product>;
      };
      principal_distributor_relationships: {
        Row: PrincipalDistributorRelationship;
        Insert: Partial<PrincipalDistributorRelationship>;
        Update: Partial<PrincipalDistributorRelationship>;
      };
    };
    Views: {
      contact_influence_profile: {
        Row: ContactInfluenceProfile;
      };
      principal_advocacy_dashboard: {
        Row: PrincipalAdvocacyDashboard;
      };
      opportunities_with_participants: {
        Row: OpportunitiesWithParticipants;
      };
      engagement_analytics: {
        Row: EngagementAnalytics;
      };
      interaction_analytics: {
        Row: InteractionAnalytics;
      };
      contact_engagement_summary: {
        Row: ContactEngagementSummary;
      };
      principal_product_summary: {
        Row: PrincipalProductSummary;
      };
      distributor_relationship_summary: {
        Row: DistributorRelationshipSummary;
      };
    };
    Functions: {
      create_opportunity_with_participants: {
        Args: CreateOpportunityParams;
        Returns: number;
      };
      log_engagement: {
        Args: LogEngagementParams;
        Returns: number;
      };
      log_interaction: {
        Args: LogInteractionParams;
        Returns: number;
      };
      get_activity_timeline: {
        Args: {
          p_entity_type: 'contact' | 'organization' | 'opportunity';
          p_entity_id: number;
          p_limit?: number;
        };
        Returns: Array<{
          activity_id: number;
          activity_type: ActivityType;
          interaction_type: InteractionType;
          subject: string;
          description?: string;
          activity_date: string;
          duration_minutes?: number;
          contact_name?: string;
          organization_name?: string;
          opportunity_name?: string;
          outcome?: string;
          sentiment?: Sentiment;
          follow_up_required: boolean;
          follow_up_date?: string;
        }>;
      };
      // Stage 1.5 Functions
      add_product: {
        Args: AddProductParams;
        Returns: number;
      };
      get_distributor_products: {
        Args: { p_distributor_id: number };
        Returns: Array<{
          product_id: number;
          product_name: string;
          sku: string;
          category?: string;
          unit_price?: number;
          principal_id: number;
          principal_name: string;
          commission_percent?: number;
        }>;
      };
      get_principal_distributors: {
        Args: { p_principal_id: number };
        Returns: Array<{
          distributor_id: number;
          distributor_name: string;
          relationship_status: string;
          commission_percent?: number;
          start_date?: string;
          opportunity_count: number;
        }>;
      };
    };
  };
}