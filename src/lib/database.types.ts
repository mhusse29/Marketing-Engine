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
      user_card_snapshots: {
        Row: {
          id: string
          user_id: string
          card_type: string
          scope: string
          position: number
          snapshot: Json
          created_at: string
          updated_at: string
          drag_offset_x: number
          drag_offset_y: number
          is_pinned: boolean
          display_order: number
        }
        Insert: {
          id?: string
          user_id: string
          card_type: string
          scope: string
          position?: number
          snapshot: Json
          created_at?: string
          updated_at?: string
          drag_offset_x?: number
          drag_offset_y?: number
          is_pinned?: boolean
          display_order?: number
        }
        Update: {
          id?: string
          user_id?: string
          card_type?: string
          scope?: string
          position?: number
          snapshot?: Json
          created_at?: string
          updated_at?: string
          drag_offset_x?: number
          drag_offset_y?: number
          is_pinned?: boolean
          display_order?: number
        }
        Relationships: []
      }
      user_card_progress: {
        Row: {
          user_id: string
          card_type: string
          run_id: string | null
          phase: string
          message: string | null
          meta: Json | null
          updated_at: string
        }
        Insert: {
          user_id: string
          card_type: string
          run_id?: string | null
          phase: string
          message?: string | null
          meta?: Json | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          card_type?: string
          run_id?: string | null
          phase?: string
          message?: string | null
          meta?: Json | null
          updated_at?: string
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
      persist_card_snapshots: {
        Args: { _payload: Json }
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
