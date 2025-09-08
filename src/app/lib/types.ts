export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          type: "proprietaire" | "concierge" | "artisan"; // mieux que string simple
          photo: string | null;
          latitude: number | null;
          longitude: number | null;
          available: boolean;
        };
        Insert: {
          name: string;
          type: "proprietaire" | "concierge" | "artisan";
          photo?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          available?: boolean;
        };
        Update: {
          name?: string;
          type?: "proprietaire" | "concierge" | "artisan";
          photo?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          available?: boolean;
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
          created_at: string;
        };
        Insert: {
          user_id: string;
          message: string;
        };
        Update: {
          user_id?: string;
          message?: string;
        };
      };
    };
  };
}

// Aliases pratiques
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type ProfileServiceRow = Database["public"]["Tables"]["profile_services"]["Row"];
export type AlerteRow = Database["public"]["Tables"]["alertes"]["Row"];
