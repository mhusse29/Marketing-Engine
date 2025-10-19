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
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          blocked_reason: string | null
          blocked_until: string | null
          created_at: string | null
          current_requests: number | null
          id: string
          is_blocked: boolean | null
          max_requests: number
          service_type: string
          updated_at: string | null
          user_id: string
          window_end: string
          window_start: string | null
          window_type: string
        }
        Insert: {
          blocked_reason?: string | null
          blocked_until?: string | null
          created_at?: string | null
          current_requests?: number | null
          id?: string
          is_blocked?: boolean | null
          max_requests: number
          service_type: string
          updated_at?: string | null
          user_id: string
          window_end: string
          window_start?: string | null
          window_type: string
        }
        Update: {
          blocked_reason?: string | null
          blocked_until?: string | null
          created_at?: string | null
          current_requests?: number | null
          id?: string
          is_blocked?: boolean | null
          max_requests?: number
          service_type?: string
          updated_at?: string | null
          user_id?: string
          window_end?: string
          window_start?: string | null
          window_type?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          generation_cost: number | null
          id: string
          images_generated: number | null
          input_cost: number | null
          input_tokens: number | null
          ip_address: unknown | null
          latency_ms: number | null
          model: string
          output_cost: number | null
          output_tokens: number | null
          provider: string
          request_data: Json | null
          request_id: string | null
          response_data: Json | null
          service_type: string
          status: string
          total_cost: number
          total_tokens: number | null
          user_agent: string | null
          user_id: string
          video_seconds: number | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          generation_cost?: number | null
          id?: string
          images_generated?: number | null
          input_cost?: number | null
          input_tokens?: number | null
          ip_address?: unknown | null
          latency_ms?: number | null
          model: string
          output_cost?: number | null
          output_tokens?: number | null
          provider: string
          request_data?: Json | null
          request_id?: string | null
          response_data?: Json | null
          service_type: string
          status: string
          total_cost: number
          total_tokens?: number | null
          user_agent?: string | null
          user_id: string
          video_seconds?: number | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          generation_cost?: number | null
          id?: string
          images_generated?: number | null
          input_cost?: number | null
          input_tokens?: number | null
          ip_address?: unknown | null
          latency_ms?: number | null
          model?: string
          output_cost?: number | null
          output_tokens?: number | null
          provider?: string
          request_data?: Json | null
          request_id?: string | null
          response_data?: Json | null
          service_type?: string
          status?: string
          total_cost?: number
          total_tokens?: number | null
          user_agent?: string | null
          user_id?: string
          video_seconds?: number | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          settings: Json | null
          status: string | null
          tags: string[] | null
          total_cost: number | null
          total_generations: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          status?: string | null
          tags?: string[] | null
          total_cost?: number | null
          total_generations?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          status?: string | null
          tags?: string[] | null
          total_cost?: number | null
          total_generations?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_aggregations: {
        Row: {
          avg_latency_ms: number | null
          chat_cost: number | null
          chat_messages: number | null
          content_cost: number | null
          content_generations: number | null
          created_at: string | null
          failed_requests: number | null
          id: string
          image_cost: number | null
          images_generated: number | null
          p95_latency_ms: number | null
          period_end: string
          period_start: string
          period_type: string
          successful_requests: number | null
          tools_cost: number | null
          total_cost: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_requests: number | null
          user_id: string
          video_cost: number | null
          video_seconds: number | null
        }
        Insert: {
          avg_latency_ms?: number | null
          chat_cost?: number | null
          chat_messages?: number | null
          content_cost?: number | null
          content_generations?: number | null
          created_at?: string | null
          failed_requests?: number | null
          id?: string
          image_cost?: number | null
          images_generated?: number | null
          p95_latency_ms?: number | null
          period_end: string
          period_start: string
          period_type: string
          successful_requests?: number | null
          tools_cost?: number | null
          total_cost?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
          total_requests?: number | null
          user_id: string
          video_cost?: number | null
          video_seconds?: number | null
        }
        Update: {
          avg_latency_ms?: number | null
          chat_cost?: number | null
          chat_messages?: number | null
          content_cost?: number | null
          content_generations?: number | null
          created_at?: string | null
          failed_requests?: number | null
          id?: string
          image_cost?: number | null
          images_generated?: number | null
          p95_latency_ms?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          successful_requests?: number | null
          tools_cost?: number | null
          total_cost?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
          total_requests?: number | null
          user_id?: string
          video_cost?: number | null
          video_seconds?: number | null
        }
        Relationships: []
      }
      usage_alerts: {
        Row: {
          alert_threshold: number
          alert_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notification_sent: boolean | null
          service_type: string | null
          threshold_type: string
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold: number
          alert_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_sent?: boolean | null
          service_type?: string | null
          threshold_type: string
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold?: number
          alert_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_sent?: boolean | null
          service_type?: string | null
          threshold_type?: string
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_period_end: string | null
          billing_period_start: string | null
          chat_messages_limit: number | null
          chat_messages_used: number | null
          content_generations_limit: number | null
          content_generations_used: number | null
          created_at: string | null
          current_month_cost: number | null
          id: string
          image_generations_limit: number | null
          image_generations_used: number | null
          is_active: boolean | null
          last_reset_at: string | null
          lifetime_cost: number | null
          monthly_cost_limit: number | null
          plan_name: string
          plan_type: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          usage_alerts_enabled: boolean | null
          user_id: string
          video_generations_limit: number | null
          video_generations_used: number | null
        }
        Insert: {
          auto_renew?: boolean | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          chat_messages_limit?: number | null
          chat_messages_used?: number | null
          content_generations_limit?: number | null
          content_generations_used?: number | null
          created_at?: string | null
          current_month_cost?: number | null
          id?: string
          image_generations_limit?: number | null
          image_generations_used?: number | null
          is_active?: boolean | null
          last_reset_at?: string | null
          lifetime_cost?: number | null
          monthly_cost_limit?: number | null
          plan_name?: string
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          usage_alerts_enabled?: boolean | null
          user_id: string
          video_generations_limit?: number | null
          video_generations_used?: number | null
        }
        Update: {
          auto_renew?: boolean | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          chat_messages_limit?: number | null
          chat_messages_used?: number | null
          content_generations_limit?: number | null
          content_generations_used?: number | null
          created_at?: string | null
          current_month_cost?: number | null
          id?: string
          image_generations_limit?: number | null
          image_generations_used?: number | null
          is_active?: boolean | null
          last_reset_at?: string | null
          lifetime_cost?: number | null
          monthly_cost_limit?: number | null
          plan_name?: string
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          usage_alerts_enabled?: boolean | null
          user_id?: string
          video_generations_limit?: number | null
          video_generations_used?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      mv_daily_metrics: {
        Row: {
          avg_latency_ms: number | null
          daily_active_users: number | null
          date: string | null
          failed_requests: number | null
          p95_latency_ms: number | null
          success_rate_pct: number | null
          successful_requests: number | null
          total_cost: number | null
          total_images: number | null
          total_requests: number | null
          total_tokens: number | null
          total_video_seconds: number | null
        }
        Relationships: []
      }
      mv_provider_performance: {
        Row: {
          avg_cost_per_request: number | null
          avg_success_latency_ms: number | null
          p95_success_latency_ms: number | null
          provider: string | null
          service_type: string | null
          success_rate_pct: number | null
          successful_requests: number | null
          total_cost: number | null
          total_requests: number | null
        }
        Relationships: []
      }
      mv_user_segments: {
        Row: {
          churn_risk_segment: string | null
          features_used: number | null
          last_active: string | null
          plan_type: string | null
          total_calls: number | null
          total_spent: number | null
          usage_segment: string | null
          user_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_daily_executive_dashboard: {
        Row: {
          active_users_today: number | null
          active_users_yesterday: number | null
          avg_latency_ms: number | null
          dau_change_pct: number | null
          revenue_today: number | null
          success_rate: number | null
          total_requests_today: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_usage_limit: {
        Args: { p_service_type: string; p_user_id: string }
        Returns: boolean
      }
      get_churn_risk_users: {
        Args: { min_score?: number }
        Returns: {
          churn_score: number
          days_inactive: number
          last_active: string
          plan_type: string
          total_spent: number
          user_id: string
          risk_category: string
        }[]
      }
      get_health_score: {
        Args: { interval_duration?: string }
        Returns: {
          avg_latency_ms: number
          failed_requests: number
          health_score: number
          p95_latency_ms: number
          successful_requests: number
          total_requests: number
          uptime_pct: number
        }[]
      }
      increment_subscription_usage: {
        Args: { p_cost: number; p_service_type: string; p_user_id: string }
        Returns: undefined
      }
      refresh_analytics_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_monthly_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
