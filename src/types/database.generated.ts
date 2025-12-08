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
          related_task_id: number | null
          sample_status: Database["public"]["Enums"]["sample_status"] | null
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
          related_task_id?: number | null
          sample_status?: Database["public"]["Enums"]["sample_status"] | null
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
          related_task_id?: number | null
          sample_status?: Database["public"]["Enums"]["sample_status"] | null
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
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "priority_tasks"
            referencedColumns: ["contact_id"]
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
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "activities_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "priority_tasks"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "activities_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          audit_id: number
          changed_at: string
          changed_by: number | null
          field_name: string
          new_value: string | null
          old_value: string | null
          record_id: number
          table_name: string
        }
        Insert: {
          audit_id?: never
          changed_at?: string
          changed_by?: number | null
          field_name: string
          new_value?: string | null
          old_value?: string | null
          record_id: number
          table_name: string
        }
        Update: {
          audit_id?: never
          changed_at?: string
          changed_by?: number | null
          field_name?: string
          new_value?: string | null
          old_value?: string | null
          record_id?: number
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_notes: {
        Row: {
          attachments: string[] | null
          contact_id: number
          created_at: string | null
          created_by: number | null
          date: string
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
          id?: number
          sales_id?: number | null
          text?: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "priority_tasks"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_updated_by_fkey"
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
          organization_id: number
          phone: Json | null
          postal_code: string | null
          sales_id: number | null
          search_tsv: unknown
          state: string | null
          status: string | null
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
          organization_id: number
          phone?: Json | null
          postal_code?: string | null
          sales_id?: number | null
          search_tsv?: unknown
          state?: string | null
          status?: string | null
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
          organization_id?: number
          phone?: Json | null
          postal_code?: string | null
          sales_id?: number | null
          search_tsv?: unknown
          state?: string | null
          status?: string | null
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
            referencedRelation: "dashboard_principal_summary"
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
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
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
      distributor_principal_authorizations: {
        Row: {
          authorization_date: string | null
          created_at: string
          created_by: number | null
          deleted_at: string | null
          distributor_id: number
          expiration_date: string | null
          id: number
          is_authorized: boolean
          notes: string | null
          principal_id: number
          territory_restrictions: string[] | null
          updated_at: string
        }
        Insert: {
          authorization_date?: string | null
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          distributor_id: number
          expiration_date?: string | null
          id?: never
          is_authorized?: boolean
          notes?: string | null
          principal_id: number
          territory_restrictions?: string[] | null
          updated_at?: string
        }
        Update: {
          authorization_date?: string | null
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          distributor_id?: number
          expiration_date?: string | null
          id?: never
          is_authorized?: boolean
          notes?: string | null
          principal_id?: number
          territory_restrictions?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "distributor_principal_authorizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      interaction_participants: {
        Row: {
          activity_id: number
          contact_id: number | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          id: number
          notes: string | null
          organization_id: number | null
          role: string | null
        }
        Insert: {
          activity_id: number
          contact_id?: number | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          notes?: string | null
          organization_id?: number | null
          role?: string | null
        }
        Update: {
          activity_id?: number
          contact_id?: number | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
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
          {
            foreignKeyName: "interaction_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interaction_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "priority_tasks"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "interaction_participants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
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
      notifications: {
        Row: {
          created_at: string
          deleted_at: string | null
          entity_id: number | null
          entity_type: string | null
          id: number
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          entity_id?: number | null
          entity_type?: string | null
          id?: never
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          entity_id?: number | null
          entity_type?: string | null
          id?: never
          message?: string
          read?: boolean
          type?: string
          user_id?: string
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
          customer_organization_id: number
          decision_criteria: string | null
          deleted_at: string | null
          description: string | null
          distributor_organization_id: number | null
          estimated_close_date: string | null
          founding_interaction_id: number | null
          id: number
          index: number | null
          lead_source: string | null
          loss_reason: Database["public"]["Enums"]["loss_reason"] | null
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
          stage_changed_at: string
          stage_manual: boolean | null
          status: Database["public"]["Enums"]["opportunity_status"] | null
          status_manual: boolean | null
          tags: string[] | null
          updated_at: string | null
          updated_by: number | null
          win_reason: Database["public"]["Enums"]["win_reason"] | null
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
          customer_organization_id: number
          decision_criteria?: string | null
          deleted_at?: string | null
          description?: string | null
          distributor_organization_id?: number | null
          estimated_close_date?: string | null
          founding_interaction_id?: number | null
          id?: number
          index?: number | null
          lead_source?: string | null
          loss_reason?: Database["public"]["Enums"]["loss_reason"] | null
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
          stage_changed_at?: string
          stage_manual?: boolean | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          status_manual?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: number | null
          win_reason?: Database["public"]["Enums"]["win_reason"] | null
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
          customer_organization_id?: number
          decision_criteria?: string | null
          deleted_at?: string | null
          description?: string | null
          distributor_organization_id?: number | null
          estimated_close_date?: string | null
          founding_interaction_id?: number | null
          id?: number
          index?: number | null
          lead_source?: string | null
          loss_reason?: Database["public"]["Enums"]["loss_reason"] | null
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
          stage_changed_at?: string
          stage_manual?: boolean | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          status_manual?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: number | null
          win_reason?: Database["public"]["Enums"]["win_reason"] | null
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
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_founding_interaction_id_fkey"
            columns: ["founding_interaction_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_opportunity_owner_id_fkey"
            columns: ["opportunity_owner_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
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
            foreignKeyName: "opportunities_related_opportunity_id_fkey"
            columns: ["related_opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
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
      opportunity_contacts: {
        Row: {
          contact_id: number
          created_at: string | null
          deleted_at: string | null
          id: number
          is_primary: boolean | null
          notes: string | null
          opportunity_id: number
          role: string | null
        }
        Insert: {
          contact_id: number
          created_at?: string | null
          deleted_at?: string | null
          id?: never
          is_primary?: boolean | null
          notes?: string | null
          opportunity_id: number
          role?: string | null
        }
        Update: {
          contact_id?: number
          created_at?: string | null
          deleted_at?: string | null
          id?: never
          is_primary?: boolean | null
          notes?: string | null
          opportunity_id?: number
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "priority_tasks"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "opportunity_contacts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contacts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contacts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
          },
        ]
      }
      opportunity_notes: {
        Row: {
          attachments: string[] | null
          created_at: string | null
          created_by: number | null
          date: string
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
          id?: number
          opportunity_id?: number
          sales_id?: number | null
          text?: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "opportunity_notes_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_participants: {
        Row: {
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          id: number
          is_primary: boolean | null
          notes: string | null
          opportunity_id: number
          organization_id: number
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          is_primary?: boolean | null
          notes?: string | null
          opportunity_id: number
          organization_id: number
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          is_primary?: boolean | null
          notes?: string | null
          opportunity_id?: number
          organization_id?: number
          role?: string
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
          {
            foreignKeyName: "opportunity_participants_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
          },
        ]
      }
      opportunity_products: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: number
          notes: string | null
          opportunity_id: number
          product_category: string | null
          product_id_reference: number
          product_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          notes?: string | null
          opportunity_id: number
          product_category?: string | null
          product_id_reference: number
          product_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: number
          notes?: string | null
          opportunity_id?: number
          product_category?: string | null
          product_id_reference?: number
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
            foreignKeyName: "opportunity_products_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "opportunity_products_product_id_reference_fkey"
            columns: ["product_id_reference"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_products_product_id_reference_fkey"
            columns: ["product_id_reference"]
            isOneToOne: false
            referencedRelation: "products_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_distributors: {
        Row: {
          created_at: string
          created_by: number | null
          deleted_at: string | null
          distributor_id: number
          id: number
          is_primary: boolean
          notes: string | null
          organization_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          distributor_id: number
          id?: never
          is_primary?: boolean
          notes?: string | null
          organization_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          distributor_id?: number
          id?: never
          is_primary?: boolean
          notes?: string | null
          organization_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_distributors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      organization_notes: {
        Row: {
          attachments: Json | null
          created_at: string | null
          date: string
          deleted_at: string | null
          id: number
          organization_id: number
          sales_id: number | null
          text: string
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          id?: number
          organization_id: number
          sales_id?: number | null
          text: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          id?: number
          organization_id?: number
          sales_id?: number | null
          text?: string
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_notes_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_updated_by_fkey"
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
          city: string | null
          context_links: Json | null
          created_at: string | null
          created_by: number | null
          cuisine: string | null
          deleted_at: string | null
          description: string | null
          email: string | null
          employee_count: number | null
          founded_year: number | null
          id: number
          import_session_id: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          needs_review: string | null
          notes: string | null
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          parent_organization_id: number | null
          phone: string | null
          playbook_category_id: string | null
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
          city?: string | null
          context_links?: Json | null
          created_at?: string | null
          created_by?: number | null
          cuisine?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          founded_year?: number | null
          id?: number
          import_session_id?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          needs_review?: string | null
          notes?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          parent_organization_id?: number | null
          phone?: string | null
          playbook_category_id?: string | null
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
          city?: string | null
          context_links?: Json | null
          created_at?: string | null
          created_by?: number | null
          cuisine?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          founded_year?: number | null
          id?: number
          import_session_id?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          needs_review?: string | null
          notes?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          parent_organization_id?: number | null
          phone?: string | null
          playbook_category_id?: string | null
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
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
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
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organizations_playbook_category_id_fkey"
            columns: ["playbook_category_id"]
            isOneToOne: false
            referencedRelation: "segments"
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
            foreignKeyName: "organizations_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
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
      product_distributor_authorizations: {
        Row: {
          authorization_date: string | null
          created_at: string
          created_by: number | null
          deleted_at: string | null
          distributor_id: number
          expiration_date: string | null
          id: number
          is_authorized: boolean
          notes: string | null
          product_id: number
          special_pricing: Json | null
          territory_restrictions: string[] | null
          updated_at: string
        }
        Insert: {
          authorization_date?: string | null
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          distributor_id: number
          expiration_date?: string | null
          id?: never
          is_authorized?: boolean
          notes?: string | null
          product_id: number
          special_pricing?: Json | null
          territory_restrictions?: string[] | null
          updated_at?: string
        }
        Update: {
          authorization_date?: string | null
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          distributor_id?: number
          expiration_date?: string | null
          id?: never
          is_authorized?: boolean
          notes?: string | null
          product_id?: number
          special_pricing?: Json | null
          territory_restrictions?: string[] | null
          updated_at?: string
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
            foreignKeyName: "product_distributor_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_distributor_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_distributor_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_distributor_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_distributor_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "product_distributor_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_distributor_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "product_distributor_authorizations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_distributor_authorizations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          description: string | null
          distributor_id: number | null
          id: number
          manufacturer_part_number: string | null
          name: string
          principal_id: number
          search_tsv: unknown
          sku: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          distributor_id?: number | null
          id?: number
          manufacturer_part_number?: string | null
          name: string
          principal_id: number
          search_tsv?: unknown
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          distributor_id?: number | null
          id?: number
          manufacturer_part_number?: string | null
          name?: string
          principal_id?: number
          search_tsv?: unknown
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
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
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
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
          administrator: boolean | null
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
          role: Database["public"]["Enums"]["user_role"]
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          administrator?: boolean | null
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
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          administrator?: boolean | null
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
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      segments: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          display_order: number | null
          id: string
          name: string
          parent_id: string | null
          segment_type: string | null
          ui_group: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          parent_id?: string | null
          segment_type?: string | null
          ui_group?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          parent_id?: string | null
          segment_type?: string | null
          ui_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "segments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
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
          organization_id: number | null
          overdue_notified_at: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          reminder_date: string | null
          sales_id: number
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
          organization_id?: number | null
          overdue_notified_at?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          reminder_date?: string | null
          sales_id: number
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
          organization_id?: number | null
          overdue_notified_at?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          reminder_date?: string | null
          sales_id?: number
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
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "priority_tasks"
            referencedColumns: ["contact_id"]
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
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
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
      tutorial_progress: {
        Row: {
          activity_completed: boolean
          contact_completed: boolean
          created_activity_id: number | null
          created_at: string | null
          created_contact_id: number | null
          created_opportunity_id: number | null
          created_organization_id: number | null
          created_task_id: number | null
          dismissed: boolean
          dismissed_at: string | null
          id: number
          opportunity_completed: boolean
          organization_completed: boolean
          sales_id: number
          task_completed: boolean
          updated_at: string | null
        }
        Insert: {
          activity_completed?: boolean
          contact_completed?: boolean
          created_activity_id?: number | null
          created_at?: string | null
          created_contact_id?: number | null
          created_opportunity_id?: number | null
          created_organization_id?: number | null
          created_task_id?: number | null
          dismissed?: boolean
          dismissed_at?: string | null
          id?: number
          opportunity_completed?: boolean
          organization_completed?: boolean
          sales_id: number
          task_completed?: boolean
          updated_at?: string | null
        }
        Update: {
          activity_completed?: boolean
          contact_completed?: boolean
          created_activity_id?: number | null
          created_at?: string | null
          created_contact_id?: number | null
          created_opportunity_id?: number | null
          created_organization_id?: number | null
          created_task_id?: number | null
          dismissed?: boolean
          dismissed_at?: string | null
          id?: number
          opportunity_completed?: boolean
          organization_completed?: boolean
          sales_id?: number
          task_completed?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_progress_created_activity_id_fkey"
            columns: ["created_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_contact_id_fkey"
            columns: ["created_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_contact_id_fkey"
            columns: ["created_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_contact_id_fkey"
            columns: ["created_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_contact_id_fkey"
            columns: ["created_contact_id"]
            isOneToOne: false
            referencedRelation: "priority_tasks"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_opportunity_id_fkey"
            columns: ["created_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_opportunity_id_fkey"
            columns: ["created_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_opportunity_id_fkey"
            columns: ["created_opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_organization_id_fkey"
            columns: ["created_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_organization_id_fkey"
            columns: ["created_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_organization_id_fkey"
            columns: ["created_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_organization_id_fkey"
            columns: ["created_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_organization_id_fkey"
            columns: ["created_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_organization_id_fkey"
            columns: ["created_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_organization_id_fkey"
            columns: ["created_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_task_id_fkey"
            columns: ["created_task_id"]
            isOneToOne: false
            referencedRelation: "priority_tasks"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "tutorial_progress_created_task_id_fkey"
            columns: ["created_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_progress_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: true
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      authorization_status: {
        Row: {
          authorization_date: string | null
          authorization_id: number | null
          created_at: string | null
          deleted_at: string | null
          distributor_id: number | null
          distributor_name: string | null
          expiration_date: string | null
          is_authorized: boolean | null
          is_currently_valid: boolean | null
          is_distributor: boolean | null
          is_principal: boolean | null
          notes: string | null
          principal_id: number | null
          principal_name: string | null
          territory_restrictions: string[] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_principal_authorizations_principal_id_fkey"
            columns: ["principal_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      campaign_choices: {
        Row: {
          id: string | null
          name: string | null
          opportunity_count: number | null
        }
        Relationships: []
      }
      contactNotes: {
        Row: {
          attachments: string[] | null
          contact_id: number | null
          created_at: string | null
          created_by: number | null
          date: string | null
          deleted_at: string | null
          id: number | null
          sales_id: number | null
          text: string | null
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          attachments?: string[] | null
          contact_id?: number | null
          created_at?: string | null
          created_by?: number | null
          date?: string | null
          deleted_at?: string | null
          id?: number | null
          sales_id?: number | null
          text?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          attachments?: string[] | null
          contact_id?: number | null
          created_at?: string | null
          created_by?: number | null
          date?: string | null
          deleted_at?: string | null
          id?: number | null
          sales_id?: number | null
          text?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "priority_tasks"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
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
          nb_activities: number | null
          nb_notes: number | null
          nb_tasks: number | null
          notes: string | null
          organization_id: number | null
          phone: Json | null
          postal_code: string | null
          sales_id: number | null
          search_tsv: unknown
          state: string | null
          status: string | null
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
            referencedRelation: "dashboard_principal_summary"
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
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
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
      contacts_with_account_manager: {
        Row: {
          account_manager_is_user: boolean | null
          account_manager_name: string | null
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
          status: string | null
          tags: number[] | null
          title: string | null
          twitter_handle: string | null
          updated_at: string | null
          updated_by: number | null
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
            referencedRelation: "dashboard_principal_summary"
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
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
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
      dashboard_pipeline_summary: {
        Row: {
          account_manager_id: number | null
          count: number | null
          stage: Database["public"]["Enums"]["opportunity_stage"] | null
          stuck_count: number | null
          total_active: number | null
          total_stuck: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_principal_summary: {
        Row: {
          assigned_reps: string[] | null
          days_since_last_activity: number | null
          id: number | null
          is_stuck: boolean | null
          last_activity_date: string | null
          last_activity_type:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          max_days_in_stage: number | null
          next_action: string | null
          opportunity_count: number | null
          principal_name: string | null
          priority_score: number | null
          status_indicator: string | null
          weekly_activity_count: number | null
        }
        Relationships: []
      }
      distinct_product_categories: {
        Row: {
          id: string | null
          name: string | null
        }
        Relationships: []
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
          loss_reason: Database["public"]["Enums"]["loss_reason"] | null
          name: string | null
          next_action: string | null
          next_action_date: string | null
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
          win_reason: Database["public"]["Enums"]["win_reason"] | null
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
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey"
            columns: ["distributor_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_founding_interaction_id_fkey"
            columns: ["founding_interaction_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_opportunity_owner_id_fkey"
            columns: ["opportunity_owner_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
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
            foreignKeyName: "opportunities_related_opportunity_id_fkey"
            columns: ["related_opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
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
      opportunityNotes: {
        Row: {
          attachments: string[] | null
          created_at: string | null
          created_by: number | null
          date: string | null
          deleted_at: string | null
          id: number | null
          opportunity_id: number | null
          sales_id: number | null
          text: string | null
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string | null
          created_by?: number | null
          date?: string | null
          deleted_at?: string | null
          id?: number | null
          opportunity_id?: number | null
          sales_id?: number | null
          text?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          attachments?: string[] | null
          created_at?: string | null
          created_by?: number | null
          date?: string | null
          deleted_at?: string | null
          id?: number | null
          opportunity_id?: number | null
          sales_id?: number | null
          text?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "opportunity_notes_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_primary_distributor: {
        Row: {
          distributor_city: string | null
          distributor_id: number | null
          distributor_name: string | null
          distributor_state: string | null
          organization_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_distributors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      organizationNotes: {
        Row: {
          attachments: Json | null
          created_at: string | null
          date: string | null
          deleted_at: string | null
          id: number | null
          organization_id: number | null
          sales_id: number | null
          text: string | null
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          date?: string | null
          deleted_at?: string | null
          id?: number | null
          organization_id?: number | null
          sales_id?: number | null
          text?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          date?: string | null
          deleted_at?: string | null
          id?: number | null
          organization_id?: number | null
          sales_id?: number | null
          text?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organization_notes_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations_summary: {
        Row: {
          child_branch_count: number | null
          city: string | null
          created_at: string | null
          description: string | null
          employee_count: number | null
          id: number | null
          last_opportunity_activity: string | null
          name: string | null
          nb_contacts: number | null
          nb_notes: number | null
          nb_opportunities: number | null
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          parent_organization_id: number | null
          parent_organization_name: string | null
          phone: string | null
          postal_code: string | null
          priority: string | null
          segment_id: string | null
          state: string | null
          total_contacts_across_branches: number | null
          total_opportunities_across_branches: number | null
          website: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
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
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organizations_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations_with_account_manager: {
        Row: {
          account_manager_is_user: boolean | null
          account_manager_name: string | null
          address: string | null
          city: string | null
          context_links: Json | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          description: string | null
          email: string | null
          employee_count: number | null
          founded_year: number | null
          id: number | null
          import_session_id: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string | null
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
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
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
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "organizations_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
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
      principal_opportunities: {
        Row: {
          customer_name: string | null
          customer_organization_id: number | null
          days_since_activity: number | null
          estimated_close_date: string | null
          health_status: string | null
          last_activity: string | null
          opportunity_id: number | null
          opportunity_name: string | null
          principal_id: number | null
          principal_name: string | null
          stage: Database["public"]["Enums"]["opportunity_stage"] | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["customer_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
        ]
      }
      principal_pipeline_summary: {
        Row: {
          active_last_week: number | null
          active_this_week: number | null
          id: number | null
          momentum: string | null
          next_action_summary: string | null
          principal_id: number | null
          principal_name: string | null
          sales_id: number | null
          total_pipeline: number | null
        }
        Relationships: []
      }
      priority_tasks: {
        Row: {
          completed: boolean | null
          contact_id: number | null
          contact_name: string | null
          customer_name: string | null
          due_date: string | null
          opportunity_id: number | null
          opportunity_name: string | null
          organization_id: number | null
          principal_name: string | null
          principal_organization_id: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          task_id: number | null
          task_title: string | null
          task_type: Database["public"]["Enums"]["task_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey"
            columns: ["principal_organization_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
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
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["opportunity_id"]
          },
        ]
      }
      products_summary: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          description: string | null
          distributor_id: number | null
          id: number | null
          manufacturer_part_number: string | null
          name: string | null
          principal_id: number | null
          principal_name: string | null
          sku: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          updated_at: string | null
          updated_by: number | null
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
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "dashboard_principal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_account_manager"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_opportunities"
            referencedColumns: ["principal_id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "principal_pipeline_summary"
            referencedColumns: ["principal_id"]
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
    }
    Functions: {
      archive_opportunity_with_relations: {
        Args: { opp_id: number }
        Returns: undefined
      }
      check_authorization: {
        Args: {
          _distributor_id: number
          _principal_id?: number
          _product_id?: number
        }
        Returns: Json
      }
      check_authorization_batch: {
        Args: {
          _distributor_id: number
          _principal_ids?: number[]
          _product_ids?: number[]
        }
        Returns: Json
      }
      check_overdue_tasks: { Args: never; Returns: Json }
      complete_task_with_followup: {
        Args: {
          p_activity_data: Json
          p_opportunity_stage?: string
          p_task_id: number
        }
        Returns: Json
      }
      create_booth_visitor_opportunity: { Args: { _data: Json }; Returns: Json }
      create_opportunity_with_participants: {
        Args: { p_opportunity_data: Json; p_participants: Json[] }
        Returns: number
      }
      current_sales_id: { Args: never; Returns: number }
      generate_daily_digest: { Args: never; Returns: Json }
      generate_daily_digest_v2: { Args: never; Returns: Json }
      generate_digest_opt_out_token: {
        Args: { p_sales_id: number }
        Returns: string
      }
      get_activity_log: {
        Args: {
          p_limit?: number
          p_organization_id?: number
          p_sales_id?: number
        }
        Returns: Json
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
      get_current_user_company_id: { Args: never; Returns: number }
      get_current_user_sales_id: { Args: never; Returns: number }
      get_digest_preference: { Args: never; Returns: Json }
      get_duplicate_details: {
        Args: { p_contact_ids: number[] }
        Returns: {
          created_at: string
          email: Json
          first_name: string
          id: number
          interaction_count: number
          last_name: string
          organization_id: number
          organization_name: string
          phone: Json
          task_count: number
        }[]
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
      get_overdue_tasks_for_user: {
        Args: { p_sales_id: number }
        Returns: Database["public"]["CompositeTypes"]["overdue_task_record"][]
        SetofOptions: {
          from: "*"
          to: "overdue_task_record"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_product_distributor_pricing: {
        Args: { p_distributor_id: number; p_product_id: number }
        Returns: Json
      }
      get_stale_deals_for_user: {
        Args: { p_sales_id: number }
        Returns: Database["public"]["CompositeTypes"]["stale_deal_record"][]
        SetofOptions: {
          from: "*"
          to: "stale_deal_record"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_tasks_due_today_for_user: {
        Args: { p_sales_id: number }
        Returns: Database["public"]["CompositeTypes"]["today_task_record"][]
        SetofOptions: {
          from: "*"
          to: "today_task_record"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_digest_summary: {
        Args: { p_sales_id: number }
        Returns: Database["public"]["CompositeTypes"]["user_digest_summary"]
        SetofOptions: {
          from: "*"
          to: "user_digest_summary"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      invoke_daily_digest_function: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_manager: { Args: never; Returns: boolean }
      is_manager_or_admin: { Args: never; Returns: boolean }
      is_product_authorized_for_distributor: {
        Args: { p_distributor_id: number; p_product_id: number }
        Returns: boolean
      }
      is_rep: { Args: never; Returns: boolean }
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
      merge_duplicate_contacts: {
        Args: { p_duplicate_ids: number[]; p_keeper_id: number }
        Returns: Json
      }
      owns_activity: { Args: { act_id: number }; Returns: boolean }
      owns_opportunity: { Args: { opp_id: number }; Returns: boolean }
      process_digest_opt_out: { Args: { p_token: string }; Returns: Json }
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
      unarchive_opportunity_with_relations: {
        Args: { opp_id: number }
        Returns: undefined
      }
      update_digest_preference: { Args: { p_opt_in: boolean }; Returns: Json }
      user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
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
        | "note"
        | "sample"
      loss_reason:
        | "price_too_high"
        | "no_authorization"
        | "competitor_relationship"
        | "product_fit"
        | "timing"
        | "no_response"
        | "other"
      opportunity_stage:
        | "new_lead"
        | "initial_outreach"
        | "sample_visit_offered"
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
      organization_type: "customer" | "prospect" | "principal" | "distributor"
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
      sample_status:
        | "sent"
        | "received"
        | "feedback_pending"
        | "feedback_received"
      task_type:
        | "Call"
        | "Email"
        | "Meeting"
        | "Follow-up"
        | "Demo"
        | "Proposal"
        | "Other"
      user_role: "admin" | "manager" | "rep"
      win_reason:
        | "relationship"
        | "product_quality"
        | "price_competitive"
        | "timing"
        | "other"
    }
    CompositeTypes: {
      overdue_task_record: {
        id: number | null
        title: string | null
        description: string | null
        due_date: string | null
        days_overdue: number | null
        priority: string | null
        type: string | null
        contact_id: number | null
        contact_name: string | null
        opportunity_id: number | null
        opportunity_name: string | null
        organization_id: number | null
        organization_name: string | null
      }
      stale_deal_record: {
        id: number | null
        name: string | null
        stage: string | null
        stage_threshold_days: number | null
        days_since_activity: number | null
        days_over_threshold: number | null
        last_activity_date: string | null
        customer_name: string | null
        principal_name: string | null
        priority: string | null
        estimated_close_date: string | null
      }
      today_task_record: {
        id: number | null
        title: string | null
        description: string | null
        priority: string | null
        type: string | null
        contact_id: number | null
        contact_name: string | null
        opportunity_id: number | null
        opportunity_name: string | null
        organization_id: number | null
        organization_name: string | null
      }
      user_digest_summary: {
        sales_id: number | null
        user_id: string | null
        first_name: string | null
        last_name: string | null
        email: string | null
        tasks_due_today: number | null
        tasks_overdue: number | null
        stale_deals: number | null
        opportunities_updated_24h: number | null
        activities_logged_24h: number | null
        overdue_tasks: Json | null
        stale_deals_list: Json | null
        tasks_due_today_list: Json | null
      }
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
        "note",
        "sample",
      ],
      loss_reason: [
        "price_too_high",
        "no_authorization",
        "competitor_relationship",
        "product_fit",
        "timing",
        "no_response",
        "other",
      ],
      opportunity_stage: [
        "new_lead",
        "initial_outreach",
        "sample_visit_offered",
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
      organization_type: ["customer", "prospect", "principal", "distributor"],
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
      sample_status: [
        "sent",
        "received",
        "feedback_pending",
        "feedback_received",
      ],
      task_type: [
        "Call",
        "Email",
        "Meeting",
        "Follow-up",
        "Demo",
        "Proposal",
        "Other",
      ],
      user_role: ["admin", "manager", "rep"],
      win_reason: [
        "relationship",
        "product_quality",
        "price_competitive",
        "timing",
        "other",
      ],
    },
  },
  storage: {
    Enums: {},
  },
} as const

