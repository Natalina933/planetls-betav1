// src/app/lib/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
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

      profile_services: {
        Row: {
          profile_id: string;
          service: string;
        };
        Insert: {
          profile_id: string;
          service: string;
        };
        Update: {
          profile_id?: string;
          service?: string;
        };
      };

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

// ✅ Aliases pratiques
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type ProfileServiceRow = Database["public"]["Tables"]["profile_services"]["Row"];
export type AlerteRow = Database["public"]["Tables"]["alertes"]["Row"];
