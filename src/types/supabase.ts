export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

// =========================================
// 🔹 BASE DE DONNÉES SUPABASE
// =========================================
export interface Database {
  public: {
    Tables: {
      // -----------------------
      // 🧍‍♂️ PROFILES
      // -----------------------
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
          created_at: string;
          location: string | null;
          option: string | null;
          search_target: string | null;
          role: string | null;
          password: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          additional_info?: string | null;
          category?: string | null;
          created_at?: string;
          location?: string | null;
          option?: string | null;
          search_target?: string | null;
          role?: string | null;
          password?: string | null;
        };
        Update: {
          username?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          additional_info?: string | null;
          category?: string | null;
          created_at?: string;
          location?: string | null;
          option?: string | null;
          search_target?: string | null;
          role?: string | null;
          password?: string | null;
        };
      };

      // -----------------------
      // 🧩 SERVICES CATALOG
      // -----------------------
      services_catalog: {
        Row: {
          id: number;
          category: "proprietaire" | "concierge" | "artisan";
          service: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
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

      // -----------------------
      // 🔗 PROFILE SERVICES (liaison profil ↔ services_catalog)
      // -----------------------
      profile_services: {
        Row: {
          id: number;
          profile_id: string;
          service_id: number;
          selected: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          profile_id: string;
          service_id: number;
          selected?: boolean | null;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          service_id?: number;
          selected?: boolean | null;
          created_at?: string;
        };
      };

      // -----------------------
      // 🚨 ALERTES
      // -----------------------
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
    };
  };
}

// =========================================
// 🔹 TYPES DÉRIVÉS
// =========================================

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type ServiceCatalog = Database["public"]["Tables"]["services_catalog"]["Row"];
export type ProfileServiceRow = Database["public"]["Tables"]["profile_services"]["Row"];
export type AlerteRow = Database["public"]["Tables"]["alertes"]["Row"];
