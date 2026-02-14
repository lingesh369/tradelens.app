export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: string | null
          broker: string | null
          commission: number | null
          created_at: string | null
          currency: string | null
          current_balance: number
          fees: number | null
          id: string
          initial_balance: number
          is_active: boolean | null
          name: string
          notes: string | null
          profit_loss: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type?: string | null
          broker?: string | null
          commission?: number | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number
          fees?: number | null
          id?: string
          initial_balance?: number
          is_active?: boolean | null
          name: string
          notes?: string | null
          profit_loss?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: string | null
          broker?: string | null
          commission?: number | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number
          fees?: number | null
          id?: string
          initial_balance?: number
          is_active?: boolean | null
          name?: string
          notes?: string | null
          profit_loss?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_user_id: string
          commission_amount: number
          commission_percentage: number
          created_at: string | null
          currency: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_amount: number
          payment_id: string | null
          referred_user_id: string
          status: string | null
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_user_id: string
          commission_amount: number
          commission_percentage: number
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_amount: number
          payment_id?: string | null
          referred_user_id: string
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_user_id?: string
          commission_amount?: number
          commission_percentage?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number
          payment_id?: string | null
          referred_user_id?: string
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_user_id_fkey"
            columns: ["affiliate_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_affiliate_user_id_fkey"
            columns: ["affiliate_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "affiliate_commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "affiliate_commissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "affiliate_commissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          affiliate_code: string | null
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          email_verified: boolean | null
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_name: string | null
          onboarding_completed: boolean | null
          profile_completed: boolean | null
          referred_by: string | null
          signup_source: string | null
          subscription_status: string | null
          trial_end_date: string | null
          updated_at: string | null
          user_role: string | null
          username: string
        }
        Insert: {
          affiliate_code?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          email_verified?: boolean | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          profile_completed?: boolean | null
          referred_by?: string | null
          signup_source?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          user_role?: string | null
          username: string
        }
        Update: {
          affiliate_code?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          email_verified?: boolean | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          profile_completed?: boolean | null
          referred_by?: string | null
          signup_source?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          user_role?: string | null
          username?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          account_id: string | null
          broker: string | null
          commission: number | null
          commission_type: string
          commission_value: number
          created_at: string | null
          currency: string | null
          fees: number | null
          id: string
          is_active: boolean | null
          market_type: string | null
          maximum_commission: number | null
          minimum_commission: number | null
          notes: string | null
          total_fees: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          broker?: string | null
          commission?: number | null
          commission_type: string
          commission_value: number
          created_at?: string | null
          currency?: string | null
          fees?: number | null
          id?: string
          is_active?: boolean | null
          market_type?: string | null
          maximum_commission?: number | null
          minimum_commission?: number | null
          notes?: string | null
          total_fees?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          broker?: string | null
          commission?: number | null
          commission_type?: string
          commission_value?: number
          created_at?: string | null
          currency?: string | null
          fees?: number | null
          id?: string
          is_active?: boolean | null
          market_type?: string | null
          maximum_commission?: number | null
          minimum_commission?: number | null
          notes?: string | null
          total_fees?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          discount_amount: number
          id: string
          payment_id: string | null
          subscription_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          id?: string
          payment_id?: string | null
          subscription_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          id?: string
          payment_id?: string | null
          subscription_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "coupon_usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          currency_restriction: string[] | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit_per_user: number | null
          usage_limit_total: number | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          currency_restriction?: string[] | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit_per_user?: number | null
          usage_limit_total?: number | null
          valid_from?: string
          valid_until: string
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          currency_restriction?: string[] | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit_per_user?: number | null
          usage_limit_total?: number | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          provider: string | null
          provider_message_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string | null
          template_data: Json | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status: string
          subject?: string | null
          template_data?: Json | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_data?: Json | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_queue: {
        Row: {
          created_at: string | null
          email_data: Json
          email_type: string
          error_message: string | null
          id: string
          max_retries: number | null
          recipient_email: string
          retry_count: number | null
          sent_at: string | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_data?: Json
          email_type: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          recipient_email: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_data?: Json
          email_type?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          recipient_email?: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_message: string
          error_stack: string | null
          function_name: string
          id: string
          occurred_at: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          function_name: string
          id?: string
          occurred_at?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          function_name?: string
          id?: string
          occurred_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      function_logs: {
        Row: {
          called_at: string
          created_at: string
          duration_ms: number
          error_message: string | null
          function_name: string
          id: string
          metadata: Json | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          called_at?: string
          created_at?: string
          duration_ms: number
          error_message?: string | null
          function_name: string
          id?: string
          metadata?: Json | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          called_at?: string
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          function_name?: string
          id?: string
          metadata?: Json | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "function_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "function_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      journal: {
        Row: {
          content: string | null
          created_at: string | null
          goals_for_tomorrow: string | null
          id: string
          is_pinned: boolean | null
          journal_date: string
          lessons_learned: string | null
          market_conditions: string | null
          mood: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          goals_for_tomorrow?: string | null
          id?: string
          is_pinned?: boolean | null
          journal_date: string
          lessons_learned?: string | null
          market_conditions?: string | null
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          goals_for_tomorrow?: string | null
          id?: string
          is_pinned?: boolean | null
          journal_date?: string
          lessons_learned?: string | null
          market_conditions?: string | null
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      journal_images: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_name: string | null
          image_url: string
          journal_id: string
          linked_trade_id: string | null
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_name?: string | null
          image_url: string
          journal_id: string
          linked_trade_id?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_name?: string | null
          image_url?: string
          journal_id?: string
          linked_trade_id?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_images_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_images_linked_trade_id_fkey"
            columns: ["linked_trade_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "journal_images_linked_trade_id_fkey"
            columns: ["linked_trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_images_linked_trade_id_fkey"
            columns: ["linked_trade_id"]
            isOneToOne: false
            referencedRelation: "trades_with_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string | null
          color: string | null
          content: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          color?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_type: string | null
          action_url: string | null
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          priority: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_type?: string | null
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          priority?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_type?: string | null
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          priority?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      partial_exits: {
        Row: {
          created_at: string | null
          exit_price: number
          exit_quantity: number
          exit_time: string
          fees: number | null
          id: string
          notes: string | null
          trade_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exit_price: number
          exit_quantity: number
          exit_time: string
          fees?: number | null
          id?: string
          notes?: string | null
          trade_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exit_price?: number
          exit_quantity?: number
          exit_time?: string
          fees?: number | null
          id?: string
          notes?: string | null
          trade_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partial_exits_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "partial_exits_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partial_exits_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_with_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partial_exits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partial_exits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_history: {
        Row: {
          admin_notes: string | null
          amount: number
          cashfree_order_id: string | null
          cashfree_payment_session_id: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          discount_amount: number | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          order_number: string | null
          original_amount: number | null
          paid_at: string | null
          payment_gateway: string | null
          payment_method: string | null
          provider_ref: string | null
          refunded_at: string | null
          status: string
          subscription_id: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          cashfree_order_id?: string | null
          cashfree_payment_session_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_amount?: number | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          order_number?: string | null
          original_amount?: number | null
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          provider_ref?: string | null
          refunded_at?: string | null
          status: string
          subscription_id?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          cashfree_order_id?: string | null
          cashfree_payment_session_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_amount?: number | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          order_number?: string | null
          original_amount?: number | null
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          provider_ref?: string | null
          refunded_at?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pinned_trades: {
        Row: {
          created_at: string | null
          id: string
          pin_order: number | null
          trade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pin_order?: number | null
          trade_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pin_order?: number | null
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_trades_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "pinned_trades_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_trades_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_with_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rate_limit_logs: {
        Row: {
          created_at: string
          endpoint: string
          exceeded_at: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          exceeded_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          exceeded_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_limit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      strategies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_public: boolean | null
          is_shared: boolean | null
          losing_trades: number | null
          losses: number | null
          name: string
          net_pl: number | null
          notes: string | null
          rules: Json | null
          shared_at: string | null
          shared_by_user_id: string | null
          total_pnl: number | null
          total_trades: number | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          is_shared?: boolean | null
          losing_trades?: number | null
          losses?: number | null
          name: string
          net_pl?: number | null
          notes?: string | null
          rules?: Json | null
          shared_at?: string | null
          shared_by_user_id?: string | null
          total_pnl?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          is_shared?: boolean | null
          losing_trades?: number | null
          losses?: number | null
          name?: string
          net_pl?: number | null
          notes?: string | null
          rules?: Json | null
          shared_at?: string | null
          shared_by_user_id?: string | null
          total_pnl?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "strategies_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategies_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "strategies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      strategy_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          rule_description: string | null
          rule_order: number | null
          rule_title: string
          rule_type: string
          strategy_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rule_description?: string | null
          rule_order?: number | null
          rule_title: string
          rule_type: string
          strategy_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rule_description?: string | null
          rule_order?: number | null
          rule_title?: string
          rule_type?: string
          strategy_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_rules_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_event_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          performed_by: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          performed_by?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          performed_by?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_event_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_event_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscription_event_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "active_subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "subscription_event_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_event_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_event_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          cashfree_plan_id_monthly: string | null
          cashfree_plan_id_yearly: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_name: string
          features: Json
          id: string
          is_active: boolean | null
          is_default: boolean | null
          limits: Json
          name: string
          plan_type: string | null
          price_monthly: number | null
          price_yearly: number | null
          sort_order: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          cashfree_plan_id_monthly?: string | null
          cashfree_plan_id_yearly?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          limits?: Json
          name: string
          plan_type?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          cashfree_plan_id_monthly?: string | null
          cashfree_plan_id_yearly?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          limits?: Json
          name?: string
          plan_type?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          linked_strategies: string | null
          linked_trades: string | null
          name: string
          tag_type: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          linked_strategies?: string | null
          linked_trades?: string | null
          name: string
          tag_type?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          linked_strategies?: string | null
          linked_trades?: string | null
          name?: string
          tag_type?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trade_comments: {
        Row: {
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          parent_comment_id: string | null
          trade_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_comment_id?: string | null
          trade_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_comment_id?: string | null
          trade_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "trade_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_comments_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trade_comments_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_comments_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_with_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trade_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_name: string | null
          image_type: string | null
          image_url: string
          notes: string | null
          trade_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_name?: string | null
          image_type?: string | null
          image_url: string
          notes?: string | null
          trade_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_name?: string | null
          image_type?: string | null
          image_url?: string
          notes?: string | null
          trade_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_images_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trade_images_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_images_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_with_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trade_likes: {
        Row: {
          created_at: string | null
          id: string
          trade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          trade_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_likes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trade_likes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_likes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_with_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trade_metrics: {
        Row: {
          calculated_at: string | null
          gross_p_and_l: number | null
          gross_pnl: number | null
          id: string
          mae: number | null
          max_drawdown: number | null
          max_profit: number | null
          mfe: number | null
          net_p_and_l: number | null
          net_pnl: number | null
          percent_gain: number | null
          pnl: number | null
          r_multiple: number | null
          r2r: number | null
          reward_amount: number | null
          risk_amount: number | null
          risk_reward_ratio: number | null
          trade_duration: unknown
          trade_duration_minutes: number | null
          trade_id: string
          trade_outcome: string | null
          trade_result: string | null
          user_id: string
        }
        Insert: {
          calculated_at?: string | null
          gross_p_and_l?: number | null
          gross_pnl?: number | null
          id?: string
          mae?: number | null
          max_drawdown?: number | null
          max_profit?: number | null
          mfe?: number | null
          net_p_and_l?: number | null
          net_pnl?: number | null
          percent_gain?: number | null
          pnl?: number | null
          r_multiple?: number | null
          r2r?: number | null
          reward_amount?: number | null
          risk_amount?: number | null
          risk_reward_ratio?: number | null
          trade_duration?: unknown
          trade_duration_minutes?: number | null
          trade_id: string
          trade_outcome?: string | null
          trade_result?: string | null
          user_id: string
        }
        Update: {
          calculated_at?: string | null
          gross_p_and_l?: number | null
          gross_pnl?: number | null
          id?: string
          mae?: number | null
          max_drawdown?: number | null
          max_profit?: number | null
          mfe?: number | null
          net_p_and_l?: number | null
          net_pnl?: number | null
          percent_gain?: number | null
          pnl?: number | null
          r_multiple?: number | null
          r2r?: number | null
          reward_amount?: number | null
          risk_amount?: number | null
          risk_reward_ratio?: number | null
          trade_duration?: unknown
          trade_duration_minutes?: number | null
          trade_id?: string
          trade_outcome?: string | null
          trade_result?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_metrics_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: true
            referencedRelation: "community_feed"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trade_metrics_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: true
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_metrics_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: true
            referencedRelation: "trades_with_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trade_tags: {
        Row: {
          created_at: string | null
          id: string
          tag_id: string
          trade_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_id: string
          trade_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tag_id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_tags_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trade_tags_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_tags_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades_with_images"
            referencedColumns: ["id"]
          },
        ]
      }
      trader_profiles: {
        Row: {
          about_content: string | null
          bio: string | null
          created_at: string | null
          id: string
          is_public: boolean | null
          location: string | null
          preferred_markets: string[] | null
          privacy_settings: Json | null
          profile_data: Json | null
          risk_tolerance: string | null
          social_links: Json | null
          stats_visibility: Json | null
          timezone: string | null
          total_pnl: number | null
          total_trades: number | null
          trading_experience: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
          win_rate: number | null
        }
        Insert: {
          about_content?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          preferred_markets?: string[] | null
          privacy_settings?: Json | null
          profile_data?: Json | null
          risk_tolerance?: string | null
          social_links?: Json | null
          stats_visibility?: Json | null
          timezone?: string | null
          total_pnl?: number | null
          total_trades?: number | null
          trading_experience?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
          win_rate?: number | null
        }
        Update: {
          about_content?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          preferred_markets?: string[] | null
          privacy_settings?: Json | null
          profile_data?: Json | null
          risk_tolerance?: string | null
          social_links?: Json | null
          stats_visibility?: Json | null
          timezone?: string | null
          total_pnl?: number | null
          total_trades?: number | null
          trading_experience?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trader_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trader_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trades: {
        Row: {
          account_id: string | null
          action: string
          additional_images: Json | null
          chart_link: string | null
          commission: number | null
          contract: string | null
          contract_multiplier: number | null
          created_at: string | null
          entry_price: number
          entry_time: string
          exit_price: number | null
          exit_time: string | null
          fees: number | null
          id: string
          instrument: string
          is_shared: boolean | null
          main_image: string | null
          market_type: string | null
          notes: string | null
          parent_trade_id: string | null
          partial_exits: Json | null
          quantity: number
          rating: number | null
          remaining_quantity: number | null
          shared_at: string | null
          shared_by_user_id: string | null
          sl: number | null
          status: string | null
          strategy_id: string | null
          tags: Json | null
          target: number | null
          tick_size: number | null
          tick_value: number | null
          total_exit_quantity: number | null
          trade_date: string | null
          trade_rating: number | null
          trade_time_frame: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          action: string
          additional_images?: Json | null
          chart_link?: string | null
          commission?: number | null
          contract?: string | null
          contract_multiplier?: number | null
          created_at?: string | null
          entry_price: number
          entry_time: string
          exit_price?: number | null
          exit_time?: string | null
          fees?: number | null
          id?: string
          instrument: string
          is_shared?: boolean | null
          main_image?: string | null
          market_type?: string | null
          notes?: string | null
          parent_trade_id?: string | null
          partial_exits?: Json | null
          quantity: number
          rating?: number | null
          remaining_quantity?: number | null
          shared_at?: string | null
          shared_by_user_id?: string | null
          sl?: number | null
          status?: string | null
          strategy_id?: string | null
          tags?: Json | null
          target?: number | null
          tick_size?: number | null
          tick_value?: number | null
          total_exit_quantity?: number | null
          trade_date?: string | null
          trade_rating?: number | null
          trade_time_frame?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          action?: string
          additional_images?: Json | null
          chart_link?: string | null
          commission?: number | null
          contract?: string | null
          contract_multiplier?: number | null
          created_at?: string | null
          entry_price?: number
          entry_time?: string
          exit_price?: number | null
          exit_time?: string | null
          fees?: number | null
          id?: string
          instrument?: string
          is_shared?: boolean | null
          main_image?: string | null
          market_type?: string | null
          notes?: string | null
          parent_trade_id?: string | null
          partial_exits?: Json | null
          quantity?: number
          rating?: number | null
          remaining_quantity?: number | null
          shared_at?: string | null
          shared_by_user_id?: string | null
          sl?: number | null
          status?: string | null
          strategy_id?: string | null
          tags?: Json | null
          target?: number | null
          tick_size?: number | null
          tick_value?: number | null
          total_exit_quantity?: number | null
          trade_date?: string | null
          trade_rating?: number | null
          trade_time_frame?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trades_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "trades_with_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trades_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_creation_log: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: unknown
          profile_created: boolean | null
          profile_creation_attempts: number | null
          profile_creation_error: string | null
          referrer: string | null
          signup_method: string | null
          signup_source: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address?: unknown
          profile_created?: boolean | null
          profile_creation_attempts?: number | null
          profile_creation_error?: string | null
          referrer?: string | null
          signup_method?: string | null
          signup_source?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: unknown
          profile_created?: boolean | null
          profile_creation_attempts?: number | null
          profile_creation_error?: string | null
          referrer?: string | null
          signup_method?: string | null
          signup_source?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_creation_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_creation_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_push_tokens: {
        Row: {
          created_at: string | null
          device_info: Json | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          id: string
          metadata: Json | null
          next_billing_date: string | null
          payment_gateway: string | null
          plan_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          metadata?: Json | null
          next_billing_date?: string | null
          payment_gateway?: string | null
          plan_id: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          metadata?: Json | null
          next_billing_date?: string | null
          payment_gateway?: string | null
          plan_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      active_subscriptions: {
        Row: {
          billing_cycle: string | null
          current_period_end: string | null
          current_period_start: string | null
          email: string | null
          features: Json | null
          limits: Json | null
          payment_gateway: string | null
          plan_display_name: string | null
          plan_name: string | null
          status: string | null
          subscription_health: string | null
          subscription_id: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_feed: {
        Row: {
          action: string | null
          avatar_url: string | null
          bio: string | null
          comment_count: number | null
          entry_price: number | null
          entry_time: string | null
          exit_price: number | null
          exit_time: string | null
          instrument: string | null
          like_count: number | null
          main_image: string | null
          net_pnl: number | null
          notes: string | null
          percent_gain: number | null
          shared_at: string | null
          status: string | null
          trade_id: string | null
          trade_result: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      expiring_trials: {
        Row: {
          days_remaining: number | null
          email: string | null
          signup_date: string | null
          trade_count: number | null
          trial_end_date: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          days_remaining?: never
          email?: string | null
          signup_date?: string | null
          trade_count?: never
          trial_end_date?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          days_remaining?: never
          email?: string | null
          signup_date?: string | null
          trade_count?: never
          trial_end_date?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      function_performance_summary: {
        Row: {
          avg_duration_ms: number | null
          failed_calls: number | null
          function_name: string | null
          max_duration_ms: number | null
          min_duration_ms: number | null
          success_rate: number | null
          successful_calls: number | null
          total_calls: number | null
        }
        Relationships: []
      }
      index_usage: {
        Row: {
          idx_scan: number | null
          idx_tup_fetch: number | null
          idx_tup_read: number | null
          index_size: string | null
          indexname: unknown
          schemaname: unknown
          tablename: unknown
        }
        Relationships: []
      }
      table_sizes: {
        Row: {
          schemaname: unknown
          size: string | null
          size_bytes: number | null
          tablename: unknown
        }
        Relationships: []
      }
      trades_with_images: {
        Row: {
          account_id: string | null
          action: string | null
          chart_link: string | null
          commission: number | null
          contract: string | null
          contract_multiplier: number | null
          created_at: string | null
          entry_price: number | null
          entry_time: string | null
          exit_price: number | null
          exit_time: string | null
          fees: number | null
          id: string | null
          images: Json | null
          instrument: string | null
          is_shared: boolean | null
          main_image: string | null
          market_type: string | null
          notes: string | null
          parent_trade_id: string | null
          quantity: number | null
          rating: number | null
          remaining_quantity: number | null
          shared_at: string | null
          shared_by_user_id: string | null
          sl: number | null
          status: string | null
          strategy_id: string | null
          target: number | null
          tick_size: number | null
          tick_value: number | null
          trade_date: string | null
          trade_time_frame: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trades_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "trades_with_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trades_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      unused_indexes: {
        Row: {
          index_size: string | null
          indexname: unknown
          schemaname: unknown
          tablename: unknown
        }
        Relationships: []
      }
      user_rate_limit_violations: {
        Row: {
          email: string | null
          endpoint: string | null
          last_violation: string | null
          username: string | null
          violation_count: number | null
        }
        Relationships: []
      }
      user_trade_summary: {
        Row: {
          avg_loss: number | null
          avg_pnl: number | null
          avg_trade_duration_minutes: number | null
          avg_win: number | null
          best_trade: number | null
          breakeven_trades: number | null
          closed_trades: number | null
          losing_trades: number | null
          open_trades: number | null
          total_pnl: number | null
          total_trades: number | null
          user_id: string | null
          win_rate: number | null
          winning_trades: number | null
          worst_trade: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_trials"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      add_trade_image: {
        Args: {
          p_display_order: number
          p_image_name: string
          p_image_type: string
          p_image_url: string
          p_trade_id: string
          p_user_id: string
        }
        Returns: string
      }
      aggregate_journal_image_notes_for_date: {
        Args: { target_date: string; target_user_id: string }
        Returns: undefined
      }
      aggregate_trade_notes_for_date: {
        Args: { target_date: string; target_user_id: string }
        Returns: undefined
      }
      analyze_all_tables: { Args: never; Returns: undefined }
      assign_user_plan: {
        Args: {
          billing_cycle_param?: string
          plan_name_param: string
          start_date_param?: string
          target_user_id: string
        }
        Returns: Json
      }
      calculate_trade_metrics: {
        Args: { p_trade_id: string }
        Returns: undefined
      }
      check_admin_role: { Args: never; Returns: boolean }
      check_expired_subscriptions: { Args: never; Returns: Json }
      check_feature_access: {
        Args: { auth_user_id: string; feature_key: string }
        Returns: boolean
      }
      check_plan_limit: {
        Args: { p_limit_type: string; p_user_id: string }
        Returns: boolean
      }
      check_resource_limit: {
        Args: { auth_user_id: string; resource_type: string }
        Returns: Json
      }
      check_user_setup_status: { Args: never; Returns: Json }
      cleanup_old_logs: { Args: never; Returns: undefined }
      cleanup_old_notifications: {
        Args: { p_days_old?: number }
        Returns: number
      }
      create_notification:
        | {
            Args: {
              p_action_type?: string
              p_action_url?: string
              p_data?: Json
              p_message?: string
              p_priority?: string
              p_title: string
              p_type: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              action_url?: string
              message: string
              notification_type: string
              source_user_id?: string
              target_user_id: string
              title: string
              trade_id?: string
            }
            Returns: string
          }
      ensure_user_profile_exists: {
        Args: { user_auth_id: string }
        Returns: Json
      }
      generate_affiliate_code: { Args: never; Returns: string }
      generate_username_from_email: {
        Args: { email_input: string }
        Returns: string
      }
      get_admin_dashboard_metrics: {
        Args: never
        Returns: {
          active_users: number
          churn_rate: number
          mrr: number
          total_revenue: number
          total_trades: number
          total_users: number
          trial_users: number
        }[]
      }
      get_admin_payments: {
        Args: never
        Returns: {
          admin_notes: string
          amount: number
          billing_cycle: string
          created_at: string
          currency: string
          email: string
          invoice_id: string
          order_number: string
          payment_date: string
          payment_id: string
          payment_method: string
          payment_status: string
          subscription_plan: string
          transaction_id: string
          user_id: string
          username: string
        }[]
      }
      get_affiliate_stats: {
        Args: { p_user_id: string }
        Returns: {
          active_referrals: number
          conversion_rate: number
          paid_commissions: number
          pending_commissions: number
          total_commissions: number
          total_referrals: number
        }[]
      }
      get_current_user_internal_id: { Args: never; Returns: string }
      get_current_user_profile: {
        Args: never
        Returns: {
          created_at: string
          email: string
          email_verified: boolean
          first_name: string
          last_name: string
          profile_completed: boolean
          user_id: string
          user_role: string
          user_status: string
          username: string
        }[]
      }
      get_daily_pnl_series: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          daily_pnl: number
          losing_trades: number
          trade_count: number
          trade_date: string
          winning_trades: number
        }[]
      }
      get_follower_count: { Args: { p_user_id: string }; Returns: number }
      get_following_count: { Args: { p_user_id: string }; Returns: number }
      get_journal_stats: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: {
          avg_content_length: number
          entries_with_mood: number
          mood_distribution: Json
          most_common_tags: string[]
          total_entries: number
        }[]
      }
      get_market_distribution: {
        Args: { p_user_id: string }
        Returns: {
          market_type: string
          total_pnl: number
          trade_count: number
          win_rate: number
        }[]
      }
      get_payment_metrics: {
        Args: never
        Returns: {
          avg_payment_value: number
          total_payments_count: number
          total_revenue: number
        }[]
      }
      get_segment_user_ids: {
        Args: { segment_type: string }
        Returns: string[]
      }
      get_top_strategies: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          avg_pnl: number
          strategy_id: string
          strategy_name: string
          total_pnl: number
          total_trades: number
          win_rate: number
        }[]
      }
      get_trade_comment_count: { Args: { p_trade_id: string }; Returns: number }
      get_trade_like_count: { Args: { p_trade_id: string }; Returns: number }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_access_matrix: {
        Args: { auth_user_id: string }
        Returns: {
          accessblocked: boolean
          accountslimit: number
          accountsused: number
          aiaccess: boolean
          analyticsaccess: boolean
          communityaccess: boolean
          email: string
          enddate: string
          isactive: boolean
          nextbillingdate: string
          notesaccess: boolean
          plan_id: string
          plan_name: string
          plan_type: string
          profileaccess: boolean
          startdate: string
          status: string
          strategieslimit: number
          strategiesused: number
          tradeslimit: number
          tradesused: number
          trialenddate: string
          userid: string
          username: string
          userrole: string
          userstatus: string
        }[]
      }
      get_user_analytics: {
        Args: {
          p_account_id?: string
          p_end_date?: string
          p_start_date?: string
          p_strategy_id?: string
          p_user_id: string
        }
        Returns: {
          avg_loss: number
          avg_pnl: number
          avg_trade_duration_minutes: number
          avg_win: number
          best_trade: number
          closed_trades: number
          losing_trades: number
          open_trades: number
          profit_factor: number
          total_commission: number
          total_fees: number
          total_pnl: number
          total_trades: number
          win_rate: number
          winning_trades: number
          worst_trade: number
        }[]
      }
      get_user_id_from_auth: { Args: never; Returns: string }
      get_user_plan: {
        Args: { p_user_id: string }
        Returns: {
          features: Json
          limits: Json
          plan_id: string
          plan_name: string
          status: string
        }[]
      }
      get_user_segments: { Args: never; Returns: Json }
      has_liked_trade: {
        Args: { p_trade_id: string; p_user_id: string }
        Returns: boolean
      }
      initialize_default_user_accounts_strategies: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      invalidate_user_access_cache: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_following: {
        Args: { p_follower_id: string; p_following_id: string }
        Returns: boolean
      }
      is_user_setup_complete: { Args: never; Returns: boolean }
      mark_notifications_read: {
        Args: { p_notification_ids?: string[]; p_user_id: string }
        Returns: number
      }
      reindex_all_tables: { Args: never; Returns: undefined }
      remove_trade_image: {
        Args: { p_image_id: string; p_user_id: string }
        Returns: boolean
      }
      search_notes: {
        Args: { p_limit?: number; p_search_query: string; p_user_id: string }
        Returns: {
          category: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          rank: number
          tags: string[]
          title: string
          updated_at: string
        }[]
      }
      update_expired_subscriptions: { Args: never; Returns: undefined }
      update_journal_images_notes_for_date: {
        Args: { target_date: string; target_user_id: string }
        Returns: undefined
      }
      update_payment_admin_notes: {
        Args: { notes_param: string; payment_id_param: string }
        Returns: undefined
      }
      update_payment_status: {
        Args: { payment_id_param: string; status_param: string }
        Returns: undefined
      }
      update_user_role: {
        Args: { new_role: string; reason?: string; target_user_id: string }
        Returns: Json
      }
      upsert_user_subscription: {
        Args: {
          billing_cycle_param?: string
          plan_name_param: string
          start_date_param?: string
          target_user_id: string
        }
        Returns: Json
      }
      user_owns_record: { Args: { record_user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

