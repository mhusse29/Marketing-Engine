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
      user_generations: {
        Row: {
          id: string
          user_id: string
          card_type: string
          generation_id: string
          generation_batch_id: string | null
          snapshot: Json
          thumbnail_url: string | null
          aspect_ratio: number | null
          position: number | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          card_type: string
          generation_id: string
          generation_batch_id?: string | null
          snapshot: Json
          thumbnail_url?: string | null
          aspect_ratio?: number | null
          position?: number | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          card_type?: string
          generation_id?: string
          generation_batch_id?: string | null
          snapshot?: Json
          thumbnail_url?: string | null
          aspect_ratio?: number | null
          position?: number | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
        Relationships: any[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_card_generation: {
        Args: { _generation_id: string }
        Returns: undefined
      }
      update_card_position: {
        Args: { _generation_id: string; _drag_x: number; _drag_y: number; _display_order: number }
        Returns: undefined
      }
      toggle_card_pin: {
        Args: { _generation_id: string }
        Returns: boolean
      }
      hide_card_generation: {
        Args: { _generation_id: string }
        Returns: undefined
      }
      restore_card_generation: {
        Args: { _generation_id: string }
        Returns: undefined
      }
      [key: string]: {
        Args: Record<string, any>
        Returns: any
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
