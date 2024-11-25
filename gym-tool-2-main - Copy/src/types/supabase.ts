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
      users: {
        Row: {
          id: string
          email: string
          name: string
          password: string | null
          phone_number: string | null
          is_verified: boolean
          subscription_status: 'pending' | 'active' | 'expired' | 'rejected'
          subscription_start_date: string | null
          subscription_end_date: string | null
          plan_type: 'monthly' | 'yearly' | 'lifetime'
          receipt_image: string | null
          submission_date: string
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          password?: string | null
          phone_number?: string | null
          is_verified?: boolean
          subscription_status?: 'pending' | 'active' | 'expired' | 'rejected'
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          plan_type?: 'monthly' | 'yearly' | 'lifetime'
          receipt_image?: string | null
          submission_date?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          password?: string | null
          phone_number?: string | null
          is_verified?: boolean
          subscription_status?: 'pending' | 'active' | 'expired' | 'rejected'
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          plan_type?: 'monthly' | 'yearly' | 'lifetime'
          receipt_image?: string | null
          submission_date?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      renewal_requests: {
        Row: {
          id: string
          user_id: string
          user_name: string
          user_email: string
          plan_type: 'monthly' | 'yearly' | 'lifetime'
          receipt_image: string
          submission_date: string
          processed_date: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_name: string
          user_email: string
          plan_type: 'monthly' | 'yearly' | 'lifetime'
          receipt_image: string
          submission_date?: string
          processed_date?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_name?: string
          user_email?: string
          plan_type?: 'monthly' | 'yearly' | 'lifetime'
          receipt_image?: string
          submission_date?: string
          processed_date?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_requests_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
