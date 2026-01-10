// src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          description: string | null;
          group_key: string | null;
          icon: string | null;
          id: number;
          image: string | null;
          key: string;
          label: string;
          new_id: string;
        };
        Insert: {
          description?: string | null;
          group_key?: string | null;
          icon?: string | null;
          id?: number;
          image?: string | null;
          key: string;
          label: string;
          new_id?: string;
        };
        Update: {
          description?: string | null;
          group_key?: string | null;
          icon?: string | null;
          id?: number;
          image?: string | null;
          key?: string;
          label?: string;
          new_id?: string;
        };
        Relationships: [];
      };

      planning_entries: {
        Row: {
          created_at: string | null;
          date: string;
          end_date: string | null;
          id: string;
          price: number | null;
          start_date: string | null;
          task: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          date: string;
          end_date?: string | null;
          id?: string;
          price?: number | null;
          start_date?: string | null;
          task: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          end_date?: string | null;
          id?: string;
          price?: number | null;
          start_date?: string | null;
          task?: string;
          user_id?: string;
        };
        Relationships: [];
      };

      profile_services: {
        Row: {
          created_at: string | null;
          id: number;
          profile_id: string;
          selected: boolean | null;
          service_id: number;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          profile_id: string;
          selected?: boolean | null;
          service_id: number;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          profile_id?: string;
          selected?: boolean | null;
          service_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "profile_services_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_services_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "user_dashboard_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services_catalog";
            referencedColumns: ["id"];
          }
        ];
      };

      profiles: {
        Row: {
          additional_info: string | null;
          avatar_scale: number | null;
          avatar_url: string | null;
          category: string | null;
          created_at: string | null;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          location: string | null;
          option: string | null;
          password: string | null;
          phone: string | null;
          role: string | null;
          search_target: string | null;
          updated_at: string | null;
          username: string;
          company_name: string | null;
          legal_form: string | null;
          siret: string | null;
          siren: string | null;
          vat_number: string | null;
          street_address: string | null;
          postal_code: string | null;
          city: string | null;
          country: string | null;
          website: string | null;
          linkedin: string | null;
          instagram: string | null;
          facebook: string | null;
          insurance_number: string | null;
          insurance_company: string | null;
          service_area: string | null;
          service_radius_km: number | null;
          hourly_rate: number | null;
          monthly_rate: number | null;
          availability_hours: string | null;
          emergency_service: boolean | null;
          experience_level: "debutant" | "intermediaire" | "experimente" | null;
          certifications: string | null;
          years_experience: number | null;
          iban: string | null;
          bic: string | null;
          travel_fee: number | null;
        };
        Insert: {
          additional_info?: string | null;
          avatar_scale?: number | null;
          avatar_url?: string | null;
          category?: string | null;
          created_at?: string | null;
          email: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          location?: string | null;
          option?: string | null;
          password?: string | null;
          phone?: string | null;
          role?: string | null;
          search_target?: string | null;
          updated_at?: string | null;
          username: string;
          company_name?: string | null;
          legal_form?: string | null;
          siret?: string | null;
          siren?: string | null;
          vat_number?: string | null;
          street_address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          country?: string | null;
          website?: string | null;
          linkedin?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          insurance_number?: string | null;
          insurance_company?: string | null;
          service_area?: string | null;
          service_radius_km?: number | null;
          hourly_rate?: number | null;
          monthly_rate?: number | null;
          availability_hours?: string | null;
          emergency_service?: boolean | null;
          certifications?: string | null;
          years_experience?: number | null;
          experience_level?: string | null;
          iban?: string | null;
          bic?: string | null;
          travel_fee?: number | null;
        };
        Update: {
          additional_info?: string | null;
          avatar_scale?: number | null;
          avatar_url?: string | null;
          category?: string | null;
          created_at?: string | null;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          location?: string | null;
          option?: string | null;
          password?: string | null;
          phone?: string | null;
          role?: string | null;
          search_target?: string | null;
          updated_at?: string | null;
          username?: string | null;
          company_name?: string | null;
          legal_form?: string | null;
          siret?: string | null;
          siren?: string | null;
          vat_number?: string | null;
          street_address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          country?: string | null;
          website?: string | null;
          linkedin?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          insurance_number?: string | null;
          insurance_company?: string | null;
          service_area?: string | null;
          service_radius_km?: number | null;
          hourly_rate?: number | null;
          monthly_rate?: number | null;
          availability_hours?: string | null;
          emergency_service?: boolean | null;
          certifications?: string | null;
          years_experience?: number | null;
          experience_level?: string | null;
          iban?: string | null;
          bic?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_category";
            columns: ["category"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "fk_profiles_category";
            columns: ["category"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "profiles_role_fkey";
            columns: ["role"];
            isOneToOne: false;
            referencedRelation: "user_dashboard_view";
            referencedColumns: ["role_code"];
          },
          {
            foreignKeyName: "profiles_role_fkey";
            columns: ["role"];
            isOneToOne: false;
            referencedRelation: "user_roles";
            referencedColumns: ["code"];
          }
        ];
      };

      housing: {
        Row: {
          id: number;
          external_id: number | null;
          nom_logement: string | null;
          ville: string | null;
          adresse: string | null;
          plateforme: string | null;
          statut: string | null;
          photo_principale: string | null;
          infos: Json | null;
          proprietaire: Json | null;
          location: Json | null;
          menage: Json | null;
          planning: Json | null;
          documents: Json | null;
          contrat: Json | null;
          tarifs: Json | null;
          notes: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          external_id?: number | null;
          nom_logement?: string | null;
          ville?: string | null;
          adresse?: string | null;
          plateforme?: string | null;
          statut?: string | null;
          photo_principale?: string | null;
          infos?: Json | null;
          proprietaire?: Json | null;
          location?: Json | null;
          menage?: Json | null;
          planning?: Json | null;
          documents?: Json | null;
          contrat?: Json | null;
          tarifs?: Json | null;
          notes?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          external_id?: number | null;
          nom_logement?: string | null;
          ville?: string | null;
          adresse?: string | null;
          plateforme?: string | null;
          statut?: string | null;
          photo_principale?: string | null;
          infos?: Json | null;
          proprietaire?: Json | null;
          location?: Json | null;
          menage?: Json | null;
          planning?: Json | null;
          documents?: Json | null;
          contrat?: Json | null;
          tarifs?: Json | null;
          notes?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      properties: {
        Row: {
          city: string | null;
          id: string;
          name: string;
          owner_id: string | null;
          status: string | null;
        };
        Insert: {
          city?: string | null;
          id?: string;
          name: string;
          owner_id?: string | null;
          status?: string | null;
        };
        Update: {
          city?: string | null;
          id?: string;
          name?: string;
          owner_id?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "properties_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "user_dashboard_view";
            referencedColumns: ["id"];
          }
        ];
      };

      contract_services: {
        Row: {
          id: number;
          housing_id: number;
          service_id: number;
          pricing_id: string | null;
          quantity: number | null;
          total: number | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          housing_id: number;
          service_id: number;
          pricing_id?: string | null;
          quantity?: number | null;
          total?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          housing_id?: number;
          service_id?: number;
          pricing_id?: string | null;
          quantity?: number | null;
          total?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contract_services_housing_id_fkey";
            columns: ["housing_id"];
            isOneToOne: false;
            referencedRelation: "housing";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contract_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contract_services_pricing_id_fkey";
            columns: ["pricing_id"];
            isOneToOne: false;
            referencedRelation: "services_pricing";
            referencedColumns: ["id"];
          }
        ];
      };

      services_pricing: {
        Row: {
          id: string;
          profile_id: string;
          service_id: number | null;
          label: string;
          type: string | null;
          amount: number;
          unit: string | null;
          is_default: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          service_id?: number | null;
          label: string;
          type?: string | null;
          amount: number;
          unit?: string | null;
          is_default?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          service_id?: number | null;
          label?: string;
          type?: string | null;
          amount?: number;
          unit?: string | null;
          is_default?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "services_pricing_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_pricing_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services_catalog";
            referencedColumns: ["id"];
          }
        ];
      };

      services_contracts: {
        Row: {
          id: string;
          profile_id: string | null;
          title: string;
          start_date: string;
          end_date: string | null;
          status: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          title: string;
          start_date: string;
          end_date?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          title?: string;
          start_date?: string;
          end_date?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      services_catalog: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          id: number;
          service: string;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          service: string;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          service?: string;
        };
        Relationships: [];
      };

      user_roles: {
        Row: {
          code: string;
          group_key: string | null;
          is_pro: boolean | null;
          label: string;
          ordre: number | null;
          user_id: string | null;
        };
        Insert: {
          code: string;
          group_key?: string | null;
          is_pro?: boolean | null;
          label: string;
          ordre?: number | null;
          user_id?: string | null;
        };
        Update: {
          code?: string;
          group_key?: string | null;
          is_pro?: boolean | null;
          label?: string;
          ordre?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };

    Views: {
      user_dashboard_view: {
        Row: {
          avatar_url: string | null;
          category: string | null;
          category_label: string | null;
          description: string | null;
          email: string | null;
          group_key: string | null;
          icon: string | null;
          id: string | null;
          image: string | null;
          is_pro: boolean | null;
          role_code: string | null;
          role_label: string | null;
          username: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_category";
            columns: ["category"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "fk_profiles_category";
            columns: ["category"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["key"];
          }
        ];
      };
    };

    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_user_profile_owner: { Args: { profile_id: string }; Returns: boolean };
    };

    Enums: {
      user_role:
        | "proprietaire"
        | "proprietaire_pro"
        | "concierge"
        | "concierge_pro"
        | "service"
        | "service_pro"
        | "admin";
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Types helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Custom types pour les tables spécifiques
export type ProfilesUpdate = TablesUpdate<'profiles'>;
export type HousingUpdate = TablesUpdate<'housing'>;
export type ServiceCatalogInsert = TablesInsert<'services_catalog'>;
export type ServiceCatalogUpdate = TablesUpdate<'services_catalog'>;

export type UserRole =
  | "owner"
  | "owner_pro"
  | "concierge"
  | "concierge_pro"
  | "provider"
  | "provider_pro"
  | "artisan"
  | "artisan_pro"
  | "admin"
  | "super_admin";