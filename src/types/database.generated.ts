WARN: no SMS provider is enabled. Disabling phone login
Connecting to db 5432
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string | null
          activity_type: Database["public"]["Enums"]["activity_type"]
          attachments: string[] | null
          attendees: string[] | null
          contact_id: number | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          description: string | null
          duration_minutes: number | null
          follow_up_date: string | null
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: number
          location: string | null
          opportunity_id: number | null
          organization_id: number | null
          outcome: string | null
          sentiment: string | null
          subject: string
          tags: string[] | null
          type: Database["public"]["Enums"]["interaction_type"]
          updated_at: string | null
        }
        Insert: {
          activity_date?: string | null
          activity_type: Database["public"]["Enums"]["activity_type"]
          attachments?: string[] | null
          attendees?: string[] | null
          contact_id?: number | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: number
          location?: string | null
          opportunity_id?: number | null
          organization_id?: number | null
          outcome?: string | null
          sentiment?: string | null
          subject: string
          tags?: string[] | null
          type: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string | null
        }
        Update: {
          activity_date?: string | null
          activity_type?: Database["public"]["Enums"]["activity_type"]
          attachments?: string[] | null
          attendees?: string[] | null
          contact_id?: number | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: number
          location?: string | null
          opportunity_id?: number | null
          organization_id?: number | null
          outcome?: string | null
          sentiment?: string | null
          subject?: string
          tags?: string[] | null
          type?: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_organizations: {
        Row: {
          contact_id: number
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          id: number
          is_primary: boolean | null
          is_primary_decision_maker: boolean | null
          notes: string | null
          organization_id: number
          relationship_end_date: string | null
          relationship_start_date: string | null
          updated_at: string | null
        }
        Insert: {
          contact_id: number
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          is_primary?: boolean | null
          is_primary_decision_maker?: boolean | null
          notes?: string | null
          organization_id: number
          relationship_end_date?: string | null
          relationship_start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: number
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          is_primary?: boolean | null
          is_primary_decision_maker?: boolean | null
          notes?: string | null
          organization_id?: number
          relationship_end_date?: string | null
          relationship_start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_organizations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_organizations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_preferred_principals: {
        Row: {
          advocacy_strength: number | null
          contact_id: number
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          id: number
          last_interaction_date: string | null
          notes: string | null
          principal_organization_id: number
          updated_at: string | null
        }
        Insert: {
          advocacy_strength?: number | null
          contact_id: number
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          last_interaction_date?: string | null
          notes?: string | null
          principal_organization_id: number
          updated_at?: string | null
        }
        Update: {
          advocacy_strength?: number | null
          contact_id?: number
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          last_interaction_date?: string | null
          notes?: string | null
          principal_organization_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_preferred_principals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_preferred_principals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_preferred_principals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      contactNotes: {
        Row: {
          attachments: string[] | null
          contact_id: number
          created_at: string | null
          created_by: number | null
          date: string
          id: number
          sales_id: number | null
          text: string
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          attachments?: string[] | null
          contact_id: number
          created_at?: string | null
          created_by?: number | null
          date?: string
          id?: number
          sales_id?: number | null
          text: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          attachments?: string[] | null
          contact_id?: number
          created_at?: string | null
          created_by?: number | null
          date?: string
          id?: number
          sales_id?: number | null
          text?: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contactNotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactNotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactNotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactNotes_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactNotes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          birthday: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          department: string | null
          email: Json | null
          first_name: string | null
          first_seen: string | null
          gender: string | null
          id: number
          last_name: string | null
          last_seen: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          organization_id: number | null
          phone: Json | null
          postal_code: string | null
          sales_id: number | null
          search_tsv: unknown
          state: string | null
          tags: number[] | null
          title: string | null
          twitter_handle: string | null
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          department?: string | null
          email?: Json | null
          first_name?: string | null
          first_seen?: string | null
          gender?: string | null
          id?: number
          last_name?: string | null
          last_seen?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          organization_id?: number | null
          phone?: Json | null
          postal_code?: string | null
          sales_id?: number | null
          search_tsv?: unknown
          state?: string | null
          tags?: number[] | null
          title?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          address?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          department?: string | null
          email?: Json | null
          first_name?: string | null
          first_seen?: string | null
          gender?: string | null
          id?: number
          last_name?: string | null
          last_seen?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          organization_id?: number | null
          phone?: Json | null
          postal_code?: string | null
          sales_id?: number | null
          search_tsv?: unknown
          state?: string | null
          tags?: number[] | null
          title?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      interaction_participants: {
        Row: {
          activity_id: number
          contact_id: number | null
          created_at: string | null
          id: number
          notes: string | null
          organization_id: number | null
          role: string | null
        }
        Insert: {
          activity_id: number
          contact_id?: number | null
          created_at?: string | null
          id?: number
          notes?: string | null
          organization_id?: number | null
          role?: string | null
        }
        Update: {
          activity_id?: number
          contact_id?: number | null
          created_at?: string | null
          id?: number
          notes?: string | null
          organization_id?: number | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interaction_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interaction_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interaction_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_history: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: number
          phase_name: string
          phase_number: string
          rollback_sql: string | null
          rows_affected: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          phase_name: string
          phase_number: string
          rollback_sql?: string | null
          rows_affected?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          phase_name?: string
          phase_number?: string
          rollback_sql?: string | null
          rows_affected?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          account_manager_id: number | null
          actual_close_date: string | null
          campaign: string | null
          close_reason_notes: string | null
          competition: string | null
          contact_ids: number[] | null
          created_at: string | null
          created_by: number | null
          customer_organization_id: number | null
          decision_criteria: string | null
          deleted_at: string | null
          description: string | null
          distributor_organization_id: number | null
          estimated_close_date: string | null
          founding_interaction_id: number | null
          id: number
          index: number | null
          lead_source: string | null
          loss_reason: string | null
          name: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          opportunity_owner_id: number | null
          principal_organization_id: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          related_opportunity_id: number | null
          search_tsv: unknown
          stage: Database["public"]["Enums"]["opportunity_stage"] | null
          stage_changed_at: string | null
          stage_manual: boolean | null
          status: Database["public"]["Enums"]["opportunity_status"] | null
          status_manual: boolean | null
          tags: string[] | null
          updated_at: string | null
          updated_by: number | null
          win_reason: string | null
        }
        Insert: {
          account_manager_id?: number | null
          actual_close_date?: string | null
          campaign?: string | null
          close_reason_notes?: string | null
          competition?: string | null
          contact_ids?: number[] | null
          created_at?: string | null
          created_by?: number | null
          customer_organization_id?: number | null
          decision_criteria?: string | null
          deleted_at?: string | null
          description?: string | null
          distributor_organization_id?: number | null
          estimated_close_date?: string | null
          founding_interaction_id?: number | null
          id?: number
          index?: number | null
          lead_source?: string | null
          loss_reason?: string | null
          name: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          opportunity_owner_id?: number | null
          principal_organization_id?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          related_opportunity_id?: number | null
          search_tsv?: unknown
          stage?: Database["public"]["Enums"]["opportunity_stage"] | null
          stage_changed_at?: string | null
          stage_manual?: boolean | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          status_manual?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: number | null
          win_reason?: string | null
        }
        Update: {
          account_manager_id?: number | null
          actual_close_date?: string | null
          campaign?: string | null
          close_reason_notes?: string | null
          competition?: string | null
          contact_ids?: number[] | null
          created_at?: string | null
          created_by?: number | null
          customer_organization_id?: number | null
          decision_criteria?: string | null
          deleted_at?: string | null
          description?: string | null
          distributor_organization_id?: number | null
          estimated_close_date?: string | null
          founding_interaction_id?: number | null
          id?: number
          index?: number | null
          lead_source?: string | null
          loss_reason?: string | null
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          opportunity_owner_id?: number | null
          principal_organization_id?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          related_opportunity_id?: number | null
          search_tsv?: unknown
          stage?: Database["public"]["Enums"]["opportunity_stage"] | null
          stage_changed_at?: string | null
          stage_manual?: boolean | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          status_manual?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: number | null
          win_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_related_opportunity_id_fkey"
            columns: ["related_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_related_opportunity_id_fkey"
            columns: ["related_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_sales_id_fkey"
            columns: ["opportunity_owner_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_participants: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          id: number
          is_primary: boolean | null
          notes: string | null
          opportunity_id: number
          organization_id: number
          role: string
          territory: string | null
          updated_at: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          is_primary?: boolean | null
          notes?: string | null
          opportunity_id: number
          organization_id: number
          role: string
          territory?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          is_primary?: boolean | null
          notes?: string | null
          opportunity_id?: number
          organization_id?: number
          role?: string
          territory?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_participants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_participants_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_participants_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_products: {
        Row: {
          created_at: string | null
          id: number
          notes: string | null
          opportunity_id: number | null
          product_category: string | null
          product_id_reference: number | null
          product_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          notes?: string | null
          opportunity_id?: number | null
          product_category?: string | null
          product_id_reference?: number | null
          product_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          notes?: string | null
          opportunity_id?: number | null
          product_category?: string | null
          product_id_reference?: number | null
          product_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_products_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_products_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_products_product_id_reference_fkey"
            columns: ["product_id_reference"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunityNotes: {
        Row: {
          attachments: string[] | null
          created_at: string | null
          created_by: number | null
          date: string
          id: number
          opportunity_id: number
          sales_id: number | null
          text: string
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string | null
          created_by?: number | null
          date?: string
          id?: number
          opportunity_id: number
          sales_id?: number | null
          text: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          attachments?: string[] | null
          created_at?: string | null
          created_by?: number | null
          date?: string
          id?: number
          opportunity_id?: number
          sales_id?: number | null
          text?: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunityNotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunityNotes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunityNotes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunityNotes_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunityNotes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          annual_revenue: number | null
          city: string | null
          context_links: Json | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          description: string | null
          email: string | null
          employee_count: number | null
          founded_year: number | null
          id: number
          import_session_id: string | null
          is_distributor: boolean | null
          is_principal: boolean | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          notes: string | null
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          parent_organization_id: number | null
          phone: string | null
          postal_code: string | null
          priority: string | null
          sales_id: number | null
          search_tsv: unknown
          segment_id: string | null
          state: string | null
          tax_identifier: string | null
          updated_at: string | null
          updated_by: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          city?: string | null
          context_links?: Json | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          founded_year?: number | null
          id?: number
          import_session_id?: string | null
          is_distributor?: boolean | null
          is_principal?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          parent_organization_id?: number | null
          phone?: string | null
          postal_code?: string | null
          priority?: string | null
          sales_id?: number | null
          search_tsv?: unknown
          segment_id?: string | null
          state?: string | null
          tax_identifier?: string | null
          updated_at?: string | null
          updated_by?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          city?: string | null
          context_links?: Json | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          founded_year?: number | null
          id?: number
          import_session_id?: string | null
          is_distributor?: boolean | null
          is_principal?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          parent_organization_id?: number | null
          phone?: string | null
          postal_code?: string | null
          priority?: string | null
          sales_id?: number | null
          search_tsv?: unknown
          segment_id?: string | null
          state?: string | null
          tax_identifier?: string | null
          updated_at?: string | null
          updated_by?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_industry_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      product_category_hierarchy: {
        Row: {
          attributes: Json | null
          category_name: string
          category_path: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: number
          level: number
          parent_category_id: number | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          category_name: string
          category_path?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: number
          level?: number
          parent_category_id?: number | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          category_name?: string
          category_path?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: number
          level?: number
          parent_category_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_category_hierarchy_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "product_category_hierarchy"
            referencedColumns: ["id"]
          },
        ]
      }
      product_distributor_authorizations: {
        Row: {
          authorization_date: string | null
          created_at: string | null
          created_by: number | null
          distributor_id: number
          expiration_date: string | null
          id: number
          is_authorized: boolean | null
          notes: string | null
          product_id: number
          special_pricing: Json | null
          territory_restrictions: string[] | null
          updated_at: string | null
        }
        Insert: {
          authorization_date?: string | null
          created_at?: string | null
          created_by?: number | null
          distributor_id: number
          expiration_date?: string | null
          id?: number
          is_authorized?: boolean | null
          notes?: string | null
          product_id: number
          special_pricing?: Json | null
          territory_restrictions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          authorization_date?: string | null
          created_at?: string | null
          created_by?: number | null
          distributor_id?: number
          expiration_date?: string | null
          id?: number
          is_authorized?: boolean | null
          notes?: string | null
          product_id?: number
          special_pricing?: Json | null
          territory_restrictions?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_distributor_authorizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_distributor_authorizations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_features: {
        Row: {
          created_at: string | null
          display_order: number | null
          feature_name: string
          feature_value: string | null
          id: number
          is_highlighted: boolean | null
          product_id: number
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          feature_name: string
          feature_value?: string | null
          id?: number
          is_highlighted?: boolean | null
          product_id: number
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          feature_name?: string
          feature_value?: string | null
          id?: number
          is_highlighted?: boolean | null
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pricing_models: {
        Row: {
          base_price: number | null
          created_at: string | null
          created_by: number | null
          id: number
          is_active: boolean | null
          max_price: number | null
          min_price: number | null
          model_type: Database["public"]["Enums"]["pricing_model_type"] | null
          pricing_rules: Json | null
          product_id: number
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          created_by?: number | null
          id?: number
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          model_type?: Database["public"]["Enums"]["pricing_model_type"] | null
          pricing_rules?: Json | null
          product_id: number
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          created_by?: number | null
          id?: number
          is_active?: boolean | null
          max_price?: number | null
          min_price?: number | null
          model_type?: Database["public"]["Enums"]["pricing_model_type"] | null
          pricing_rules?: Json | null
          product_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_pricing_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_pricing_models_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pricing_tiers: {
        Row: {
          created_at: string | null
          created_by: number | null
          discount_amount: number | null
          discount_percent: number | null
          effective_date: string | null
          expiration_date: string | null
          id: number
          max_quantity: number | null
          min_quantity: number
          notes: string | null
          product_id: number
          tier_name: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          discount_amount?: number | null
          discount_percent?: number | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: number
          max_quantity?: number | null
          min_quantity: number
          notes?: string | null
          product_id: number
          tier_name?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          discount_amount?: number | null
          discount_percent?: number | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: number
          max_quantity?: number | null
          min_quantity?: number
          notes?: string | null
          product_id?: number
          tier_name?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_pricing_tiers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_pricing_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string[] | null
          category: Database["public"]["Enums"]["product_category"]
          certifications: string[] | null
          created_at: string | null
          created_by: number | null
          currency_code: string | null
          deleted_at: string | null
          description: string | null
          id: number
          ingredients: string | null
          list_price: number | null
          manufacturer_part_number: string | null
          marketing_description: string | null
          name: string
          nutritional_info: Json | null
          principal_id: number
          search_tsv: unknown
          sku: string
          status: Database["public"]["Enums"]["product_status"] | null
          unit_of_measure: string | null
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          allergens?: string[] | null
          category: Database["public"]["Enums"]["product_category"]
          certifications?: string[] | null
          created_at?: string | null
          created_by?: number | null
          currency_code?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          ingredients?: string | null
          list_price?: number | null
          manufacturer_part_number?: string | null
          marketing_description?: string | null
          name: string
          nutritional_info?: Json | null
          principal_id: number
          search_tsv?: unknown
          sku: string
          status?: Database["public"]["Enums"]["product_status"] | null
          unit_of_measure?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          allergens?: string[] | null
          category?: Database["public"]["Enums"]["product_category"]
          certifications?: string[] | null
          created_at?: string | null
          created_by?: number | null
          currency_code?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          ingredients?: string | null
          list_price?: number | null
          manufacturer_part_number?: string | null
          marketing_description?: string | null
          name?: string
          nutritional_info?: Json | null
          principal_id?: number
          search_tsv?: unknown
          sku?: string
          status?: Database["public"]["Enums"]["product_status"] | null
          unit_of_measure?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          disabled: boolean | null
          email: string | null
          first_name: string | null
          id: number
          is_admin: boolean | null
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          disabled?: boolean | null
          email?: string | null
          first_name?: string | null
          id?: number
          is_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          disabled?: boolean | null
          email?: string | null
          first_name?: string | null
          id?: number
          is_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      segments: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          contact_id: number | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: number
          opportunity_id: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          reminder_date: string | null
          sales_id: number | null
          snooze_until: string | null
          title: string
          type: Database["public"]["Enums"]["task_type"] | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          contact_id?: number | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          opportunity_id?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          reminder_date?: string | null
          sales_id?: number | null
          snooze_until?: string | null
          title: string
          type?: Database["public"]["Enums"]["task_type"] | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          contact_id?: number | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          opportunity_id?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          reminder_date?: string | null
          sales_id?: number | null
          snooze_until?: string | null
          title?: string
          type?: Database["public"]["Enums"]["task_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      test_user_metadata: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          last_sync_at: string | null
          role: string
          test_data_counts: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_sync_at?: string | null
          role: string
          test_data_counts?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_sync_at?: string | null
          role?: string
          test_data_counts?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      contacts_summary: {
        Row: {
          address: string | null
          birthday: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          department: string | null
          email: Json | null
          first_name: string | null
          first_seen: string | null
          gender: string | null
          id: number | null
          last_name: string | null
          last_seen: string | null
          linkedin_url: string | null
          name: string | null
          notes: string | null
          organization_id: number | null
          phone: Json | null
          postal_code: string | null
          sales_id: number | null
          search_tsv: unknown
          state: string | null
          tags: number[] | null
          title: string | null
          twitter_handle: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities_summary: {
        Row: {
          account_manager_id: number | null
          actual_close_date: string | null
          campaign: string | null
          close_reason_notes: string | null
          competition: string | null
          contact_ids: number[] | null
          created_at: string | null
          created_by: number | null
          customer_organization_id: number | null
          customer_organization_name: string | null
          days_in_stage: number | null
          days_since_last_activity: number | null
          decision_criteria: string | null
          deleted_at: string | null
          description: string | null
          distributor_organization_id: number | null
          distributor_organization_name: string | null
          estimated_close_date: string | null
          founding_interaction_id: number | null
          id: number | null
          index: number | null
          lead_source: string | null
          loss_reason: string | null
          name: string | null
          next_action: string | null
          next_action_date: string | null
          next_task_due_date: string | null
          next_task_id: number | null
          next_task_priority:
            | Database["public"]["Enums"]["priority_level"]
            | null
          next_task_title: string | null
          notes: string | null
          opportunity_owner_id: number | null
          overdue_task_count: number | null
          pending_task_count: number | null
          principal_organization_id: number | null
          principal_organization_name: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          products: Json | null
          related_opportunity_id: number | null
          search_tsv: unknown
          stage: Database["public"]["Enums"]["opportunity_stage"] | null
          stage_changed_at: string | null
          stage_manual: boolean | null
          status: Database["public"]["Enums"]["opportunity_status"] | null
          status_manual: boolean | null
          tags: string[] | null
          updated_at: string | null
          updated_by: number | null
          win_reason: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_related_opportunity_id_fkey"
            columns: ["related_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_related_opportunity_id_fkey"
            columns: ["related_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_sales_id_fkey"
            columns: ["opportunity_owner_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations_summary: {
        Row: {
          annual_revenue: number | null
          city: string | null
          created_at: string | null
          description: string | null
          employee_count: number | null
          id: number | null
          is_distributor: boolean | null
          is_principal: boolean | null
          last_opportunity_activity: string | null
          name: string | null
          nb_contacts: number | null
          nb_opportunities: number | null
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          phone: string | null
          postal_code: string | null
          priority: string | null
          segment_id: string | null
          state: string | null
          website: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_industry_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_product_price: {
        Args: {
          p_distributor_id?: number
          p_product_id: number
          p_quantity: number
        }
        Returns: {
          discount_applied: number
          special_pricing: boolean
          tier_name: string
          total_price: number
          unit_price: number
        }[]
      }
      check_product_availability: {
        Args: {
          p_needed_date?: string
          p_product_id: number
          p_quantity: number
        }
        Returns: {
          availability_notes: string
          can_fulfill_by: string
          is_available: boolean
          quantity_available: number
        }[]
      }
      create_opportunity_with_participants: {
        Args: { p_opportunity_data: Json; p_participants: Json[] }
        Returns: number
      }
      get_contact_organizations: {
        Args: { p_contact_id: number }
        Returns: {
          is_primary: boolean
          is_primary_decision_maker: boolean
          organization_id: number
          organization_name: string
        }[]
      }
      get_current_sales_id: { Args: never; Returns: number }
      get_or_create_segment: {
        Args: { p_name: string }
        Returns: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }[]
        SetofOptions: {
          from: "*"
          to: "segments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_organization_contacts: {
        Args: { p_organization_id: number }
        Returns: {
          contact_id: number
          contact_name: string
          is_primary_decision_maker: boolean
          purchase_influence: number
          role: Database["public"]["Enums"]["contact_role"]
        }[]
      }
      log_engagement: {
        Args: {
          p_activity_date?: string
          p_contact_id?: number
          p_created_by?: number
          p_description?: string
          p_duration_minutes?: number
          p_follow_up_date?: string
          p_follow_up_required?: boolean
          p_organization_id?: number
          p_outcome?: string
          p_subject: string
          p_type: Database["public"]["Enums"]["interaction_type"]
        }
        Returns: number
      }
      log_interaction: {
        Args: {
          p_activity_date?: string
          p_contact_id?: number
          p_created_by?: number
          p_description?: string
          p_duration_minutes?: number
          p_follow_up_date?: string
          p_follow_up_required?: boolean
          p_opportunity_id: number
          p_organization_id?: number
          p_outcome?: string
          p_sentiment?: string
          p_subject: string
          p_type: Database["public"]["Enums"]["interaction_type"]
        }
        Returns: number
      }
      set_primary_organization: {
        Args: { p_contact_id: number; p_organization_id: number }
        Returns: undefined
      }
      setup_test_user: {
        Args: {
          p_email: string
          p_first_name: string
          p_is_admin?: boolean
          p_last_name: string
          p_user_id: string
        }
        Returns: {
          result_email: string
          result_id: number
          result_is_admin: boolean
          result_user_id: string
        }[]
      }
      sync_contact_organizations: {
        Args: { p_contact_id: number; p_organizations: Json }
        Returns: undefined
      }
      sync_opportunity_with_products: {
        Args: {
          opportunity_data: Json
          product_ids_to_delete: number[]
          products_to_create: Json
          products_to_update: Json
        }
        Returns: Json
      }
    }
    Enums: {
      activity_type: "engagement" | "interaction"
      contact_role:
        | "decision_maker"
        | "influencer"
        | "buyer"
        | "end_user"
        | "gatekeeper"
        | "champion"
        | "technical"
        | "executive"
      interaction_type:
        | "call"
        | "email"
        | "meeting"
        | "demo"
        | "proposal"
        | "follow_up"
        | "trade_show"
        | "site_visit"
        | "contract_review"
        | "check_in"
        | "social"
      opportunity_stage:
        | "new_lead"
        | "initial_outreach"
        | "sample_visit_offered"
        | "awaiting_response"
        | "feedback_logged"
        | "demo_scheduled"
        | "closed_won"
        | "closed_lost"
      opportunity_status:
        | "active"
        | "on_hold"
        | "nurturing"
        | "stalled"
        | "expired"
      organization_type:
        | "customer"
        | "principal"
        | "distributor"
        | "prospect"
        | "partner"
        | "unknown"
      pricing_model_type:
        | "fixed"
        | "tiered"
        | "volume"
        | "subscription"
        | "custom"
      priority_level: "low" | "medium" | "high" | "critical"
      product_category:
        | "beverages"
        | "dairy"
        | "frozen"
        | "fresh_produce"
        | "meat_poultry"
        | "seafood"
        | "dry_goods"
        | "snacks"
        | "condiments"
        | "baking_supplies"
        | "spices_seasonings"
        | "canned_goods"
        | "pasta_grains"
        | "oils_vinegars"
        | "sweeteners"
        | "cleaning_supplies"
        | "paper_products"
        | "equipment"
        | "other"
      product_status:
        | "active"
        | "discontinued"
        | "seasonal"
        | "coming_soon"
        | "limited_availability"
      task_type:
        | "Call"
        | "Email"
        | "Meeting"
        | "Follow-up"
        | "Proposal"
        | "Discovery"
        | "Administrative"
        | "None"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          owner?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          updated_at: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: ["engagement", "interaction"],
      contact_role: [
        "decision_maker",
        "influencer",
        "buyer",
        "end_user",
        "gatekeeper",
        "champion",
        "technical",
        "executive",
      ],
      interaction_type: [
        "call",
        "email",
        "meeting",
        "demo",
        "proposal",
        "follow_up",
        "trade_show",
        "site_visit",
        "contract_review",
        "check_in",
        "social",
      ],
      opportunity_stage: [
        "new_lead",
        "initial_outreach",
        "sample_visit_offered",
        "awaiting_response",
        "feedback_logged",
        "demo_scheduled",
        "closed_won",
        "closed_lost",
      ],
      opportunity_status: [
        "active",
        "on_hold",
        "nurturing",
        "stalled",
        "expired",
      ],
      organization_type: [
        "customer",
        "principal",
        "distributor",
        "prospect",
        "partner",
        "unknown",
      ],
      pricing_model_type: [
        "fixed",
        "tiered",
        "volume",
        "subscription",
        "custom",
      ],
      priority_level: ["low", "medium", "high", "critical"],
      product_category: [
        "beverages",
        "dairy",
        "frozen",
        "fresh_produce",
        "meat_poultry",
        "seafood",
        "dry_goods",
        "snacks",
        "condiments",
        "baking_supplies",
        "spices_seasonings",
        "canned_goods",
        "pasta_grains",
        "oils_vinegars",
        "sweeteners",
        "cleaning_supplies",
        "paper_products",
        "equipment",
        "other",
      ],
      product_status: [
        "active",
        "discontinued",
        "seasonal",
        "coming_soon",
        "limited_availability",
      ],
      task_type: [
        "Call",
        "Email",
        "Meeting",
        "Follow-up",
        "Proposal",
        "Discovery",
        "Administrative",
        "None",
      ],
    },
  },
  storage: {
    Enums: {},
  },
} as const

A new version of Supabase CLI is available: v2.65.5 (currently installed v2.63.1)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
