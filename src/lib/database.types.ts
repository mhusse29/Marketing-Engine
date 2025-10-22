export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert_history: {
        Row: {
          alert_rule_id: string | null
          alert_type: string
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_rule_id?: string | null
          alert_type: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
          user_id: string
        }
        Update: {
          alert_rule_id?: string | null
          alert_type?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
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
      api_usage: {
        Row: {
          cost: number | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          image_dimensions: string | null
          images_count: number | null
          input_tokens: number | null
          latency_ms: number | null
          model: string | null
          output_tokens: number | null
          provider: string
          request_data: Json | null
          response_data: Json | null
          service_type: string
          status: string
          total_tokens: number | null
          user_id: string
          video_duration_seconds: number | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          image_dimensions?: string | null
          images_count?: number | null
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          provider: string
          request_data?: Json | null
          response_data?: Json | null
          service_type: string
          status: string
          total_tokens?: number | null
          user_id: string
          video_duration_seconds?: number | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          image_dimensions?: string | null
          images_count?: number | null
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string
          request_data?: Json | null
          response_data?: Json | null
          service_type?: string
          status?: string
          total_tokens?: number | null
          user_id?: string
          video_duration_seconds?: number | null
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
      campaign_outcomes: {
        Row: {
          campaign_id: string
          content_id: string
          conversion_value: number | null
          created_at: string | null
          id: string
          outcome_data: Json | null
          outcome_type: string
          revenue_generated: number | null
        }
        Insert: {
          campaign_id: string
          content_id: string
          conversion_value?: number | null
          created_at?: string | null
          id?: string
          outcome_data?: Json | null
          outcome_type: string
          revenue_generated?: number | null
        }
        Update: {
          campaign_id?: string
          content_id?: string
          conversion_value?: number | null
          created_at?: string | null
          id?: string
          outcome_data?: Json | null
          outcome_type?: string
          revenue_generated?: number | null
        }
        Relationships: []
      }
      quality_metrics: {
        Row: {
          api_usage_id: string
          created_at: string | null
          edit_percentage: number | null
          id: string
          quality_score: number | null
          regeneration_count: number | null
          user_feedback: string | null
          user_rating: number | null
          was_edited: boolean | null
          was_used: boolean | null
        }
        Insert: {
          api_usage_id: string
          created_at?: string | null
          edit_percentage?: number | null
          id?: string
          quality_score?: number | null
          regeneration_count?: number | null
          user_feedback?: string | null
          user_rating?: number | null
          was_edited?: boolean | null
          was_used?: boolean | null
        }
        Update: {
          api_usage_id?: string
          created_at?: string | null
          edit_percentage?: number | null
          id?: string
          quality_score?: number | null
          regeneration_count?: number | null
          user_feedback?: string | null
          user_rating?: number | null
          was_edited?: boolean | null
          was_used?: boolean | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          id: string
          monthly_price: number
          plan_name: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          id?: string
          monthly_price: number
          plan_name: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          id?: string
          monthly_price?: number
          plan_name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      mv_daily_metrics: {
        Row: {
          avg_cost: number | null
          avg_latency_ms: number | null
          date: string | null
          failed_requests: number | null
          success_rate: number | null
          successful_requests: number | null
          total_cost: number | null
          total_images: number | null
          total_requests: number | null
          total_tokens: number | null
          total_video_seconds: number | null
        }
        Relationships: []
      }
      mv_model_usage: {
        Row: {
          avg_cost_per_call: number | null
          avg_latency_ms: number | null
          failed_calls: number | null
          images_generated: number | null
          input_tokens: number | null
          last_used: string | null
          model: string | null
          output_tokens: number | null
          provider: string | null
          service_type: string | null
          success_rate: number | null
          successful_calls: number | null
          total_calls: number | null
          total_cost: number | null
          total_tokens: number | null
          video_seconds: number | null
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
      find_cacheable_prompts: {
        Args: {
          p_days_back?: number
          p_min_frequency?: number
          p_service_type: string
          p_user_id: string
        }
        Returns: {
          occurrence_count: number
          potential_savings: number
          prompt_pattern: string
          sample_prompt: string
          total_cost: number
        }[]
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
        }[]
      }
      refresh_analytics_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Enums: {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    CompositeTypes: {}
  }
}

type DefaultSchema = Database['public']

export type Tables<TableName extends keyof DefaultSchema['Tables'] | keyof DefaultSchema['Views']> =
  TableName extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][TableName]['Row']
    : TableName extends keyof DefaultSchema['Views']
    ? DefaultSchema['Views'][TableName]['Row']
    : never

export type TablesInsert<TableName extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][TableName]['Insert']

export type TablesUpdate<TableName extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][TableName]['Update']
