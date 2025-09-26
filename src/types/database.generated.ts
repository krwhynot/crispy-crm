export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string | null;
          activity_type: Database["public"]["Enums"]["activity_type"];
          attachments: string[] | null;
          attendees: string[] | null;
          contact_id: number | null;
          created_at: string | null;
          created_by: number | null;
          deleted_at: string | null;
          description: string | null;
          duration_minutes: number | null;
          follow_up_date: string | null;
          follow_up_notes: string | null;
          follow_up_required: boolean | null;
          id: number;
          location: string | null;
          opportunity_id: number | null;
          organization_id: number | null;
          outcome: string | null;
          sentiment: string | null;
          subject: string;
          tags: string[] | null;
          type: Database["public"]["Enums"]["interaction_type"];
          updated_at: string | null;
        };
        Insert: {
          activity_date?: string | null;
          activity_type: Database["public"]["Enums"]["activity_type"];
          attachments?: string[] | null;
          attendees?: string[] | null;
          contact_id?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          deleted_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          follow_up_date?: string | null;
          follow_up_notes?: string | null;
          follow_up_required?: boolean | null;
          id?: number;
          location?: string | null;
          opportunity_id?: number | null;
          organization_id?: number | null;
          outcome?: string | null;
          sentiment?: string | null;
          subject: string;
          tags?: string[] | null;
          type: Database["public"]["Enums"]["interaction_type"];
          updated_at?: string | null;
        };
        Update: {
          activity_date?: string | null;
          activity_type?: Database["public"]["Enums"]["activity_type"];
          attachments?: string[] | null;
          attendees?: string[] | null;
          contact_id?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          deleted_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          follow_up_date?: string | null;
          follow_up_notes?: string | null;
          follow_up_required?: boolean | null;
          id?: number;
          location?: string | null;
          opportunity_id?: number | null;
          organization_id?: number | null;
          outcome?: string | null;
          sentiment?: string | null;
          subject?: string;
          tags?: string[] | null;
          type?: Database["public"]["Enums"]["interaction_type"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_organizations: {
        Row: {
          contact_id: number;
          created_at: string | null;
          created_by: number | null;
          decision_authority: number | null;
          deleted_at: string | null;
          id: number;
          is_primary: boolean | null;
          is_primary_decision_maker: boolean | null;
          notes: string | null;
          organization_id: number;
          purchase_influence: number | null;
          relationship_end_date: string | null;
          relationship_start_date: string | null;
          role: Database["public"]["Enums"]["contact_role"] | null;
          updated_at: string | null;
        };
        Insert: {
          contact_id: number;
          created_at?: string | null;
          created_by?: number | null;
          decision_authority?: number | null;
          deleted_at?: string | null;
          id?: number;
          is_primary?: boolean | null;
          is_primary_decision_maker?: boolean | null;
          notes?: string | null;
          organization_id: number;
          purchase_influence?: number | null;
          relationship_end_date?: string | null;
          relationship_start_date?: string | null;
          role?: Database["public"]["Enums"]["contact_role"] | null;
          updated_at?: string | null;
        };
        Update: {
          contact_id?: number;
          created_at?: string | null;
          created_by?: number | null;
          decision_authority?: number | null;
          deleted_at?: string | null;
          id?: number;
          is_primary?: boolean | null;
          is_primary_decision_maker?: boolean | null;
          notes?: string | null;
          organization_id?: number;
          purchase_influence?: number | null;
          relationship_end_date?: string | null;
          relationship_start_date?: string | null;
          role?: Database["public"]["Enums"]["contact_role"] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_organizations_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_organizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_organizations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_preferred_principals: {
        Row: {
          advocacy_strength: number | null;
          contact_id: number;
          created_at: string | null;
          created_by: number | null;
          deleted_at: string | null;
          id: number;
          last_interaction_date: string | null;
          notes: string | null;
          principal_organization_id: number;
          updated_at: string | null;
        };
        Insert: {
          advocacy_strength?: number | null;
          contact_id: number;
          created_at?: string | null;
          created_by?: number | null;
          deleted_at?: string | null;
          id?: number;
          last_interaction_date?: string | null;
          notes?: string | null;
          principal_organization_id: number;
          updated_at?: string | null;
        };
        Update: {
          advocacy_strength?: number | null;
          contact_id?: number;
          created_at?: string | null;
          created_by?: number | null;
          deleted_at?: string | null;
          id?: number;
          last_interaction_date?: string | null;
          notes?: string | null;
          principal_organization_id?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_preferred_principals_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_preferred_principals_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_preferred_principals_principal_organization_id_fkey";
            columns: ["principal_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      contactNotes: {
        Row: {
          attachments: string[] | null;
          contact_id: number;
          created_at: string | null;
          id: number;
          sales_id: number | null;
          text: string;
          updated_at: string | null;
        };
        Insert: {
          attachments?: string[] | null;
          contact_id: number;
          created_at?: string | null;
          id?: number;
          sales_id?: number | null;
          text: string;
          updated_at?: string | null;
        };
        Update: {
          attachments?: string[] | null;
          contact_id?: number;
          created_at?: string | null;
          id?: number;
          sales_id?: number | null;
          text?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contactNotes_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contactNotes_sales_id_fkey";
            columns: ["sales_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          address: string | null;
          birthday: string | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          created_by: number | null;
          decision_authority: string | null;
          deleted_at: string | null;
          department: string | null;
          email: Json | null;
          first_name: string | null;
          first_seen: string | null;
          gender: string | null;
          id: number;
          last_name: string | null;
          last_seen: string | null;
          linkedin_url: string | null;
          name: string;
          notes: string | null;
          phone: Json | null;
          postal_code: string | null;
          purchase_influence: string | null;
          role: Database["public"]["Enums"]["contact_role"] | null;
          sales_id: number | null;
          search_tsv: unknown | null;
          state: string | null;
          tags: number[] | null;
          title: string | null;
          twitter_handle: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          birthday?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: number | null;
          decision_authority?: string | null;
          deleted_at?: string | null;
          department?: string | null;
          email?: Json | null;
          first_name?: string | null;
          first_seen?: string | null;
          gender?: string | null;
          id?: number;
          last_name?: string | null;
          last_seen?: string | null;
          linkedin_url?: string | null;
          name: string;
          notes?: string | null;
          phone?: Json | null;
          postal_code?: string | null;
          purchase_influence?: string | null;
          role?: Database["public"]["Enums"]["contact_role"] | null;
          sales_id?: number | null;
          search_tsv?: unknown | null;
          state?: string | null;
          tags?: number[] | null;
          title?: string | null;
          twitter_handle?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          birthday?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: number | null;
          decision_authority?: string | null;
          deleted_at?: string | null;
          department?: string | null;
          email?: Json | null;
          first_name?: string | null;
          first_seen?: string | null;
          gender?: string | null;
          id?: number;
          last_name?: string | null;
          last_seen?: string | null;
          linkedin_url?: string | null;
          name?: string;
          notes?: string | null;
          phone?: Json | null;
          postal_code?: string | null;
          purchase_influence?: string | null;
          role?: Database["public"]["Enums"]["contact_role"] | null;
          sales_id?: number | null;
          search_tsv?: unknown | null;
          state?: string | null;
          tags?: number[] | null;
          title?: string | null;
          twitter_handle?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_sales_id_fkey";
            columns: ["sales_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      interaction_participants: {
        Row: {
          activity_id: number;
          contact_id: number | null;
          created_at: string | null;
          id: number;
          notes: string | null;
          organization_id: number | null;
          role: string | null;
        };
        Insert: {
          activity_id: number;
          contact_id?: number | null;
          created_at?: string | null;
          id?: number;
          notes?: string | null;
          organization_id?: number | null;
          role?: string | null;
        };
        Update: {
          activity_id?: number;
          contact_id?: number | null;
          created_at?: string | null;
          id?: number;
          notes?: string | null;
          organization_id?: number | null;
          role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "interaction_participants_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interaction_participants_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interaction_participants_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      migration_history: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          error_message: string | null;
          id: number;
          phase_name: string;
          phase_number: string;
          rollback_sql: string | null;
          rows_affected: number | null;
          started_at: string | null;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: number;
          phase_name: string;
          phase_number: string;
          rollback_sql?: string | null;
          rows_affected?: number | null;
          started_at?: string | null;
          status?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: number;
          phase_name?: string;
          phase_number?: string;
          rollback_sql?: string | null;
          rows_affected?: number | null;
          started_at?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      opportunities: {
        Row: {
          actual_close_date: string | null;
          amount: number | null;
          category: string | null;
          competition: string | null;
          contact_ids: number[] | null;
          created_at: string | null;
          created_by: number | null;
          customer_organization_id: number | null;
          decision_criteria: string | null;
          deleted_at: string | null;
          description: string | null;
          distributor_organization_id: number | null;
          estimated_close_date: string | null;
          founding_interaction_id: number | null;
          id: number;
          index: number | null;
          name: string;
          next_action: string | null;
          next_action_date: string | null;
          principal_organization_id: number | null;
          priority: Database["public"]["Enums"]["priority_level"] | null;
          probability: number | null;
          sales_id: number | null;
          search_tsv: unknown | null;
          stage: Database["public"]["Enums"]["opportunity_stage"] | null;
          stage_manual: boolean | null;
          status: Database["public"]["Enums"]["opportunity_status"] | null;
          status_manual: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          actual_close_date?: string | null;
          amount?: number | null;
          category?: string | null;
          competition?: string | null;
          contact_ids?: number[] | null;
          created_at?: string | null;
          created_by?: number | null;
          customer_organization_id?: number | null;
          decision_criteria?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          distributor_organization_id?: number | null;
          estimated_close_date?: string | null;
          founding_interaction_id?: number | null;
          id?: number;
          index?: number | null;
          name: string;
          next_action?: string | null;
          next_action_date?: string | null;
          principal_organization_id?: number | null;
          priority?: Database["public"]["Enums"]["priority_level"] | null;
          probability?: number | null;
          sales_id?: number | null;
          search_tsv?: unknown | null;
          stage?: Database["public"]["Enums"]["opportunity_stage"] | null;
          stage_manual?: boolean | null;
          status?: Database["public"]["Enums"]["opportunity_status"] | null;
          status_manual?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          actual_close_date?: string | null;
          amount?: number | null;
          category?: string | null;
          competition?: string | null;
          contact_ids?: number[] | null;
          created_at?: string | null;
          created_by?: number | null;
          customer_organization_id?: number | null;
          decision_criteria?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          distributor_organization_id?: number | null;
          estimated_close_date?: string | null;
          founding_interaction_id?: number | null;
          id?: number;
          index?: number | null;
          name?: string;
          next_action?: string | null;
          next_action_date?: string | null;
          principal_organization_id?: number | null;
          priority?: Database["public"]["Enums"]["priority_level"] | null;
          probability?: number | null;
          sales_id?: number | null;
          search_tsv?: unknown | null;
          stage?: Database["public"]["Enums"]["opportunity_stage"] | null;
          stage_manual?: boolean | null;
          status?: Database["public"]["Enums"]["opportunity_status"] | null;
          status_manual?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_customer_organization_id_fkey";
            columns: ["customer_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_distributor_organization_id_fkey";
            columns: ["distributor_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_principal_organization_id_fkey";
            columns: ["principal_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_sales_id_fkey";
            columns: ["sales_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunity_participants: {
        Row: {
          commission_rate: number | null;
          created_at: string | null;
          created_by: number | null;
          deleted_at: string | null;
          id: number;
          is_primary: boolean | null;
          notes: string | null;
          opportunity_id: number;
          organization_id: number;
          role: string;
          territory: string | null;
          updated_at: string | null;
        };
        Insert: {
          commission_rate?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          deleted_at?: string | null;
          id?: number;
          is_primary?: boolean | null;
          notes?: string | null;
          opportunity_id: number;
          organization_id: number;
          role: string;
          territory?: string | null;
          updated_at?: string | null;
        };
        Update: {
          commission_rate?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          deleted_at?: string | null;
          id?: number;
          is_primary?: boolean | null;
          notes?: string | null;
          opportunity_id?: number;
          organization_id?: number;
          role?: string;
          territory?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "opportunity_participants_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_participants_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_participants_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunity_products: {
        Row: {
          cost_per_unit: number | null;
          created_at: string | null;
          created_by: number | null;
          discount_percent: number | null;
          extended_price: number | null;
          final_price: number | null;
          id: number;
          margin_percent: number | null;
          notes: string | null;
          opportunity_id: number;
          price_tier_id: number | null;
          pricing_notes: string | null;
          product_category: string | null;
          product_id: number | null;
          product_id_reference: number | null;
          product_name: string;
          quantity: number | null;
          special_pricing_applied: boolean | null;
          total_weight: number | null;
          unit_price: number | null;
          updated_at: string | null;
        };
        Insert: {
          cost_per_unit?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          discount_percent?: number | null;
          extended_price?: number | null;
          final_price?: number | null;
          id?: number;
          margin_percent?: number | null;
          notes?: string | null;
          opportunity_id: number;
          price_tier_id?: number | null;
          pricing_notes?: string | null;
          product_category?: string | null;
          product_id?: number | null;
          product_id_reference?: number | null;
          product_name: string;
          quantity?: number | null;
          special_pricing_applied?: boolean | null;
          total_weight?: number | null;
          unit_price?: number | null;
          updated_at?: string | null;
        };
        Update: {
          cost_per_unit?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          discount_percent?: number | null;
          extended_price?: number | null;
          final_price?: number | null;
          id?: number;
          margin_percent?: number | null;
          notes?: string | null;
          opportunity_id?: number;
          price_tier_id?: number | null;
          pricing_notes?: string | null;
          product_category?: string | null;
          product_id?: number | null;
          product_id_reference?: number | null;
          product_name?: string;
          quantity?: number | null;
          special_pricing_applied?: boolean | null;
          total_weight?: number | null;
          unit_price?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "opportunity_products_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_products_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_products_price_tier_id_fkey";
            columns: ["price_tier_id"];
            isOneToOne: false;
            referencedRelation: "product_pricing_tiers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_products_product_id_reference_fkey";
            columns: ["product_id_reference"];
            isOneToOne: false;
            referencedRelation: "product_catalog";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "opportunity_products_product_id_reference_fkey";
            columns: ["product_id_reference"];
            isOneToOne: false;
            referencedRelation: "product_performance";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "opportunity_products_product_id_reference_fkey";
            columns: ["product_id_reference"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunityNotes: {
        Row: {
          attachments: string[] | null;
          created_at: string | null;
          id: number;
          opportunity_id: number;
          sales_id: number | null;
          text: string;
          updated_at: string | null;
        };
        Insert: {
          attachments?: string[] | null;
          created_at?: string | null;
          id?: number;
          opportunity_id: number;
          sales_id?: number | null;
          text: string;
          updated_at?: string | null;
        };
        Update: {
          attachments?: string[] | null;
          created_at?: string | null;
          id?: number;
          opportunity_id?: number;
          sales_id?: number | null;
          text?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "opportunityNotes_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunityNotes_sales_id_fkey";
            columns: ["sales_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          address: string | null;
          annual_revenue: number | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          created_by: number | null;
          deleted_at: string | null;
          email: string | null;
          employee_count: number | null;
          founded_year: number | null;
          id: number;
          import_session_id: string | null;
          industry: string | null;
          is_distributor: boolean | null;
          is_principal: boolean | null;
          linkedin_url: string | null;
          logo_url: string | null;
          name: string;
          notes: string | null;
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null;
          parent_company_id: number | null;
          phone: string | null;
          postal_code: string | null;
          priority: string | null;
          sales_id: number | null;
          search_tsv: unknown | null;
          segment: string | null;
          state: string | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          annual_revenue?: number | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: number | null;
          deleted_at?: string | null;
          email?: string | null;
          employee_count?: number | null;
          founded_year?: number | null;
          id?: number;
          import_session_id?: string | null;
          industry?: string | null;
          is_distributor?: boolean | null;
          is_principal?: boolean | null;
          linkedin_url?: string | null;
          logo_url?: string | null;
          name: string;
          notes?: string | null;
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null;
          parent_company_id?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          priority?: string | null;
          sales_id?: number | null;
          search_tsv?: unknown | null;
          segment?: string | null;
          state?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          annual_revenue?: number | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: number | null;
          deleted_at?: string | null;
          email?: string | null;
          employee_count?: number | null;
          founded_year?: number | null;
          id?: number;
          import_session_id?: string | null;
          industry?: string | null;
          is_distributor?: boolean | null;
          is_principal?: boolean | null;
          linkedin_url?: string | null;
          logo_url?: string | null;
          name?: string;
          notes?: string | null;
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null;
          parent_company_id?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          priority?: string | null;
          sales_id?: number | null;
          search_tsv?: unknown | null;
          segment?: string | null;
          state?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "companies_parent_company_id_fkey";
            columns: ["parent_company_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "companies_sales_id_fkey";
            columns: ["sales_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organizations_parent_company_id_fkey";
            columns: ["parent_company_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      product_category_hierarchy: {
        Row: {
          attributes: Json | null;
          category_name: string;
          category_path: string | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          icon: string | null;
          id: number;
          level: number;
          parent_category_id: number | null;
          updated_at: string | null;
        };
        Insert: {
          attributes?: Json | null;
          category_name: string;
          category_path?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: number;
          level?: number;
          parent_category_id?: number | null;
          updated_at?: string | null;
        };
        Update: {
          attributes?: Json | null;
          category_name?: string;
          category_path?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: number;
          level?: number;
          parent_category_id?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_category_hierarchy_parent_category_id_fkey";
            columns: ["parent_category_id"];
            isOneToOne: false;
            referencedRelation: "product_category_hierarchy";
            referencedColumns: ["id"];
          },
        ];
      };
      product_distributor_authorizations: {
        Row: {
          authorization_date: string | null;
          created_at: string | null;
          created_by: number | null;
          distributor_id: number;
          expiration_date: string | null;
          id: number;
          is_authorized: boolean | null;
          notes: string | null;
          product_id: number;
          special_pricing: Json | null;
          territory_restrictions: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          authorization_date?: string | null;
          created_at?: string | null;
          created_by?: number | null;
          distributor_id: number;
          expiration_date?: string | null;
          id?: number;
          is_authorized?: boolean | null;
          notes?: string | null;
          product_id: number;
          special_pricing?: Json | null;
          territory_restrictions?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          authorization_date?: string | null;
          created_at?: string | null;
          created_by?: number | null;
          distributor_id?: number;
          expiration_date?: string | null;
          id?: number;
          is_authorized?: boolean | null;
          notes?: string | null;
          product_id?: number;
          special_pricing?: Json | null;
          territory_restrictions?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_distributor_authorizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_distributor_authorizations_distributor_id_fkey";
            columns: ["distributor_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_distributor_authorizations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_catalog";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_distributor_authorizations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_performance";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_distributor_authorizations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_features: {
        Row: {
          created_at: string | null;
          display_order: number | null;
          feature_name: string;
          feature_value: string | null;
          id: number;
          is_highlighted: boolean | null;
          product_id: number;
        };
        Insert: {
          created_at?: string | null;
          display_order?: number | null;
          feature_name: string;
          feature_value?: string | null;
          id?: number;
          is_highlighted?: boolean | null;
          product_id: number;
        };
        Update: {
          created_at?: string | null;
          display_order?: number | null;
          feature_name?: string;
          feature_value?: string | null;
          id?: number;
          is_highlighted?: boolean | null;
          product_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_features_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_catalog";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_features_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_performance";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_features_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_inventory: {
        Row: {
          id: number;
          last_restock_date: string | null;
          lot_numbers: Json | null;
          next_restock_date: string | null;
          product_id: number;
          quantity_available: number | null;
          quantity_committed: number | null;
          quantity_on_hand: number | null;
          reorder_point: number | null;
          reorder_quantity: number | null;
          updated_at: string | null;
          warehouse_location: string | null;
        };
        Insert: {
          id?: number;
          last_restock_date?: string | null;
          lot_numbers?: Json | null;
          next_restock_date?: string | null;
          product_id: number;
          quantity_available?: number | null;
          quantity_committed?: number | null;
          quantity_on_hand?: number | null;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          updated_at?: string | null;
          warehouse_location?: string | null;
        };
        Update: {
          id?: number;
          last_restock_date?: string | null;
          lot_numbers?: Json | null;
          next_restock_date?: string | null;
          product_id?: number;
          quantity_available?: number | null;
          quantity_committed?: number | null;
          quantity_on_hand?: number | null;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          updated_at?: string | null;
          warehouse_location?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_inventory_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_catalog";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_inventory_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_performance";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_inventory_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_pricing_models: {
        Row: {
          base_price: number | null;
          created_at: string | null;
          created_by: number | null;
          id: number;
          is_active: boolean | null;
          max_price: number | null;
          min_price: number | null;
          model_type: Database["public"]["Enums"]["pricing_model_type"] | null;
          pricing_rules: Json | null;
          product_id: number;
          updated_at: string | null;
        };
        Insert: {
          base_price?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          id?: number;
          is_active?: boolean | null;
          max_price?: number | null;
          min_price?: number | null;
          model_type?: Database["public"]["Enums"]["pricing_model_type"] | null;
          pricing_rules?: Json | null;
          product_id: number;
          updated_at?: string | null;
        };
        Update: {
          base_price?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          id?: number;
          is_active?: boolean | null;
          max_price?: number | null;
          min_price?: number | null;
          model_type?: Database["public"]["Enums"]["pricing_model_type"] | null;
          pricing_rules?: Json | null;
          product_id?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_pricing_models_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_pricing_models_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_catalog";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_pricing_models_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_performance";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_pricing_models_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_pricing_tiers: {
        Row: {
          created_at: string | null;
          created_by: number | null;
          discount_amount: number | null;
          discount_percent: number | null;
          effective_date: string | null;
          expiration_date: string | null;
          id: number;
          max_quantity: number | null;
          min_quantity: number;
          notes: string | null;
          product_id: number;
          tier_name: string | null;
          unit_price: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: number | null;
          discount_amount?: number | null;
          discount_percent?: number | null;
          effective_date?: string | null;
          expiration_date?: string | null;
          id?: number;
          max_quantity?: number | null;
          min_quantity: number;
          notes?: string | null;
          product_id: number;
          tier_name?: string | null;
          unit_price: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: number | null;
          discount_amount?: number | null;
          discount_percent?: number | null;
          effective_date?: string | null;
          expiration_date?: string | null;
          id?: number;
          max_quantity?: number | null;
          min_quantity?: number;
          notes?: string | null;
          product_id?: number;
          tier_name?: string | null;
          unit_price?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_pricing_tiers_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_pricing_tiers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_catalog";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_pricing_tiers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_performance";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_pricing_tiers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          allergens: string[] | null;
          benefits: string[] | null;
          brand: string | null;
          cases_per_pallet: number | null;
          category: Database["public"]["Enums"]["product_category"];
          certifications: string[] | null;
          cost_per_unit: number | null;
          created_at: string | null;
          created_by: number | null;
          deleted_at: string | null;
          description: string | null;
          dimensions: Json | null;
          expiration_date_required: boolean | null;
          features: string[] | null;
          id: number;
          image_urls: string[] | null;
          ingredients: string | null;
          is_seasonal: boolean | null;
          lead_time_days: number | null;
          list_price: number | null;
          lot_tracking_required: boolean | null;
          map_price: number | null;
          marketing_description: string | null;
          max_order_quantity: number | null;
          min_order_quantity: number | null;
          name: string;
          nutritional_info: Json | null;
          principal_id: number;
          search_tsv: unknown | null;
          season_end_month: number | null;
          season_start_month: number | null;
          shelf_life_days: number | null;
          sku: string;
          specifications: Json | null;
          status: Database["public"]["Enums"]["product_status"] | null;
          storage_temperature:
            | Database["public"]["Enums"]["storage_temperature"]
            | null;
          subcategory: string | null;
          unit_of_measure:
            | Database["public"]["Enums"]["unit_of_measure"]
            | null;
          units_per_case: number | null;
          upc: string | null;
          updated_at: string | null;
          updated_by: number | null;
          weight_per_unit: number | null;
        };
        Insert: {
          allergens?: string[] | null;
          benefits?: string[] | null;
          brand?: string | null;
          cases_per_pallet?: number | null;
          category: Database["public"]["Enums"]["product_category"];
          certifications?: string[] | null;
          cost_per_unit?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          deleted_at?: string | null;
          description?: string | null;
          dimensions?: Json | null;
          expiration_date_required?: boolean | null;
          features?: string[] | null;
          id?: number;
          image_urls?: string[] | null;
          ingredients?: string | null;
          is_seasonal?: boolean | null;
          lead_time_days?: number | null;
          list_price?: number | null;
          lot_tracking_required?: boolean | null;
          map_price?: number | null;
          marketing_description?: string | null;
          max_order_quantity?: number | null;
          min_order_quantity?: number | null;
          name: string;
          nutritional_info?: Json | null;
          principal_id: number;
          search_tsv?: unknown | null;
          season_end_month?: number | null;
          season_start_month?: number | null;
          shelf_life_days?: number | null;
          sku: string;
          specifications?: Json | null;
          status?: Database["public"]["Enums"]["product_status"] | null;
          storage_temperature?:
            | Database["public"]["Enums"]["storage_temperature"]
            | null;
          subcategory?: string | null;
          unit_of_measure?:
            | Database["public"]["Enums"]["unit_of_measure"]
            | null;
          units_per_case?: number | null;
          upc?: string | null;
          updated_at?: string | null;
          updated_by?: number | null;
          weight_per_unit?: number | null;
        };
        Update: {
          allergens?: string[] | null;
          benefits?: string[] | null;
          brand?: string | null;
          cases_per_pallet?: number | null;
          category?: Database["public"]["Enums"]["product_category"];
          certifications?: string[] | null;
          cost_per_unit?: number | null;
          created_at?: string | null;
          created_by?: number | null;
          deleted_at?: string | null;
          description?: string | null;
          dimensions?: Json | null;
          expiration_date_required?: boolean | null;
          features?: string[] | null;
          id?: number;
          image_urls?: string[] | null;
          ingredients?: string | null;
          is_seasonal?: boolean | null;
          lead_time_days?: number | null;
          list_price?: number | null;
          lot_tracking_required?: boolean | null;
          map_price?: number | null;
          marketing_description?: string | null;
          max_order_quantity?: number | null;
          min_order_quantity?: number | null;
          name?: string;
          nutritional_info?: Json | null;
          principal_id?: number;
          search_tsv?: unknown | null;
          season_end_month?: number | null;
          season_start_month?: number | null;
          shelf_life_days?: number | null;
          sku?: string;
          specifications?: Json | null;
          status?: Database["public"]["Enums"]["product_status"] | null;
          storage_temperature?:
            | Database["public"]["Enums"]["storage_temperature"]
            | null;
          subcategory?: string | null;
          unit_of_measure?:
            | Database["public"]["Enums"]["unit_of_measure"]
            | null;
          units_per_case?: number | null;
          upc?: string | null;
          updated_at?: string | null;
          updated_by?: number | null;
          weight_per_unit?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_principal_id_fkey";
            columns: ["principal_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          deleted_at: string | null;
          disabled: boolean | null;
          email: string | null;
          first_name: string | null;
          id: number;
          is_admin: boolean | null;
          last_name: string | null;
          phone: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          disabled?: boolean | null;
          email?: string | null;
          first_name?: string | null;
          id?: number;
          is_admin?: boolean | null;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          disabled?: boolean | null;
          email?: string | null;
          first_name?: string | null;
          id?: number;
          is_admin?: boolean | null;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          id: number;
          name: string;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          name: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          name?: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          archived_at: string | null;
          completed: boolean | null;
          completed_at: string | null;
          contact_id: number | null;
          created_at: string | null;
          description: string | null;
          due_date: string | null;
          id: number;
          name: string;
          opportunity_id: number | null;
          priority: Database["public"]["Enums"]["priority_level"] | null;
          reminder_date: string | null;
          sales_id: number | null;
          updated_at: string | null;
        };
        Insert: {
          archived_at?: string | null;
          completed?: boolean | null;
          completed_at?: string | null;
          contact_id?: number | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: number;
          name: string;
          opportunity_id?: number | null;
          priority?: Database["public"]["Enums"]["priority_level"] | null;
          reminder_date?: string | null;
          sales_id?: number | null;
          updated_at?: string | null;
        };
        Update: {
          archived_at?: string | null;
          completed?: boolean | null;
          completed_at?: string | null;
          contact_id?: number | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: number;
          name?: string;
          opportunity_id?: number | null;
          priority?: Database["public"]["Enums"]["priority_level"] | null;
          reminder_date?: string | null;
          sales_id?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_sales_id_fkey";
            columns: ["sales_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      product_catalog: {
        Row: {
          authorized_distributors: number | null;
          category: Database["public"]["Enums"]["product_category"] | null;
          cost_per_unit: number | null;
          in_season: boolean | null;
          is_seasonal: boolean | null;
          list_price: number | null;
          margin_amount: number | null;
          margin_percent: number | null;
          pricing_tier_count: number | null;
          principal_name: string | null;
          product_id: number | null;
          product_name: string | null;
          quantity_available: number | null;
          sku: string | null;
          status: Database["public"]["Enums"]["product_status"] | null;
        };
        Relationships: [];
      };
      product_performance: {
        Row: {
          actual_revenue: number | null;
          avg_margin_percent: number | null;
          category: Database["public"]["Enums"]["product_category"] | null;
          opportunity_count: number | null;
          principal_name: string | null;
          product_id: number | null;
          product_name: string | null;
          total_quantity_quoted: number | null;
          total_revenue_potential: number | null;
          won_opportunities: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calculate_product_price: {
        Args: {
          p_distributor_id?: number;
          p_product_id: number;
          p_quantity: number;
        };
        Returns: {
          discount_applied: number;
          special_pricing: boolean;
          tier_name: string;
          total_price: number;
          unit_price: number;
        }[];
      };
      check_product_availability: {
        Args: {
          p_needed_date?: string;
          p_product_id: number;
          p_quantity: number;
        };
        Returns: {
          availability_notes: string;
          can_fulfill_by: string;
          is_available: boolean;
          quantity_available: number;
        }[];
      };
      create_opportunity_with_participants: {
        Args: { p_opportunity_data: Json; p_participants: Json[] };
        Returns: number;
      };
      get_contact_organizations: {
        Args: { p_contact_id: number };
        Returns: {
          is_primary: boolean;
          is_primary_decision_maker: boolean;
          organization_id: number;
          organization_name: string;
          role: Database["public"]["Enums"]["contact_role"];
        }[];
      };
      get_organization_contacts: {
        Args: { p_organization_id: number };
        Returns: {
          contact_id: number;
          contact_name: string;
          is_primary_decision_maker: boolean;
          purchase_influence: number;
          role: Database["public"]["Enums"]["contact_role"];
        }[];
      };
      log_engagement: {
        Args: {
          p_activity_date?: string;
          p_contact_id?: number;
          p_created_by?: number;
          p_description?: string;
          p_duration_minutes?: number;
          p_follow_up_date?: string;
          p_follow_up_required?: boolean;
          p_organization_id?: number;
          p_outcome?: string;
          p_subject: string;
          p_type: Database["public"]["Enums"]["interaction_type"];
        };
        Returns: number;
      };
      log_interaction: {
        Args: {
          p_activity_date?: string;
          p_contact_id?: number;
          p_created_by?: number;
          p_description?: string;
          p_duration_minutes?: number;
          p_follow_up_date?: string;
          p_follow_up_required?: boolean;
          p_opportunity_id: number;
          p_organization_id?: number;
          p_outcome?: string;
          p_sentiment?: string;
          p_subject: string;
          p_type: Database["public"]["Enums"]["interaction_type"];
        };
        Returns: number;
      };
      set_primary_organization: {
        Args: {
          p_contact_id: number;
          p_organization_id: number;
        };
        Returns: void;
      };
    };
    Enums: {
      activity_type: "engagement" | "interaction";
      contact_role:
        | "decision_maker"
        | "influencer"
        | "buyer"
        | "end_user"
        | "gatekeeper"
        | "champion"
        | "technical"
        | "executive";
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
        | "social";
      opportunity_stage:
        | "new_lead"
        | "initial_outreach"
        | "sample_visit_offered"
        | "awaiting_response"
        | "feedback_logged"
        | "demo_scheduled"
        | "closed_won"
        | "closed_lost";
      opportunity_status:
        | "active"
        | "on_hold"
        | "nurturing"
        | "stalled"
        | "expired";
      organization_type:
        | "customer"
        | "principal"
        | "distributor"
        | "prospect"
        | "vendor"
        | "partner"
        | "unknown";
      pricing_model_type:
        | "fixed"
        | "tiered"
        | "volume"
        | "subscription"
        | "custom";
      priority_level: "low" | "medium" | "high" | "critical";
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
        | "other";
      product_status:
        | "active"
        | "discontinued"
        | "seasonal"
        | "coming_soon"
        | "out_of_stock"
        | "limited_availability";
      storage_temperature:
        | "frozen"
        | "refrigerated"
        | "cool"
        | "room_temp"
        | "no_requirement";
      unit_of_measure:
        | "each"
        | "case"
        | "pallet"
        | "pound"
        | "ounce"
        | "gallon"
        | "quart"
        | "pint"
        | "liter"
        | "kilogram"
        | "gram"
        | "dozen"
        | "gross"
        | "box"
        | "bag"
        | "container";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
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
        "vendor",
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
        "out_of_stock",
        "limited_availability",
      ],
      storage_temperature: [
        "frozen",
        "refrigerated",
        "cool",
        "room_temp",
        "no_requirement",
      ],
      unit_of_measure: [
        "each",
        "case",
        "pallet",
        "pound",
        "ounce",
        "gallon",
        "quart",
        "pint",
        "liter",
        "kilogram",
        "gram",
        "dozen",
        "gross",
        "box",
        "bag",
        "container",
      ],
    },
  },
} as const;
