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
      categories: {
        Row: {
          id: string
          name: string
          count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          count?: number
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          content: string
          likes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          content: string
          likes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          content?: string
          likes?: number
          created_at?: string
          updated_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          summary: string
          description: string | null
          category_id: string | null
          fund_total: number
          fund_goal: number
          supporters: number
          start_date: string
          end_date: string | null
          location: string | null
          creator_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          summary: string
          description?: string | null
          category_id?: string | null
          fund_total?: number
          fund_goal: number
          supporters?: number
          start_date?: string
          end_date?: string | null
          location?: string | null
          creator_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          summary?: string
          description?: string | null
          category_id?: string | null
          fund_total?: number
          fund_goal?: number
          supporters?: number
          start_date?: string
          end_date?: string | null
          location?: string | null
          creator_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_images: {
        Row: {
          id: string
          project_id: string
          image_url: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          image_url: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          image_url?: string
          display_order?: number
          created_at?: string
        }
      }
      project_likes: {
        Row: {
          id: string
          project_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          created_at?: string
        }
      }
      project_milestones: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          target_date: string | null
          completed: boolean
          budget: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          budget?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          budget?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      project_updates: {
        Row: {
          id: string
          project_id: string
          title: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string
          time_commitment: string | null
          location: string | null
          filled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description: string
          time_commitment?: string | null
          location?: string | null
          filled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string
          time_commitment?: string | null
          location?: string | null
          filled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      role_applications: {
        Row: {
          id: string
          role_id: string
          user_id: string
          status: string
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          role_id: string
          user_id: string
          status?: string
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          user_id?: string
          status?: string
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      role_skills: {
        Row: {
          id: string
          role_id: string
          skill_id: string
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          skill_id: string
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          skill_id?: string
          created_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          avatar: string | null
          bio: string | null
          location: string | null
          join_date: string
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          avatar?: string | null
          bio?: string | null
          location?: string | null
          join_date?: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar?: string | null
          bio?: string | null
          location?: string | null
          join_date?: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_skills: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_id?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
