// src/app/lib/types.ts
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
          category: "proprietaire" | "concierge" | "artisan";
          service: string;
          description?: string | null;
        };
        Update: {
          category?: "proprietaire" | "concierge" | "artisan";
          service?: string;
          description?: string | null;
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
          selected: boolean;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          service_id: number;
          selected?: boolean; // optionnel
        };
        Update: {
          profile_id?: string;
          service_id?: number;
          selected?: boolean;
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
        };
        Update: {
          user_id?: string;
          message?: string;
          category?: string;
          location?: string;
          latitude?: number | null;
          longitude?: number | null;
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

export type ServiceCatalog =
  Database["public"]["Tables"]["services_catalog"]["Row"];
export type ServiceCatalogInsert =
  Database["public"]["Tables"]["services_catalog"]["Insert"];
export type ServiceCatalogUpdate =
  Database["public"]["Tables"]["services_catalog"]["Update"];

export type ProfileServiceRow =
  Database["public"]["Tables"]["profile_services"]["Row"];
export type ProfileServiceInsert =
  Database["public"]["Tables"]["profile_services"]["Insert"];
export type ProfileServiceUpdate =
  Database["public"]["Tables"]["profile_services"]["Update"];

export type AlerteRow = Database["public"]["Tables"]["alertes"]["Row"];
export type AlerteInsert = Database["public"]["Tables"]["alertes"]["Insert"];
export type AlerteUpdate = Database["public"]["Tables"]["alertes"]["Update"];
