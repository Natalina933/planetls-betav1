//src/app/lib/types.ts
// ================================
// Types généraux et structure Supabase
// ================================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];


// ================================
// Structure principale Supabase
// ================================
export type Database = {
  public: {
    Tables: {
      // --------- PROFILS ---------
      profiles: {
        Row: {
          id: string;
          username: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          additional_info: string | null;
          category: string | null;
          role: string | null;
          created_at: string;
          location: string | null;
          option: string | null;
          search_target: string | null;
          updated_at?: string | null; 
        };
        Insert: {
          id?: string;
          username?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          additional_info?: string | null;
          category?: string | null;
          role?: string | null;
          created_at?: string;
          location?: string | null;
          option?: string | null;
          search_target?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          additional_info?: string | null;
          category?: string | null;
          role?: string | null;
          created_at?: string;
          location?: string | null;
          option?: string | null;
          search_target?: string | null;
          updated_at?: string | null;
        };
      };

      // --------- PROFILE SERVICES ---------
      profile_services: {
        Row: {
          id: number;
          profile_id: string;
          service_id: number;
          selected: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: number; // auto
          profile_id: string;
          service_id: number;
          selected?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          profile_id?: string;
          service_id?: number;
          selected?: boolean | null;
          created_at?: string | null;
        };
      };

      // --------- ALERTES ---------
      alertes: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          category: string;
          location: string;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          message: string;
          category: string;
          location: string;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          message?: string;
          category?: string;
          location?: string;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
      };

      // --------- SERVICES CATALOG ---------
      services_catalog: {
        Row: {
          id: number;
          category: "proprietaire" | "concierge" | "artisan";
          service: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          category: "proprietaire" | "concierge" | "artisan";
          service: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          category?: "proprietaire" | "concierge" | "artisan";
          service?: string;
          description?: string | null;
          created_at?: string;
        };
      };

      // --------- CATEGORIES ---------
      categories: {
        Row: {
          id: number;
          key: string;
          label: string;
          icon: string | null;
          image: string | null;
          description: string | null;
          groupkey: string | null;
          newid: string | null;
        };
        Insert: {
          key: string;
          label: string;
          icon?: string | null;
          image?: string | null;
          description?: string | null;
          groupkey?: string | null;
          newid?: string | null;
        };
        Update: {
          key?: string;
          label?: string;
          icon?: string | null;
          image?: string | null;
          description?: string | null;
          groupkey?: string | null;
          newid?: string | null;
        };
      };

      // --------- USER ROLES ---------
      user_roles: {
        Row: {
          code: string;
          label: string;
          ordre: number;
          ispro: boolean;
          groupkey: string;
        };
        Insert: {
          code: string;
          label: string;
          ordre: number;
          ispro: boolean;
          groupkey: string;
        };
        Update: {
          code?: string;
          label?: string;
          ordre?: number;
          ispro?: boolean;
          groupkey?: string;
        };
      };
    };
  };
}

// ================================
// Aliases pratiques
// ================================
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type ProfileServiceRow = Database["public"]["Tables"]["profile_services"]["Row"];
export type ProfileServiceInsert = Database["public"]["Tables"]["profile_services"]["Insert"];
export type ProfileServiceUpdate = Database["public"]["Tables"]["profile_services"]["Update"];

export type AlerteRow = Database["public"]["Tables"]["alertes"]["Row"];
export type AlerteInsert = Database["public"]["Tables"]["alertes"]["Insert"];
export type AlerteUpdate = Database["public"]["Tables"]["alertes"]["Update"];

export type ServiceCatalogRow = Database["public"]["Tables"]["services_catalog"]["Row"];
export type ServiceCatalogInsert = Database["public"]["Tables"]["services_catalog"]["Insert"];
export type ServiceCatalogUpdate = Database["public"]["Tables"]["services_catalog"]["Update"];

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];
export type UserRoleInsert = Database["public"]["Tables"]["user_roles"]["Insert"];
export type UserRoleUpdate = Database["public"]["Tables"]["user_roles"]["Update"];
