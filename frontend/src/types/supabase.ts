export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      saved_pages: {
        Row: {
          id: string
          user_id: string
          form_data: Json
          previews: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          form_data: Json
          previews: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          form_data?: Json
          previews?: Json
          created_at?: string
        }
      }
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
  }
}