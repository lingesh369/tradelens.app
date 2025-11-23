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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_id: string
          account_name: string
          broker: string | null
          commission: number | null
          created_on: string | null
          current_balance: number | null
          fees: number | null
          profit_loss: number | null
          starting_balance: number | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string
          account_name: string
          broker?: string | null
          commission?: number | null
          created_on?: string | null
          current_balance?: number | null
          fees?: number | null
          profit_loss?: number | null
          starting_balance?: number | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          account_name?: string
          broker?: string | null
          commission?: number | null
          created_on?: string | null
          current_balance?: number | null
          fees?: number | null
          profit_loss?: number | null
          starting_balance?: number | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      app_users: {
        Row: {
          auth_id: string
          created_at: string | null
          email: string
          first_name: string | null
          last_name: string | null
          notes: string | null
          profile_data: Json | null
          profile_picture_url: string | null
          updated_at: string | null
          user_id: string
          user_role: string | null
          user_status: string | null
          username: string | null
        }
        Insert: {
          auth_id: string
          created_at?: string | null
          email: string
          first_name?: string | null
          last_name?: string | null
          notes?: string | null
          profile_data?: Json | null
          profile_picture_url?: string | null
          updated_at?: string | null
          user_id?: string
          user_role?: string | null
          user_status?: string | null
          username?: string | null
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          email?: string
          first_name?: string | null
          last_name?: string | null
          notes?: string | null
          profile_data?: Json | null
          profile_picture_url?: string | null
          updated_at?: string | null
          user_id?: string
          user_role?: string | null
          user_status?: string | null
          username?: string | null
        }
        Relationships: []
      }
      // Additional tables would continue here...
      // Note: This is a truncated version for file size management
      // The complete types are available from the production database
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R
    }
      ? R
      : never)
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
    ? (Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never)
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
      ? I
      : never)
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
    ? (Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
        ? I
        : never)
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
      ? U
      : never)
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
    ? (Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
        ? U
        : never)
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof (Database["public"]["Enums"])
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicEnumNameOrOptions["schema"]]["Enums"])
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof (Database["public"]["Enums"])
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never