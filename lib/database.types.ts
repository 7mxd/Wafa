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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          contact_id: string
          created_at: string
          owner_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          owner_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["loan_status"] | null
          id: string
          kind: string
          loan_id: string
          note: string | null
          to_status: Database["public"]["Enums"]["loan_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["loan_status"] | null
          id?: string
          kind: string
          loan_id: string
          note?: string | null
          to_status: Database["public"]["Enums"]["loan_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["loan_status"] | null
          id?: string
          kind?: string
          loan_id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["loan_status"]
        }
        Relationships: [
          {
            foreignKeyName: "loan_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_events_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          ai_summary: string | null
          amount: number
          borrower_id: string
          counter_amount: number | null
          counter_due_date: string | null
          counter_note: string | null
          created_at: string
          currency: string
          decline_reason: string | null
          due_date: string | null
          id: string
          lender_id: string
          reason: string
          settled_at: string | null
          status: Database["public"]["Enums"]["loan_status"]
          transferred_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          amount: number
          borrower_id: string
          counter_amount?: number | null
          counter_due_date?: string | null
          counter_note?: string | null
          created_at?: string
          currency?: string
          decline_reason?: string | null
          due_date?: string | null
          id?: string
          lender_id: string
          reason: string
          settled_at?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          transferred_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          amount?: number
          borrower_id?: string
          counter_amount?: number | null
          counter_due_date?: string | null
          counter_note?: string | null
          created_at?: string
          currency?: string
          decline_reason?: string | null
          due_date?: string | null
          id?: string
          lender_id?: string
          reason?: string
          settled_at?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          transferred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string
          display_name: string
          iban: string | null
          id: string
          swift_bic: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          display_name: string
          iban?: string | null
          id: string
          swift_bic?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          display_name?: string
          iban?: string | null
          id?: string
          swift_bic?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          display_name: string | null
          id: string | null
        }
        Insert: {
          display_name?: string | null
          id?: string | null
        }
        Update: {
          display_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_counter: { Args: { p_loan_id: string }; Returns: undefined }
      add_contact_by_email: { Args: { p_email: string }; Returns: string }
      approve_loan: { Args: { p_loan_id: string }; Returns: undefined }
      confirm_settled: { Args: { p_loan_id: string }; Returns: undefined }
      counter_loan: {
        Args: {
          p_counter_amount: number
          p_counter_due_date?: string
          p_counter_note?: string
          p_loan_id: string
        }
        Returns: undefined
      }
      create_loan: {
        Args: {
          p_ai_summary?: string
          p_amount: number
          p_due_date?: string
          p_lender_id: string
          p_reason: string
        }
        Returns: string
      }
      decline_loan: {
        Args: { p_decline_reason?: string; p_loan_id: string }
        Returns: undefined
      }
      delete_loan: { Args: { p_loan_id: string }; Returns: undefined }
      get_lender_iban: { Args: { p_loan_id: string }; Returns: string }
      get_lender_payment_details: { Args: { p_loan_id: string }; Returns: Json }
      get_my_iban: { Args: Record<PropertyKey, never>; Returns: string }
      get_my_payment_details: { Args: Record<PropertyKey, never>; Returns: Json }
      mark_transferred: { Args: { p_loan_id: string }; Returns: undefined }
      remove_contact: { Args: { p_contact_id: string }; Returns: undefined }
      set_iban: { Args: { p_iban: string }; Returns: undefined }
      set_payment_details: {
        Args: {
          p_account_holder_name?: string
          p_account_number?: string
          p_bank_name?: string
          p_iban?: string
          p_swift_bic?: string
        }
        Returns: undefined
      }
      withdraw_loan: { Args: { p_loan_id: string }; Returns: undefined }
    }
    Enums: {
      loan_status:
        | "pending"
        | "countered"
        | "active"
        | "repaid_pending"
        | "settled"
        | "declined"
        | "withdrawn"
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
      loan_status: [
        "pending",
        "countered",
        "active",
        "repaid_pending",
        "settled",
        "declined",
        "withdrawn",
      ],
    },
  },
} as const
