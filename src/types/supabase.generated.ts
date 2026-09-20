export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_problem_events: {
        Row: {
          actor_profile_id: string | null
          event_type: string
          id: string
          next_functional_owner: string | null
          next_severity: string | null
          next_status: string | null
          note: string | null
          occurred_at: string
          previous_functional_owner: string | null
          previous_severity: string | null
          previous_status: string | null
          problem_id: string
        }
        Insert: {
          actor_profile_id?: string | null
          event_type: string
          id?: string
          next_functional_owner?: string | null
          next_severity?: string | null
          next_status?: string | null
          note?: string | null
          occurred_at?: string
          previous_functional_owner?: string | null
          previous_severity?: string | null
          previous_status?: string | null
          problem_id: string
        }
        Update: {
          actor_profile_id?: string | null
          event_type?: string
          id?: string
          next_functional_owner?: string | null
          next_severity?: string | null
          next_status?: string | null
          note?: string | null
          occurred_at?: string
          previous_functional_owner?: string | null
          previous_severity?: string | null
          previous_status?: string | null
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_problem_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_problem_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_problem_events_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "admin_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_problems: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          fingerprint: string
          first_detected_at: string
          functional_owner: string
          id: string
          last_detected_at: string
          occurrence_count: number
          resolved_at: string | null
          severity: string
          source: string
          status: string
          summary: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          fingerprint: string
          first_detected_at: string
          functional_owner: string
          id?: string
          last_detected_at: string
          occurrence_count?: number
          resolved_at?: string | null
          severity: string
          source: string
          status?: string
          summary: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          fingerprint?: string
          first_detected_at?: string
          functional_owner?: string
          id?: string
          last_detected_at?: string
          occurrence_count?: number
          resolved_at?: string | null
          severity?: string
          source?: string
          status?: string
          summary?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          description: string | null
          group_key: string | null
          icon: string | null
          id: number
          image: string | null
          key: string
          label: string
          new_id: string
        }
        Insert: {
          description?: string | null
          group_key?: string | null
          icon?: string | null
          id?: number
          image?: string | null
          key: string
          label: string
          new_id?: string
        }
        Update: {
          description?: string | null
          group_key?: string | null
          icon?: string | null
          id?: number
          image?: string | null
          key?: string
          label?: string
          new_id?: string
        }
        Relationships: []
      }
      certification_history: {
        Row: {
          created_at: string | null
          id: string
          new_level: string | null
          old_level: string | null
          profile_id: string | null
          reason: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_level?: string | null
          old_level?: string | null
          profile_id?: string | null
          reason?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_level?: string | null
          old_level?: string | null
          profile_id?: string | null
          reason?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certification_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_history_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_history_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_absences: {
        Row: {
          created_at: string
          end_date: string
          id: string
          notes: string | null
          profile_id: string
          reason: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          notes?: string | null
          profile_id: string
          reason?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          notes?: string | null
          profile_id?: string
          reason?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_absences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_absences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_daily_checklist: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          profile_id: string
          task_date: string
          task_key: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          profile_id: string
          task_date: string
          task_key: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          task_date?: string
          task_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_daily_checklist_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_daily_checklist_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_owner_matches: {
        Row: {
          budget_note: string | null
          city: string | null
          compatibility_ratio: string | null
          compatibility_score: number
          concierge_profile_id: string
          created_at: string
          distance_km: number | null
          id: string
          listing_id: string
          listing_source: string
          match_status: string
          matched_services: Json
          metadata: Json
          owner_profile_id: string | null
          postal_code: string | null
          property_type: string | null
          services_wanted: Json
          surface_m2: number | null
          title: string
          updated_at: string
        }
        Insert: {
          budget_note?: string | null
          city?: string | null
          compatibility_ratio?: string | null
          compatibility_score?: number
          concierge_profile_id: string
          created_at?: string
          distance_km?: number | null
          id?: string
          listing_id: string
          listing_source: string
          match_status?: string
          matched_services?: Json
          metadata?: Json
          owner_profile_id?: string | null
          postal_code?: string | null
          property_type?: string | null
          services_wanted?: Json
          surface_m2?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          budget_note?: string | null
          city?: string | null
          compatibility_ratio?: string | null
          compatibility_score?: number
          concierge_profile_id?: string
          created_at?: string
          distance_km?: number | null
          id?: string
          listing_id?: string
          listing_source?: string
          match_status?: string
          matched_services?: Json
          metadata?: Json
          owner_profile_id?: string | null
          postal_code?: string | null
          property_type?: string | null
          services_wanted?: Json
          surface_m2?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_owner_matches_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_owner_matches_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_owner_matches_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_owner_matches_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_team_members: {
        Row: {
          availability: string
          concierge_profile_id: string
          created_at: string
          daily_capacity_minutes: number
          id: string
          is_active: boolean
          linked_profile_id: string | null
          name: string
          permissions: Json
          role: string
          skills: Json
          title: string | null
          updated_at: string
          working_hours: Json
        }
        Insert: {
          availability?: string
          concierge_profile_id: string
          created_at?: string
          daily_capacity_minutes?: number
          id?: string
          is_active?: boolean
          linked_profile_id?: string | null
          name: string
          permissions?: Json
          role?: string
          skills?: Json
          title?: string | null
          updated_at?: string
          working_hours?: Json
        }
        Update: {
          availability?: string
          concierge_profile_id?: string
          created_at?: string
          daily_capacity_minutes?: number
          id?: string
          is_active?: boolean
          linked_profile_id?: string | null
          name?: string
          permissions?: Json
          role?: string
          skills?: Json
          title?: string | null
          updated_at?: string
          working_hours?: Json
        }
        Relationships: [
          {
            foreignKeyName: "concierge_team_members_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_team_members_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_team_members_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_team_members_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_conversations: {
        Row: {
          concierge_profile_id: string
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json
          owner_profile_id: string
          service_request_id: string | null
          source: string
          source_reference: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          concierge_profile_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          owner_profile_id: string
          service_request_id?: string | null
          source?: string
          source_reference?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          concierge_profile_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          owner_profile_id?: string
          service_request_id?: string | null
          source?: string
          source_reference?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_conversations_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_conversations_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_conversations_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_conversations_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_conversations_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          metadata: Json
          sender_profile_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json
          sender_profile_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json
          sender_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "contact_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          package_id: string
          profile_id: string
          title: string
          variables: Json
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          package_id: string
          profile_id: string
          title: string
          variables?: Json
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          package_id?: string
          profile_id?: string
          title?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "services_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      decoration_ai_reports: {
        Row: {
          budget_estimated: number
          budget_requested: number
          concierge_profile_id: string
          created_at: string
          goal: string
          housing_type: string
          id: string
          image_prompt: string | null
          owner_email: string | null
          owner_name: string | null
          owner_profile_id: string | null
          property_name: string | null
          report: Json
          room_name: string
          sent_at: string | null
          style: string
          updated_at: string
        }
        Insert: {
          budget_estimated?: number
          budget_requested?: number
          concierge_profile_id: string
          created_at?: string
          goal: string
          housing_type: string
          id?: string
          image_prompt?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_profile_id?: string | null
          property_name?: string | null
          report?: Json
          room_name: string
          sent_at?: string | null
          style: string
          updated_at?: string
        }
        Update: {
          budget_estimated?: number
          budget_requested?: number
          concierge_profile_id?: string
          created_at?: string
          goal?: string
          housing_type?: string
          id?: string
          image_prompt?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_profile_id?: string | null
          property_name?: string | null
          report?: Json
          room_name?: string
          sent_at?: string | null
          style?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decoration_ai_reports_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decoration_ai_reports_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decoration_ai_reports_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decoration_ai_reports_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      housing: {
        Row: {
          adresse: string | null
          contrat: Json | null
          created_at: string | null
          documents: Json | null
          external_id: number | null
          id: number
          infos: Json | null
          location: Json | null
          menage: Json | null
          nom_logement: string | null
          notes: Json | null
          photo_principale: string | null
          planning: Json | null
          plateforme: string | null
          proprietaire: Json | null
          statut: string | null
          tarifs: Json | null
          updated_at: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          contrat?: Json | null
          created_at?: string | null
          documents?: Json | null
          external_id?: number | null
          id?: number
          infos?: Json | null
          location?: Json | null
          menage?: Json | null
          nom_logement?: string | null
          notes?: Json | null
          photo_principale?: string | null
          planning?: Json | null
          plateforme?: string | null
          proprietaire?: Json | null
          statut?: string | null
          tarifs?: Json | null
          updated_at?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          contrat?: Json | null
          created_at?: string | null
          documents?: Json | null
          external_id?: number | null
          id?: number
          infos?: Json | null
          location?: Json | null
          menage?: Json | null
          nom_logement?: string | null
          notes?: Json | null
          photo_principale?: string | null
          planning?: Json | null
          plateforme?: string | null
          proprietaire?: Json | null
          statut?: string | null
          tarifs?: Json | null
          updated_at?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      housing_collaborations: {
        Row: {
          collaboration_type: string
          concierge_profile_id: string
          created_at: string
          ends_on: string | null
          frequency: string | null
          handover_status: string
          housing_id: number
          id: string
          mission_id: string | null
          owner_profile_id: string
          quote_id: string | null
          responsibility_level: string | null
          scope: Json
          service_request_id: string | null
          starts_on: string | null
          status: string
          updated_at: string
        }
        Insert: {
          collaboration_type?: string
          concierge_profile_id: string
          created_at?: string
          ends_on?: string | null
          frequency?: string | null
          handover_status?: string
          housing_id: number
          id?: string
          mission_id?: string | null
          owner_profile_id: string
          quote_id?: string | null
          responsibility_level?: string | null
          scope?: Json
          service_request_id?: string | null
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          collaboration_type?: string
          concierge_profile_id?: string
          created_at?: string
          ends_on?: string | null
          frequency?: string | null
          handover_status?: string
          housing_id?: number
          id?: string
          mission_id?: string | null
          owner_profile_id?: string
          quote_id?: string | null
          responsibility_level?: string | null
          scope?: Json
          service_request_id?: string | null
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "housing_collaborations_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housing_collaborations_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housing_collaborations_housing_id_fkey"
            columns: ["housing_id"]
            isOneToOne: false
            referencedRelation: "housing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housing_collaborations_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housing_collaborations_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housing_collaborations_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housing_collaborations_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housing_collaborations_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_events: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          event_type: string
          id: string
          invoice_id: string
          payload: Json
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          invoice_id: string
          payload?: Json
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          invoice_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "invoice_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          label: string
          line_total: number
          metadata: Json
          pricing_id: number | null
          quantity: number
          service_id: number | null
          sort_order: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          label: string
          line_total?: number
          metadata?: Json
          pricing_id?: number | null
          quantity?: number
          service_id?: number | null
          sort_order?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          label?: string
          line_total?: number
          metadata?: Json
          pricing_id?: number | null
          quantity?: number
          service_id?: number | null
          sort_order?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_pricing_id_fkey"
            columns: ["pricing_id"]
            isOneToOne: false
            referencedRelation: "services_pricing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_amount: number
          canceled_at: string | null
          concierge_profile_id: string
          created_at: string
          currency: string
          discount_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          issued_at: string | null
          metadata: Json
          mission_id: string | null
          notes: string | null
          owner_profile_id: string | null
          paid_amount: number
          paid_at: string | null
          quote_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          balance_amount?: number
          canceled_at?: string | null
          concierge_profile_id: string
          created_at?: string
          currency?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          issued_at?: string | null
          metadata?: Json
          mission_id?: string | null
          notes?: string | null
          owner_profile_id?: string | null
          paid_amount?: number
          paid_at?: string | null
          quote_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          balance_amount?: number
          canceled_at?: string | null
          concierge_profile_id?: string
          created_at?: string
          currency?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          issued_at?: string | null
          metadata?: Json
          mission_id?: string | null
          notes?: string | null
          owner_profile_id?: string | null
          paid_amount?: number
          paid_at?: string | null
          quote_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_incident_media: {
        Row: {
          created_at: string
          file_size_bytes: number
          id: string
          incident_id: string
          label: string | null
          mime_type: string
          sha256: string
          storage_bucket: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_size_bytes: number
          id?: string
          incident_id: string
          label?: string | null
          mime_type: string
          sha256: string
          storage_bucket?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_size_bytes?: number
          id?: string
          incident_id?: string
          label?: string | null
          mime_type?: string
          sha256?: string
          storage_bucket?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_incident_media_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "maintenance_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_incident_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_incident_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_incidents: {
        Row: {
          concierge_profile_id: string
          created_at: string
          description: string | null
          housing_id: string | null
          id: string
          metadata: Json
          mission_id: string | null
          owner_profile_id: string | null
          priority: string
          property_label: string | null
          provider_profile_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          concierge_profile_id: string
          created_at?: string
          description?: string | null
          housing_id?: string | null
          id?: string
          metadata?: Json
          mission_id?: string | null
          owner_profile_id?: string | null
          priority?: string
          property_label?: string | null
          provider_profile_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          concierge_profile_id?: string
          created_at?: string
          description?: string | null
          housing_id?: string | null
          id?: string
          metadata?: Json
          mission_id?: string | null
          owner_profile_id?: string | null
          priority?: string
          property_label?: string | null
          provider_profile_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_incidents_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_incidents_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_incidents_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_incidents_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_incidents_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_incidents_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_incidents_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_events: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          event_type: string
          id: string
          mission_id: string
          payload: Json
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          mission_id: string
          payload?: Json
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          mission_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "mission_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          mission_id: string
          rating: number
          reviewed_profile_id: string
          reviewer_profile_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          mission_id: string
          rating: number
          reviewed_profile_id: string
          reviewer_profile_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          rating?: number
          reviewed_profile_id?: string
          reviewer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_reviews_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_reviews_reviewed_profile_id_fkey"
            columns: ["reviewed_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_reviews_reviewed_profile_id_fkey"
            columns: ["reviewed_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          amount: number | null
          cancel_reason: string | null
          canceled_at: string | null
          completed_at: string | null
          concierge_profile_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json
          owner_profile_id: string | null
          priority: string
          property_id: string | null
          reservation_id: string | null
          response_time_minutes: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          service_id: string
          service_label: string
          service_request_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          workflow_status: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          amount?: number | null
          cancel_reason?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          concierge_profile_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          owner_profile_id?: string | null
          priority?: string
          property_id?: string | null
          reservation_id?: string | null
          response_time_minutes?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_id: string
          service_label: string
          service_request_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          workflow_status?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          amount?: number | null
          cancel_reason?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          concierge_profile_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          owner_profile_id?: string | null
          priority?: string
          property_id?: string | null
          reservation_id?: string | null
          response_time_minutes?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_id?: string
          service_label?: string
          service_request_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_events: {
        Row: {
          category: string | null
          created_at: string
          event_name: string
          id: string
          metadata: Json
          occurred_at: string
          path: string | null
          persona_hint: string | null
          step_index: number
          user_agent: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json
          occurred_at?: string
          path?: string | null
          persona_hint?: string | null
          step_index: number
          user_agent?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          path?: string | null
          persona_hint?: string | null
          step_index?: number
          user_agent?: string | null
        }
        Relationships: []
      }
      optimized_route_stops: {
        Row: {
          created_at: string
          distance_from_previous: number
          estimated_arrival_time: string | null
          estimated_departure_time: string | null
          id: string
          mission_id: string | null
          mission_snapshot: Json
          route_id: string
          stop_order: number
          travel_time_from_previous: number
          warning_message: string | null
        }
        Insert: {
          created_at?: string
          distance_from_previous?: number
          estimated_arrival_time?: string | null
          estimated_departure_time?: string | null
          id?: string
          mission_id?: string | null
          mission_snapshot?: Json
          route_id: string
          stop_order: number
          travel_time_from_previous?: number
          warning_message?: string | null
        }
        Update: {
          created_at?: string
          distance_from_previous?: number
          estimated_arrival_time?: string | null
          estimated_departure_time?: string | null
          id?: string
          mission_id?: string | null
          mission_snapshot?: Json
          route_id?: string
          stop_order?: number
          travel_time_from_previous?: number
          warning_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "optimized_route_stops_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimized_route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "optimized_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      optimized_routes: {
        Row: {
          concierge_profile_id: string
          created_at: string
          end_address: string | null
          end_latitude: number | null
          end_longitude: number | null
          id: string
          route_date: string
          snapshot: Json
          start_address: string | null
          start_latitude: number | null
          start_longitude: number | null
          status: string
          total_distance: number
          total_mission_time: number
          total_travel_time: number
          updated_at: string
        }
        Insert: {
          concierge_profile_id: string
          created_at?: string
          end_address?: string | null
          end_latitude?: number | null
          end_longitude?: number | null
          id?: string
          route_date: string
          snapshot?: Json
          start_address?: string | null
          start_latitude?: number | null
          start_longitude?: number | null
          status?: string
          total_distance?: number
          total_mission_time?: number
          total_travel_time?: number
          updated_at?: string
        }
        Update: {
          concierge_profile_id?: string
          created_at?: string
          end_address?: string | null
          end_latitude?: number | null
          end_longitude?: number | null
          id?: string
          route_date?: string
          snapshot?: Json
          start_address?: string | null
          start_latitude?: number | null
          start_longitude?: number | null
          status?: string
          total_distance?: number
          total_mission_time?: number
          total_travel_time?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimized_routes_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimized_routes_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_concierge_links: {
        Row: {
          concierge_profile_id: string
          created_at: string
          housing_id: number | null
          id: string
          invitation_id: string | null
          linked_at: string
          metadata: Json
          owner_profile_id: string
          quote_id: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          concierge_profile_id: string
          created_at?: string
          housing_id?: number | null
          id?: string
          invitation_id?: string | null
          linked_at?: string
          metadata?: Json
          owner_profile_id: string
          quote_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          concierge_profile_id?: string
          created_at?: string
          housing_id?: number | null
          id?: string
          invitation_id?: string | null
          linked_at?: string
          metadata?: Json
          owner_profile_id?: string
          quote_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_concierge_links_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_concierge_links_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_concierge_links_housing_id_fkey"
            columns: ["housing_id"]
            isOneToOne: false
            referencedRelation: "housing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_concierge_links_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "owner_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_concierge_links_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_concierge_links_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_concierge_links_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_invitation_events: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          event_type: string
          id: string
          invitation_id: string
          payload: Json
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          invitation_id: string
          payload?: Json
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          invitation_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "owner_invitation_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invitation_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invitation_events_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "owner_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_invitations: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          claimed_owner_profile_id: string | null
          concierge_profile_id: string
          created_at: string
          expires_at: string
          housing_id: number | null
          id: string
          invited_email: string
          invited_email_normalized: string
          invited_owner_name: string | null
          metadata: Json
          mission_id: string | null
          personal_note: string | null
          quote_id: string | null
          relanced_at: string | null
          relaunch_count: number
          sent_at: string | null
          status: string
          token_hash: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          claimed_owner_profile_id?: string | null
          concierge_profile_id: string
          created_at?: string
          expires_at: string
          housing_id?: number | null
          id?: string
          invited_email: string
          invited_email_normalized: string
          invited_owner_name?: string | null
          metadata?: Json
          mission_id?: string | null
          personal_note?: string | null
          quote_id?: string | null
          relanced_at?: string | null
          relaunch_count?: number
          sent_at?: string | null
          status?: string
          token_hash: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          claimed_owner_profile_id?: string | null
          concierge_profile_id?: string
          created_at?: string
          expires_at?: string
          housing_id?: number | null
          id?: string
          invited_email?: string
          invited_email_normalized?: string
          invited_owner_name?: string | null
          metadata?: Json
          mission_id?: string | null
          personal_note?: string | null
          quote_id?: string | null
          relanced_at?: string | null
          relaunch_count?: number
          sent_at?: string | null
          status?: string
          token_hash?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_invitations_claimed_owner_profile_id_fkey"
            columns: ["claimed_owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invitations_claimed_owner_profile_id_fkey"
            columns: ["claimed_owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invitations_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invitations_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invitations_housing_id_fkey"
            columns: ["housing_id"]
            isOneToOne: false
            referencedRelation: "housing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invitations_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invitations_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_entries: {
        Row: {
          created_at: string | null
          date: string
          end_date: string | null
          id: string
          price: number | null
          start_date: string | null
          task: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          end_date?: string | null
          id?: string
          price?: number | null
          start_date?: string | null
          task: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          end_date?: string | null
          id?: string
          price?: number | null
          start_date?: string | null
          task?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_packages: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string
          package_id: string
          profile_id: string
          property_type: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          label: string
          package_id: string
          profile_id: string
          property_type?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          package_id?: string
          profile_id?: string
          property_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "services_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_packages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_packages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_property_rules: {
        Row: {
          concierge_profile_id: string
          created_at: string
          delta_pct: number
          id: string
          max_surface_m2: number | null
          min_surface_m2: number | null
          property_type: string | null
          service_id: number | null
          updated_at: string
        }
        Insert: {
          concierge_profile_id: string
          created_at?: string
          delta_pct?: number
          id?: string
          max_surface_m2?: number | null
          min_surface_m2?: number | null
          property_type?: string | null
          service_id?: number | null
          updated_at?: string
        }
        Update: {
          concierge_profile_id?: string
          created_at?: string
          delta_pct?: number
          id?: string
          max_surface_m2?: number | null
          min_surface_m2?: number | null
          property_type?: string | null
          service_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_property_rules_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_property_rules_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_property_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_segments: {
        Row: {
          commission_delta_pct: number
          concierge_profile_id: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          setup_fee_delta_pct: number
          updated_at: string
        }
        Insert: {
          commission_delta_pct?: number
          concierge_profile_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          setup_fee_delta_pct?: number
          updated_at?: string
        }
        Update: {
          commission_delta_pct?: number
          concierge_profile_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          setup_fee_delta_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_segments_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_segments_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_strategy_scenarios: {
        Row: {
          concierge_profile_id: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          simulation: Json
          updated_at: string
        }
        Insert: {
          concierge_profile_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          simulation?: Json
          updated_at?: string
        }
        Update: {
          concierge_profile_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          simulation?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_strategy_scenarios_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_strategy_scenarios_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          additional_info: string | null
          availability_hours: string | null
          avatar_height: number | null
          avatar_offset_x: number | null
          avatar_offset_y: number | null
          avatar_rotation: number | null
          avatar_scale: number | null
          avatar_url: string | null
          avatar_width: number | null
          bic: string | null
          category: string | null
          certification_date: string | null
          certification_expires_at: string | null
          certification_level: string | null
          certification_metadata: Json | null
          certifications: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          email: string
          emergency_service: boolean | null
          experience_level: string | null
          facebook: string | null
          first_name: string | null
          hourly_rate: number | null
          iban: string | null
          id: string
          image: string | null
          instagram: string | null
          insurance_company: string | null
          insurance_number: string | null
          intervention_zone_locked: boolean
          last_name: string | null
          legal_form: string | null
          linkedin: string | null
          location: string | null
          monthly_rate: number | null
          onboarding_complete: boolean
          onboarding_completed_at: string | null
          option: string | null
          password: string | null
          phone: string | null
          postal_code: string | null
          role: string | null
          search_target: string | null
          service_area: string | null
          service_radius_km: number | null
          siren: string | null
          siret: string | null
          status: string | null
          street_address: string | null
          travel_fee: number | null
          updated_at: string | null
          username: string
          vat_number: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          additional_info?: string | null
          availability_hours?: string | null
          avatar_height?: number | null
          avatar_offset_x?: number | null
          avatar_offset_y?: number | null
          avatar_rotation?: number | null
          avatar_scale?: number | null
          avatar_url?: string | null
          avatar_width?: number | null
          bic?: string | null
          category?: string | null
          certification_date?: string | null
          certification_expires_at?: string | null
          certification_level?: string | null
          certification_metadata?: Json | null
          certifications?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          emergency_service?: boolean | null
          experience_level?: string | null
          facebook?: string | null
          first_name?: string | null
          hourly_rate?: number | null
          iban?: string | null
          id: string
          image?: string | null
          instagram?: string | null
          insurance_company?: string | null
          insurance_number?: string | null
          intervention_zone_locked?: boolean
          last_name?: string | null
          legal_form?: string | null
          linkedin?: string | null
          location?: string | null
          monthly_rate?: number | null
          onboarding_complete?: boolean
          onboarding_completed_at?: string | null
          option?: string | null
          password?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: string | null
          search_target?: string | null
          service_area?: string | null
          service_radius_km?: number | null
          siren?: string | null
          siret?: string | null
          status?: string | null
          street_address?: string | null
          travel_fee?: number | null
          updated_at?: string | null
          username: string
          vat_number?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          additional_info?: string | null
          availability_hours?: string | null
          avatar_height?: number | null
          avatar_offset_x?: number | null
          avatar_offset_y?: number | null
          avatar_rotation?: number | null
          avatar_scale?: number | null
          avatar_url?: string | null
          avatar_width?: number | null
          bic?: string | null
          category?: string | null
          certification_date?: string | null
          certification_expires_at?: string | null
          certification_level?: string | null
          certification_metadata?: Json | null
          certifications?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          emergency_service?: boolean | null
          experience_level?: string | null
          facebook?: string | null
          first_name?: string | null
          hourly_rate?: number | null
          iban?: string | null
          id?: string
          image?: string | null
          instagram?: string | null
          insurance_company?: string | null
          insurance_number?: string | null
          intervention_zone_locked?: boolean
          last_name?: string | null
          legal_form?: string | null
          linkedin?: string | null
          location?: string | null
          monthly_rate?: number | null
          onboarding_complete?: boolean
          onboarding_completed_at?: string | null
          option?: string | null
          password?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: string | null
          search_target?: string | null
          service_area?: string | null
          service_radius_km?: number | null
          siren?: string | null
          siret?: string | null
          status?: string | null
          street_address?: string | null
          travel_fee?: number | null
          updated_at?: string | null
          username?: string
          vat_number?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_category"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "fk_profiles_category"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "profiles_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["role_code"]
          },
          {
            foreignKeyName: "profiles_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["code"]
          },
        ]
      }
      properties: {
        Row: {
          city: string | null
          id: string
          name: string
          owner_id: string | null
          status: string | null
        }
        Insert: {
          city?: string | null
          id?: string
          name: string
          owner_id?: string | null
          status?: string | null
        }
        Update: {
          city?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_alerts: {
        Row: {
          alert_type: string
          body: string | null
          created_at: string
          id: string
          intervention_id: string | null
          provider_profile_id: string
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          alert_type?: string
          body?: string | null
          created_at?: string
          id?: string
          intervention_id?: string | null
          provider_profile_id: string
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          body?: string | null
          created_at?: string
          id?: string
          intervention_id?: string | null
          provider_profile_id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_alerts_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "provider_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_alerts_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_alerts_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_clients: {
        Row: {
          city: string | null
          client_name: string
          client_type: string
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          metadata: Json
          notes: string | null
          owner_profile_id: string | null
          phone: string | null
          provider_profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          client_name: string
          client_type?: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          owner_profile_id?: string | null
          phone?: string | null
          provider_profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          client_name?: string
          client_type?: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          owner_profile_id?: string | null
          phone?: string | null
          provider_profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_clients_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_clients_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_clients_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_clients_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_conversations: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json
          provider_profile_id: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          provider_profile_id: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          provider_profile_id?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "provider_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_conversations_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_conversations_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_interventions: {
        Row: {
          budget_amount: number | null
          client_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          location_label: string | null
          metadata: Json
          owner_profile_id: string | null
          priority: string
          provider_profile_id: string
          reservation_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          service_label: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_amount?: number | null
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          location_label?: string | null
          metadata?: Json
          owner_profile_id?: string | null
          priority?: string
          provider_profile_id: string
          reservation_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_label?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_amount?: number | null
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          location_label?: string | null
          metadata?: Json
          owner_profile_id?: string | null
          priority?: string
          provider_profile_id?: string
          reservation_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_label?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_interventions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "provider_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_interventions_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_interventions_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_interventions_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_interventions_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_interventions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          sender_profile_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          sender_profile_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          sender_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "provider_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_profile_documents: {
        Row: {
          created_at: string
          document_type: string
          expires_at: string | null
          file_size_bytes: number
          id: string
          label: string
          mime_type: string
          provider_profile_id: string
          rejection_reason: string | null
          sha256: string
          storage_bucket: string
          storage_path: string
          updated_at: string
          uploaded_by: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          expires_at?: string | null
          file_size_bytes: number
          id?: string
          label: string
          mime_type: string
          provider_profile_id: string
          rejection_reason?: string | null
          sha256: string
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          expires_at?: string | null
          file_size_bytes?: number
          id?: string
          label?: string
          mime_type?: string
          provider_profile_id?: string
          rejection_reason?: string | null
          sha256?: string
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_profile_documents_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_profile_documents_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_profile_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_profile_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_profile_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_profile_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_events: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          quote_id: string
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          quote_id: string
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          line_total: number
          metadata: Json
          pricing_id: number | null
          quantity: number
          quote_id: string
          service_id: number | null
          sort_order: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          line_total?: number
          metadata?: Json
          pricing_id?: number | null
          quantity?: number
          quote_id: string
          service_id?: number | null
          sort_order?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          line_total?: number
          metadata?: Json
          pricing_id?: number | null
          quantity?: number
          quote_id?: string
          service_id?: number | null
          sort_order?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_pricing_id_fkey"
            columns: ["pricing_id"]
            isOneToOne: false
            referencedRelation: "services_pricing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          canceled_at: string | null
          concierge_profile_id: string
          created_at: string
          currency: string
          discount_amount: number
          id: string
          metadata: Json
          mission_id: string | null
          notes: string | null
          owner_profile_id: string | null
          package_id: string | null
          quote_number: string
          rejected_at: string | null
          sent_at: string | null
          service_request_id: string | null
          service_request_recipient_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
          valid_until: string | null
          workflow_status: string | null
        }
        Insert: {
          accepted_at?: string | null
          canceled_at?: string | null
          concierge_profile_id: string
          created_at?: string
          currency?: string
          discount_amount?: number
          id?: string
          metadata?: Json
          mission_id?: string | null
          notes?: string | null
          owner_profile_id?: string | null
          package_id?: string | null
          quote_number?: string
          rejected_at?: string | null
          sent_at?: string | null
          service_request_id?: string | null
          service_request_recipient_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          workflow_status?: string | null
        }
        Update: {
          accepted_at?: string | null
          canceled_at?: string | null
          concierge_profile_id?: string
          created_at?: string
          currency?: string
          discount_amount?: number
          id?: string
          metadata?: Json
          mission_id?: string | null
          notes?: string | null
          owner_profile_id?: string | null
          package_id?: string | null
          quote_number?: string
          rejected_at?: string | null
          sent_at?: string | null
          service_request_id?: string | null
          service_request_recipient_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "services_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_service_request_recipient_id_fkey"
            columns: ["service_request_recipient_id"]
            isOneToOne: false
            referencedRelation: "service_request_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_attempts: {
        Row: {
          action: string
          action_key: string
          attempts: number
          created_at: string
          ip_address: string | null
          updated_at: string
          window_started_at: string
        }
        Insert: {
          action: string
          action_key: string
          attempts?: number
          created_at?: string
          ip_address?: string | null
          updated_at?: string
          window_started_at?: string
        }
        Update: {
          action?: string
          action_key?: string
          attempts?: number
          created_at?: string
          ip_address?: string | null
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          access_instructions: string | null
          acknowledged_at: string | null
          adults_count: number | null
          arrival_time_window: string | null
          canceled_at: string | null
          channel: string | null
          check_in_at: string
          check_out_at: string
          children_count: number | null
          completed_at: string | null
          concierge_notes: string | null
          concierge_profile_id: string
          contract_id: string | null
          created_at: string
          created_by_profile_id: string | null
          departure_time_window: string | null
          external_reference: string | null
          guest_count: number | null
          id: string
          infants_count: number | null
          metadata: Json
          owner_notes: string | null
          owner_profile_id: string
          pets_count: number | null
          property_id: string | null
          source: string
          status: string
          traveler_email: string | null
          traveler_first_name: string | null
          traveler_last_name: string | null
          traveler_phone: string | null
          updated_at: string
        }
        Insert: {
          access_instructions?: string | null
          acknowledged_at?: string | null
          adults_count?: number | null
          arrival_time_window?: string | null
          canceled_at?: string | null
          channel?: string | null
          check_in_at: string
          check_out_at: string
          children_count?: number | null
          completed_at?: string | null
          concierge_notes?: string | null
          concierge_profile_id: string
          contract_id?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          departure_time_window?: string | null
          external_reference?: string | null
          guest_count?: number | null
          id?: string
          infants_count?: number | null
          metadata?: Json
          owner_notes?: string | null
          owner_profile_id: string
          pets_count?: number | null
          property_id?: string | null
          source?: string
          status?: string
          traveler_email?: string | null
          traveler_first_name?: string | null
          traveler_last_name?: string | null
          traveler_phone?: string | null
          updated_at?: string
        }
        Update: {
          access_instructions?: string | null
          acknowledged_at?: string | null
          adults_count?: number | null
          arrival_time_window?: string | null
          canceled_at?: string | null
          channel?: string | null
          check_in_at?: string
          check_out_at?: string
          children_count?: number | null
          completed_at?: string | null
          concierge_notes?: string | null
          concierge_profile_id?: string
          contract_id?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          departure_time_window?: string | null
          external_reference?: string | null
          guest_count?: number | null
          id?: string
          infants_count?: number | null
          metadata?: Json
          owner_notes?: string | null
          owner_profile_id?: string
          pets_count?: number | null
          property_id?: string | null
          source?: string
          status?: string
          traveler_email?: string | null
          traveler_first_name?: string | null
          traveler_last_name?: string | null
          traveler_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "services_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_recipients: {
        Row: {
          concierge_profile_id: string
          created_at: string
          id: string
          metadata: Json
          proposed_date: string | null
          quote_id: string | null
          responded_at: string | null
          response_message: string | null
          service_request_id: string
          status: Database["public"]["Enums"]["service_request_recipient_status"]
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          concierge_profile_id: string
          created_at?: string
          id?: string
          metadata?: Json
          proposed_date?: string | null
          quote_id?: string | null
          responded_at?: string | null
          response_message?: string | null
          service_request_id: string
          status?: Database["public"]["Enums"]["service_request_recipient_status"]
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          concierge_profile_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          proposed_date?: string | null
          quote_id?: string | null
          responded_at?: string | null
          response_message?: string | null
          service_request_id?: string
          status?: Database["public"]["Enums"]["service_request_recipient_status"]
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_request_recipients_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_recipients_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_recipients_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          budget_max: number | null
          city: string | null
          created_at: string
          currency: string
          description: string | null
          desired_date: string | null
          id: string
          metadata: Json
          mission_id: string | null
          owner_profile_id: string
          postal_code: string | null
          property_id: string | null
          radius_km: number | null
          region: string | null
          request_type: Database["public"]["Enums"]["service_request_type"]
          requested_services: Json
          selected_concierge_profile_id: string | null
          status: Database["public"]["Enums"]["service_request_status"]
          title: string
          updated_at: string
          urgency: boolean
          workflow_status: string | null
        }
        Insert: {
          budget_max?: number | null
          city?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          desired_date?: string | null
          id?: string
          metadata?: Json
          mission_id?: string | null
          owner_profile_id: string
          postal_code?: string | null
          property_id?: string | null
          radius_km?: number | null
          region?: string | null
          request_type?: Database["public"]["Enums"]["service_request_type"]
          requested_services?: Json
          selected_concierge_profile_id?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          title: string
          updated_at?: string
          urgency?: boolean
          workflow_status?: string | null
        }
        Update: {
          budget_max?: number | null
          city?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          desired_date?: string | null
          id?: string
          metadata?: Json
          mission_id?: string | null
          owner_profile_id?: string
          postal_code?: string | null
          property_id?: string | null
          radius_km?: number | null
          region?: string | null
          request_type?: Database["public"]["Enums"]["service_request_type"]
          requested_services?: Json
          selected_concierge_profile_id?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          title?: string
          updated_at?: string
          urgency?: boolean
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_selected_concierge_profile_id_fkey"
            columns: ["selected_concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_selected_concierge_profile_id_fkey"
            columns: ["selected_concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          code: string
          icon: string | null
          id: number
          label: string
        }
        Insert: {
          code: string
          icon?: string | null
          id?: number
          label: string
        }
        Update: {
          code?: string
          icon?: string | null
          id?: number
          label?: string
        }
        Relationships: []
      }
      services_catalog: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: number
          service: string
          service_type_id: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: number
          service: string
          service_type_id?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: number
          service?: string
          service_type_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_catalog_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      services_contracts: {
        Row: {
          collaboration_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          profile_id: string | null
          start_date: string
          status: string | null
          title: string
        }
        Insert: {
          collaboration_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          profile_id?: string | null
          start_date: string
          status?: string | null
          title: string
        }
        Update: {
          collaboration_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          profile_id?: string | null
          start_date?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_contracts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_contracts_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: true
            referencedRelation: "housing_collaborations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contracts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      services_contract_versions: {
        Row: {
          id: string
          contract_id: string
          version_number: number
          status: string
          revision: number
          conditions: Json
          created_by: string
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          version_number?: number
          status?: string
          revision?: number
          conditions: Json
          created_by: string
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          version_number?: number
          status?: string
          revision?: number
          conditions?: Json
          created_by?: string
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "services_contract_versions_contract_id_fkey"; columns: ["contract_id"]; isOneToOne: false; referencedRelation: "services_contracts"; referencedColumns: ["id"] },
          { foreignKeyName: "services_contract_versions_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "services_contract_versions_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      services_package_items: {
        Row: {
          created_at: string
          id: string
          package_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "services_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      services_packages: {
        Row: {
          accent: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          profile_id: string
        }
        Insert: {
          accent?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          profile_id: string
        }
        Update: {
          accent?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_packages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_packages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      services_pricing: {
        Row: {
          amount: number
          created_at: string | null
          estimated_duration: number | null
          id: number
          is_default: boolean | null
          label: string
          profile_id: string
          property_type: string | null
          service_id: number | null
          surface_max: number | null
          surface_min: number | null
          type: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          estimated_duration?: number | null
          id?: number
          is_default?: boolean | null
          label: string
          profile_id: string
          property_type?: string | null
          service_id?: number | null
          surface_max?: number | null
          surface_min?: number | null
          type: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          estimated_duration?: number | null
          id?: number
          is_default?: boolean | null
          label?: string
          profile_id?: string
          property_type?: string | null
          service_id?: number | null
          surface_max?: number | null
          surface_min?: number | null
          type?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_pricing_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          created_at: string
          id: string
          payload: Json
          profile_id: string | null
          source: string
          stripe_event_type: string
          stripe_object_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          profile_id?: string | null
          source?: string
          stripe_event_type: string
          stripe_object_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          profile_id?: string | null
          source?: string
          stripe_event_type?: string
          stripe_object_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          code: string
          group_key: string | null
          is_pro: boolean | null
          label: string
          ordre: number | null
          user_id: string | null
        }
        Insert: {
          code: string
          group_key?: string | null
          is_pro?: boolean | null
          label: string
          ordre?: number | null
          user_id?: string | null
        }
        Update: {
          code?: string
          group_key?: string | null
          is_pro?: boolean | null
          label?: string
          ordre?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      workflow_events: {
        Row: {
          action_href: string | null
          actor_profile_id: string | null
          body: string | null
          concierge_profile_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          mission_id: string | null
          mission_workflow_status: string | null
          owner_profile_id: string | null
          quote_id: string | null
          quote_workflow_status: string | null
          read_at: string | null
          request_workflow_status: string | null
          reservation_id: string | null
          service_request_id: string | null
          service_request_recipient_id: string | null
          title: string
        }
        Insert: {
          action_href?: string | null
          actor_profile_id?: string | null
          body?: string | null
          concierge_profile_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          mission_id?: string | null
          mission_workflow_status?: string | null
          owner_profile_id?: string | null
          quote_id?: string | null
          quote_workflow_status?: string | null
          read_at?: string | null
          request_workflow_status?: string | null
          reservation_id?: string | null
          service_request_id?: string | null
          service_request_recipient_id?: string | null
          title: string
        }
        Update: {
          action_href?: string | null
          actor_profile_id?: string | null
          body?: string | null
          concierge_profile_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          mission_id?: string | null
          mission_workflow_status?: string | null
          owner_profile_id?: string | null
          quote_id?: string | null
          quote_workflow_status?: string | null
          read_at?: string | null
          request_workflow_status?: string | null
          reservation_id?: string | null
          service_request_id?: string | null
          service_request_recipient_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_concierge_profile_id_fkey"
            columns: ["concierge_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_events_service_request_recipient_id_fkey"
            columns: ["service_request_recipient_id"]
            isOneToOne: false
            referencedRelation: "service_request_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_dashboard_view: {
        Row: {
          avatar_url: string | null
          category: string | null
          category_label: string | null
          description: string | null
          email: string | null
          group_key: string | null
          icon: string | null
          id: string | null
          image: string | null
          is_pro: boolean | null
          role_code: string | null
          role_label: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_category"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "fk_profiles_category"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["key"]
          },
        ]
      }
    }
    Functions: {
      valid_collaboration_draft_conditions: { Args: { doc: Json }; Returns: boolean }
      save_collaboration_contract_draft: {
        Args: { p_collaboration_id: string; p_actor_id: string; p_expected_revision: number; p_conditions: Json }
        Returns: Database["public"]["Tables"]["services_contract_versions"]["Row"]
      }
      admin_problem_severity_rank: { Args: { value: string }; Returns: number }
      change_admin_problem_status: {
        Args: {
          p_actor_profile_id?: string
          p_next_status: string
          p_note?: string
          p_problem_id: string
        }
        Returns: {
          created_at: string
          entity_id: string
          entity_type: string
          fingerprint: string
          first_detected_at: string
          functional_owner: string
          id: string
          last_detected_at: string
          occurrence_count: number
          resolved_at: string | null
          severity: string
          source: string
          status: string
          summary: string
          title: string
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "admin_problems"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_or_redetect_admin_problem: {
        Args: {
          p_detected_at?: string
          p_entity_id: string
          p_entity_type: string
          p_fingerprint: string
          p_functional_owner: string
          p_severity: string
          p_source: string
          p_summary: string
          p_title: string
          p_type: string
        }
        Returns: {
          created_at: string
          entity_id: string
          entity_type: string
          fingerprint: string
          first_detected_at: string
          functional_owner: string
          id: string
          last_detected_at: string
          occurrence_count: number
          resolved_at: string | null
          severity: string
          source: string
          status: string
          summary: string
          title: string
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "admin_problems"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_user_profile_owner:
        | { Args: never; Returns: boolean }
        | { Args: { profile_id: string }; Returns: boolean }
      map_mission_workflow_status: {
        Args: { p_status: string }
        Returns: string
      }
      map_quote_workflow_status: {
        Args: { p_mission_id?: string; p_status: string }
        Returns: string
      }
      map_service_request_workflow_status: {
        Args: {
          p_mission_id?: string
          p_selected_concierge_profile_id?: string
          p_status: string
        }
        Returns: string
      }
      normalize_area_label: { Args: { input: string }; Returns: string }
      recompute_invoice_totals: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      recompute_quote_totals: {
        Args: { p_quote_id: string }
        Returns: undefined
      }
    }
    Enums: {
      service_request_recipient_status:
        | "sent"
        | "viewed"
        | "interested"
        | "quoted"
        | "declined"
        | "selected"
        | "not_selected"
        | "information_requested"
        | "date_proposed"
      service_request_status:
        | "draft"
        | "sent"
        | "in_review"
        | "quoted"
        | "accepted"
        | "closed"
        | "cancelled"
        | "received"
        | "viewed"
        | "information_requested"
        | "quote_accepted"
        | "quote_refused"
        | "expired"
      service_request_type: "ponctuel" | "renfort" | "durable"
      user_role:
        | "proprietaire"
        | "proprietaire_pro"
        | "concierge"
        | "concierge_pro"
        | "service"
        | "service_pro"
        | "admin"
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
  public: {
    Enums: {
      service_request_recipient_status: [
        "sent",
        "viewed",
        "interested",
        "quoted",
        "declined",
        "selected",
        "not_selected",
        "information_requested",
        "date_proposed",
      ],
      service_request_status: [
        "draft",
        "sent",
        "in_review",
        "quoted",
        "accepted",
        "closed",
        "cancelled",
        "received",
        "viewed",
        "information_requested",
        "quote_accepted",
        "quote_refused",
        "expired",
      ],
      service_request_type: ["ponctuel", "renfort", "durable"],
      user_role: [
        "proprietaire",
        "proprietaire_pro",
        "concierge",
        "concierge_pro",
        "service",
        "service_pro",
        "admin",
      ],
    },
  },
} as const
