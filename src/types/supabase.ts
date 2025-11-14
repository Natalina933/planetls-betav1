// src/types/supabase.ts
// ================================
// Types généraux et structure Supabase
// ================================
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
      planning_entries: {
        Row: {
          created_at: string | null
          date: string
          id: string
          task: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          task: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          task?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_services: {
        Row: {
          created_at: string | null
          id: number
          profile_id: string
          selected: boolean | null
          service_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          profile_id: string
          selected?: boolean | null
          service_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          profile_id?: string
          selected?: boolean | null
          service_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_services_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_services_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          additional_info: string | null
          avatar_url: string | null
          category: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          location: string | null
          option: string | null
          password: string | null
          phone: string | null
          role: string | null
          search_target: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          additional_info?: string | null
          avatar_url?: string | null
          category?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          location?: string | null
          option?: string | null
          password?: string | null
          phone?: string | null
          role?: string | null
          search_target?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          additional_info?: string | null
          avatar_url?: string | null
          category?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          option?: string | null
          password?: string | null
          phone?: string | null
          role?: string | null
          search_target?: string | null
          updated_at?: string | null
          username?: string
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
      services_catalog: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: number
          service: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: number
          service: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: number
          service?: string
        }
        Relationships: []
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
      is_user_profile_owner:
        | { Args: { profile_id: string }; Returns: boolean }
        | { Args: never; Returns: boolean }
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

// Ajoute ces exports personnalisés à la fin de src/types/supabase.ts

export type ProfileUpdate = Partial<Database["public"]["Tables"]["profiles"]["Update"]>;
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ServiceCatalogRow = Database["public"]["Tables"]["services_catalog"]["Row"];
export type ProfileServicesRow = Database["public"]["Tables"]["profile_services"]["Row"];

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export type PlanningEntryRow = Database["public"]["Tables"]["planning_entries"]["Row"];
