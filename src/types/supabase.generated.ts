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
          concierge_id: string
          created_at: string
          id: string
          mission_id: string
          owner_id: string | null
          rating: number
        }
        Insert: {
          comment?: string | null
          concierge_id: string
          created_at?: string
          id?: string
          mission_id: string
          owner_id?: string | null
          rating: number
        }
        Update: {
          comment?: string | null
          concierge_id?: string
          created_at?: string
          id?: string
          mission_id?: string
          owner_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "mission_reviews_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_reviews_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_reviews_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: true
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_reviews_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_reviews_owner_id_fkey"
            columns: ["owner_id"]
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
          concierge_id: string
          concierge_profile_id: string | null
          created_at: string
          currency: string
          id: string
          owner_id: string | null
          owner_profile_id: string | null
          property_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          service_id: string
          service_label: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          amount?: number | null
          concierge_id: string
          concierge_profile_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          owner_id?: string | null
          owner_profile_id?: string | null
          property_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_id: string
          service_label: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          amount?: number | null
          concierge_id?: string
          concierge_profile_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          owner_id?: string | null
          owner_profile_id?: string | null
          property_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_id?: string
          service_label?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_concierge_id_fkey"
            columns: ["concierge_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "missions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_owner_id_fkey"
            columns: ["owner_id"]
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
          instagram: string | null
          insurance_company: string | null
          insurance_number: string | null
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
          instagram?: string | null
          insurance_company?: string | null
          insurance_number?: string | null
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
          instagram?: string | null
          insurance_company?: string | null
          insurance_number?: string | null
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
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
          valid_until: string | null
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
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
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
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
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
            foreignKeyName: "service_contracts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
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
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          profile_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          profile_id: string
        }
        Update: {
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
          id: number
          is_default: boolean | null
          label: string
          profile_id: string
          service_id: number | null
          type: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: number
          is_default?: boolean | null
          label: string
          profile_id: string
          service_id?: number | null
          type: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: number
          is_default?: boolean | null
          label?: string
          profile_id?: string
          service_id?: number | null
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
      is_admin: { Args: never; Returns: boolean }
      is_user_profile_owner:
        | { Args: never; Returns: boolean }
        | { Args: { profile_id: string }; Returns: boolean }
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
