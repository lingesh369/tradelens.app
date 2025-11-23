export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          current_balance: number
          fees: number | null
          profit_loss: number | null
          starting_balance: number
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          account_id?: string
          account_name: string
          broker?: string | null
          commission?: number | null
          created_on?: string | null
          current_balance?: number
          fees?: number | null
          profit_loss?: number | null
          starting_balance: number
          status?: string
          type: string
          user_id?: string | null
        }
        Update: {
          account_id?: string
          account_name?: string
          broker?: string | null
          commission?: number | null
          created_on?: string | null
          current_balance?: number
          fees?: number | null
          profit_loss?: number | null
          starting_balance?: number
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_accounts_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          auth_id: string
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          profile_data: Json | null
          profile_picture_url: string | null
          updated_at: string | null
          user_role: string
          user_status: string
          username: string | null
        }
        Insert: {
          auth_id: string
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          profile_data?: Json | null
          profile_picture_url?: string | null
          updated_at?: string | null
          user_role?: string
          user_status?: string
          username?: string | null
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          profile_data?: Json | null
          profile_picture_url?: string | null
          updated_at?: string | null
          user_role?: string
          user_status?: string
          username?: string | null
        }
        Relationships: []
      }
      commissions: {
        Row: {
          account_id: string | null
          broker: string | null
          commission: number
          commission_id: string
          created_at: string | null
          fees: number
          market_type: string
          total_fees: number
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          broker?: string | null
          commission?: number
          commission_id?: string
          created_at?: string | null
          fees?: number
          market_type: string
          total_fees?: number
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          broker?: string | null
          commission?: number
          commission_id?: string
          created_at?: string | null
          fees?: number
          market_type?: string
          total_fees?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "fk_commissions_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
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
            foreignKeyName: "community_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          discount_applied: number
          id: string
          payment_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_applied?: number
          id?: string
          payment_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_applied?: number
          id?: string
          payment_id?: string | null
          used_at?: string
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
            referencedRelation: "payments"
            referencedColumns: ["payment_id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_plans: Json | null
          code: string
          created_at: string
          created_by: string | null
          currency_restriction: string | null
          discount_type: string
          discount_value: number
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
          usage_limit_per_user: number | null
          usage_limit_total: number | null
          used_count: number
          validity_end_date: string | null
          validity_start_date: string | null
        }
        Insert: {
          applicable_plans?: Json | null
          code: string
          created_at?: string
          created_by?: string | null
          currency_restriction?: string | null
          discount_type: string
          discount_value: number
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          usage_limit_per_user?: number | null
          usage_limit_total?: number | null
          used_count?: number
          validity_end_date?: string | null
          validity_start_date?: string | null
        }
        Update: {
          applicable_plans?: Json | null
          code?: string
          created_at?: string
          created_by?: string | null
          currency_restriction?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          usage_limit_per_user?: number | null
          usage_limit_total?: number | null
          used_count?: number
          validity_end_date?: string | null
          validity_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          email: string | null
          error_message: string | null
          id: string
          response_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          id?: string
          response_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          id?: string
          response_id?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      journal: {
        Row: {
          all_journal_images_notes: string | null
          all_trades_notes: string | null
          image_captions: Json | null
          journal_date: string | null
          journal_id: string
          losing_trades: number | null
          net_pl: number | null
          notes: string | null
          num_trades: number | null
          profit_factor: number | null
          total_fees: number | null
          total_losing_pl: number | null
          total_profitable_pl: number | null
          trades_executed: string | null
          user_id: string | null
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          all_journal_images_notes?: string | null
          all_trades_notes?: string | null
          image_captions?: Json | null
          journal_date?: string | null
          journal_id?: string
          losing_trades?: number | null
          net_pl?: number | null
          notes?: string | null
          num_trades?: number | null
          profit_factor?: number | null
          total_fees?: number | null
          total_losing_pl?: number | null
          total_profitable_pl?: number | null
          trades_executed?: string | null
          user_id?: string | null
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          all_journal_images_notes?: string | null
          all_trades_notes?: string | null
          image_captions?: Json | null
          journal_date?: string | null
          journal_id?: string
          losing_trades?: number | null
          net_pl?: number | null
          notes?: string | null
          num_trades?: number | null
          profit_factor?: number | null
          total_fees?: number | null
          total_losing_pl?: number | null
          total_profitable_pl?: number | null
          trades_executed?: string | null
          user_id?: string | null
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_journal_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_images: {
        Row: {
          created_at: string | null
          id: string
          image_name: string
          image_url: string
          journal_date: string
          linked_trade_id: string | null
          notes: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_name: string
          image_url: string
          journal_date: string
          linked_trade_id?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_name?: string
          image_url?: string
          journal_date?: string
          linked_trade_id?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_images_linked_trade_id_fkey"
            columns: ["linked_trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "journal_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          date: string | null
          note_id: string
          preview: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          date?: string | null
          note_id?: string
          preview?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          date?: string | null
          note_id?: string
          preview?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_notes_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_channel: string
          delivery_status: string | null
          error_message: string | null
          id: string
          notification_id: string | null
          read_at: string | null
          scheduled_notification_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_channel: string
          delivery_status?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          read_at?: string | null
          scheduled_notification_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_channel?: string
          delivery_status?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          read_at?: string | null
          scheduled_notification_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_scheduled_notification_id_fkey"
            columns: ["scheduled_notification_id"]
            isOneToOne: false
            referencedRelation: "scheduled_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_type: string | null
          comment_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          source_user_id: string | null
          status: string | null
          title: string
          trade_id: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_type?: string | null
          comment_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          source_user_id?: string | null
          status?: string | null
          title?: string
          trade_id?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string | null
          comment_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          source_user_id?: string | null
          status?: string | null
          title?: string
          trade_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      partial_exits: {
        Row: {
          created_at: string
          exit_price: number
          exit_quantity: number
          exit_time: string
          fees: number
          id: string
          trade_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exit_price: number
          exit_quantity: number
          exit_time: string
          fees?: number
          id?: string
          trade_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exit_price?: number
          exit_quantity?: number
          exit_time?: string
          fees?: number
          id?: string
          trade_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partial_exits_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["trade_id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_notes: string | null
          amount: number
          billing_cycle: string | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          currency: string
          description: string | null
          discount_applied: number | null
          invoice_id: string | null
          order_number: string | null
          original_amount: number | null
          payment_date: string
          payment_id: string
          payment_method: string | null
          payment_status: string
          plan_id: string | null
          provider_ref: string | null
          subscription_plan: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          billing_cycle?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          discount_applied?: number | null
          invoice_id?: string | null
          order_number?: string | null
          original_amount?: number | null
          payment_date?: string
          payment_id?: string
          payment_method?: string | null
          payment_status: string
          plan_id?: string | null
          provider_ref?: string | null
          subscription_plan?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          billing_cycle?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          discount_applied?: number | null
          invoice_id?: string | null
          order_number?: string | null
          original_amount?: number | null
          payment_date?: string
          payment_id?: string
          payment_method?: string | null
          payment_status?: string
          plan_id?: string | null
          provider_ref?: string | null
          subscription_plan?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      pinned_trades: {
        Row: {
          created_at: string
          id: string
          trade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trade_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_trades_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "pinned_trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notification_data: Json
          repeat_type: string | null
          scheduled_for: string
          status: string | null
          target_type: string
          target_user_ids: string[] | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notification_data: Json
          repeat_type?: string | null
          scheduled_for: string
          status?: string | null
          target_type: string
          target_user_ids?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notification_data?: Json
          repeat_type?: string | null
          scheduled_for?: string
          status?: string | null
          target_type?: string
          target_user_ids?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          accounts_linked: number | null
          base_currency: string | null
          custom_tags: string | null
          mistakes_tags: string | null
          setting_id: string
          subscription_status: string | null
          time_zone: string | null
          user_id: string | null
        }
        Insert: {
          accounts_linked?: number | null
          base_currency?: string | null
          custom_tags?: string | null
          mistakes_tags?: string | null
          setting_id?: string
          subscription_status?: string | null
          time_zone?: string | null
          user_id?: string | null
        }
        Update: {
          accounts_linked?: number | null
          base_currency?: string | null
          custom_tags?: string | null
          mistakes_tags?: string | null
          setting_id?: string
          subscription_status?: string | null
          time_zone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_settings_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          description: string | null
          is_public: boolean | null
          is_shared: boolean | null
          losses: number | null
          net_pl: number | null
          notes: string | null
          shared_at: string | null
          shared_by_user_id: string | null
          strategy_id: string
          strategy_name: string
          total_trades: number | null
          user_id: string | null
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          description?: string | null
          is_public?: boolean | null
          is_shared?: boolean | null
          losses?: number | null
          net_pl?: number | null
          notes?: string | null
          shared_at?: string | null
          shared_by_user_id?: string | null
          strategy_id?: string
          strategy_name: string
          total_trades?: number | null
          user_id?: string | null
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          description?: string | null
          is_public?: boolean | null
          is_shared?: boolean | null
          losses?: number | null
          net_pl?: number | null
          notes?: string | null
          shared_at?: string | null
          shared_by_user_id?: string | null
          strategy_id?: string
          strategy_name?: string
          total_trades?: number | null
          user_id?: string | null
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_strategies_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategies_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_rules: {
        Row: {
          created_at: string | null
          rule_description: string | null
          rule_id: string
          rule_title: string
          rule_type: string
          strategy_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          rule_description?: string | null
          rule_id?: string
          rule_title: string
          rule_type: string
          strategy_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          rule_description?: string | null
          rule_id?: string
          rule_title?: string
          rule_type?: string
          strategy_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_strategy_rules_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_rules_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["strategy_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          analytics_other_access: boolean | null
          analytics_overview_access: boolean | null
          created_at: string | null
          features: Json | null
          is_active: boolean | null
          limits: Json | null
          name: string
          notes_access: boolean | null
          plan_id: string
          price_monthly: number | null
          price_yearly: number | null
          profile_access: boolean | null
          trading_account_limit: number | null
          trading_strategy_limit: number | null
          validity_days: number | null
        }
        Insert: {
          analytics_other_access?: boolean | null
          analytics_overview_access?: boolean | null
          created_at?: string | null
          features?: Json | null
          is_active?: boolean | null
          limits?: Json | null
          name: string
          notes_access?: boolean | null
          plan_id?: string
          price_monthly?: number | null
          price_yearly?: number | null
          profile_access?: boolean | null
          trading_account_limit?: number | null
          trading_strategy_limit?: number | null
          validity_days?: number | null
        }
        Update: {
          analytics_other_access?: boolean | null
          analytics_overview_access?: boolean | null
          created_at?: string | null
          features?: Json | null
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          notes_access?: boolean | null
          plan_id?: string
          price_monthly?: number | null
          price_yearly?: number | null
          profile_access?: boolean | null
          trading_account_limit?: number | null
          trading_strategy_limit?: number | null
          validity_days?: number | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          description: string | null
          linked_strategies: string | null
          linked_trades: string | null
          tag_id: string
          tag_name: string
          tag_type: string | null
          user_id: string | null
        }
        Insert: {
          description?: string | null
          linked_strategies?: string | null
          linked_trades?: string | null
          tag_id?: string
          tag_name: string
          tag_type?: string | null
          user_id?: string | null
        }
        Update: {
          description?: string | null
          linked_strategies?: string | null
          linked_trades?: string | null
          tag_id?: string
          tag_name?: string
          tag_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tags_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          trade_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          trade_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          trade_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_comments_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trade_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_likes: {
        Row: {
          created_at: string
          id: string
          trade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trade_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_likes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trade_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_metrics: {
        Row: {
          created_at: string | null
          gross_p_and_l: number | null
          metric_id: string
          net_p_and_l: number | null
          percent_gain: number | null
          r2r: number | null
          total_fees: number | null
          trade_duration: unknown | null
          trade_id: string
          trade_outcome: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          gross_p_and_l?: number | null
          metric_id?: string
          net_p_and_l?: number | null
          percent_gain?: number | null
          r2r?: number | null
          total_fees?: number | null
          trade_duration?: unknown | null
          trade_id: string
          trade_outcome?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          gross_p_and_l?: number | null
          metric_id?: string
          net_p_and_l?: number | null
          percent_gain?: number | null
          r2r?: number | null
          total_fees?: number | null
          trade_duration?: unknown | null
          trade_id?: string
          trade_outcome?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_trade_metrics_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_trades"
            columns: ["trade_id"]
            isOneToOne: true
            referencedRelation: "trades"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trade_metrics_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: true
            referencedRelation: "trades"
            referencedColumns: ["trade_id"]
          },
        ]
      }
      trader_profiles: {
        Row: {
          about_content: Json | null
          bio: string | null
          created_at: string
          id: string
          is_public: boolean
          NEW: boolean | null
          privacy_settings: Json | null
          profile_data: Json | null
          social_links: Json | null
          stats_visibility: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          about_content?: Json | null
          bio?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          NEW?: boolean | null
          privacy_settings?: Json | null
          profile_data?: Json | null
          social_links?: Json | null
          stats_visibility?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          about_content?: Json | null
          bio?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          NEW?: boolean | null
          privacy_settings?: Json | null
          profile_data?: Json | null
          social_links?: Json | null
          stats_visibility?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trader_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
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
          contract_multiplier: number
          created_at: string | null
          entry_price: number
          entry_time: string | null
          exit_price: number | null
          exit_time: string | null
          fees: number | null
          instrument: string
          is_public: boolean | null
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
          trade_id: string
          trade_rating: number | null
          trade_time_frame: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          action: string
          additional_images?: Json | null
          chart_link?: string | null
          commission?: number | null
          contract?: string | null
          contract_multiplier?: number
          created_at?: string | null
          entry_price: number
          entry_time?: string | null
          exit_price?: number | null
          exit_time?: string | null
          fees?: number | null
          instrument: string
          is_public?: boolean | null
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
          trade_id?: string
          trade_rating?: number | null
          trade_time_frame?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          action?: string
          additional_images?: Json | null
          chart_link?: string | null
          commission?: number | null
          contract?: string | null
          contract_multiplier?: number
          created_at?: string | null
          entry_price?: number
          entry_time?: string | null
          exit_price?: number | null
          exit_time?: string | null
          fees?: number | null
          instrument?: string
          is_public?: boolean | null
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
          trade_id?: string
          trade_rating?: number | null
          trade_time_frame?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_trades_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "trades_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["trade_id"]
          },
          {
            foreignKeyName: "trades_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["strategy_id"]
          },
        ]
      }
      trading_rules: {
        Row: {
          created_at: string | null
          rule_id: string
          rule_type: string
          rule_value: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          rule_id?: string
          rule_type: string
          rule_value: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          rule_id?: string
          rule_type?: string
          rule_value?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_trading_rules_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_email_logs: {
        Row: {
          created_at: string
          email_sent_at: string
          email_status: string
          email_type: string
          id: string
          trial_end_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent_at?: string
          email_status?: string
          email_type: string
          id?: string
          trial_end_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent_at?: string
          email_status?: string
          email_type?: string
          id?: string
          trial_end_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_push_tokens: {
        Row: {
          created_at: string
          id: string
          subscription_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          settings_data: Json
          settings_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings_data?: Json
          settings_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          settings_data?: Json
          settings_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_settings_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions_new: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          end_date: string | null
          next_billing_date: string | null
          payment_method: string | null
          plan_id: string
          start_date: string | null
          status: string
          subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          end_date?: string | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id: string
          start_date?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          end_date?: string | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id?: string
          start_date?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_new_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "user_subscriptions_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_trade_notes_for_date: {
        Args: { target_user_id: string; target_date: string }
        Returns: undefined
      }
      assign_user_plan: {
        Args: {
          target_user_id: string
          plan_name_param: string
          billing_cycle_param?: string
        }
        Returns: Json
      }
      check_admin_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_subscription_limit: {
        Args: { user_id_param: string; feature_name_param: string }
        Returns: number
      }
      check_username_availability: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      get_admin_payments: {
        Args: Record<PropertyKey, never>
        Returns: {
          payment_id: string
          user_id: string
          username: string
          email: string
          amount: number
          currency: string
          payment_status: string
          payment_method: string
          subscription_plan: string
          billing_cycle: string
          payment_date: string
          order_number: string
          invoice_id: string
          transaction_id: string
          admin_notes: string
          created_at: string
        }[]
      }
      get_current_user_internal_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_payment_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_revenue: number
          total_payments_count: number
          avg_payment_value: number
        }[]
      }
      get_segment_user_ids: {
        Args: { segment_type: string }
        Returns: string[]
      }
      get_user_access_matrix: {
        Args: { auth_user_id: string }
        Returns: Json
      }
      get_user_id_from_auth: {
        Args: { auth_user_id: string }
        Returns: string
      }
      get_user_segments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_username_by_user_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      has_role: {
        Args: { check_user_id: string; check_role: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_profile_owner: {
        Args: { profile_auth_id: string }
        Returns: boolean
      }
      is_same_user: {
        Args: { user_auth_id: string }
        Returns: boolean
      }
      is_shared_trade_owner: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      update_journal_images_notes_for_date: {
        Args: { target_user_id: string; target_date: string }
        Returns: undefined
      }
      update_payment_admin_notes: {
        Args: { payment_id_param: string; notes_param: string }
        Returns: boolean
      }
      update_payment_status: {
        Args: { payment_id_param: string; status_param: string }
        Returns: boolean
      }
      user_owns_record: {
        Args: { record_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
      app_role: ["admin", "manager", "user"],
    },
  },
} as const
