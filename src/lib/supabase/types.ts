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
      deals: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string
          link: string | null
          location: string | null
          category: string
          promo_code: string | null
          hot_count: number
          cold_count: number
          submitted_by_user_id: string
          posted_by: string | null
          status: string
          is_archived: boolean
          requires_review: boolean
          approved_by: string | null
          approved_at: string | null
          deleted_by: string | null
          deleted_at: string | null
          deletion_reason: string | null
          created_at: string
          updated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url: string
          link?: string | null
          location?: string | null
          category: string
          promo_code?: string | null
          hot_count?: number
          cold_count?: number
          submitted_by_user_id: string
          posted_by?: string | null
          status?: string
          is_archived?: boolean
          requires_review?: boolean
          approved_by?: string | null
          approved_at?: string | null
          deleted_by?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          created_at?: string
          updated_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string
          link?: string | null
          location?: string | null
          category?: string
          promo_code?: string | null
          hot_count?: number
          cold_count?: number
          submitted_by_user_id?: string
          posted_by?: string | null
          status?: string
          is_archived?: boolean
          requires_review?: boolean
          approved_by?: string | null
          approved_at?: string | null
          deleted_by?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          role: string
          auto_approve: boolean
          device_id: string | null
          email_verified: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username?: string | null
          role?: string
          auto_approve?: boolean
          device_id?: string | null
          email_verified?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          role?: string
          auto_approve?: boolean
          device_id?: string | null
          email_verified?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          deal_id: string
          device_id: string
          reason: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          device_id: string
          reason: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          device_id?: string
          reason?: string
          note?: string | null
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          deal_id: string
          device_id: string
          vote_type: string
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          device_id: string
          vote_type: string
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          device_id?: string
          vote_type?: string
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
