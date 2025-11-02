export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

  // /types/supabase.ts

// Enum des rôles Supabase (issu de ton Database)
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

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alertes: {
        Row: {
          category: string | null
          created_at: string
          id: number
          latitude: number | null
          location: string | null
          longitude: number | null
          message: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: number
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          message: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: number
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          message?: string
          user_id?: string
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
          key: string | null
          label: string | null
          new_id: string | null
        }
        Insert: {
          description?: string | null
          group_key?: string | null
          icon?: string | null
          id?: number
          image?: string | null
          key?: string | null
          label?: string | null
          new_id?: string | null
        }
        Update: {
          description?: string | null
          group_key?: string | null
          icon?: string | null
          id?: number
          image?: string | null
          key?: string | null
          label?: string | null
          new_id?: string | null
        }
        Relationships: []
      }
      profile_services: {
        Row: {
          id: number
          new_id: string | null
          new_profile_id: string | null
          profile_id: number | null
          service: string | null
        }
        Insert: {
          id?: number
          new_id?: string | null
          new_profile_id?: string | null
          profile_id?: number | null
          service?: string | null
        }
        Update: {
          id?: number
          new_id?: string | null
          new_profile_id?: string | null
          profile_id?: number | null
          service?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available: boolean | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string | null
          photo: string | null
          type: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          photo?: string | null
          type?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          photo?: string | null
          type?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          new_id: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          new_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          new_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
