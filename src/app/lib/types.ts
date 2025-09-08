export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          type: string;
          photo: string | null;
          latitude: number | null;
          longitude: number | null;
          available: boolean;
        };
        Insert: {
          name: string;
          type: string;
          photo?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          available?: boolean;
        };
        Update: {
          name?: string;
          type?: string;
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
