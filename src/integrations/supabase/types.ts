export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      arrest_reports: {
        Row: {
          arrest_date: string
          charges: string[]
          citizen_id: string
          created_at: string
          id: string
          location: string
          narrative: string
          officer_id: string
        }
        Insert: {
          arrest_date: string
          charges: string[]
          citizen_id: string
          created_at?: string
          id?: string
          location: string
          narrative: string
          officer_id: string
        }
        Update: {
          arrest_date?: string
          charges?: string[]
          citizen_id?: string
          created_at?: string
          id?: string
          location?: string
          narrative?: string
          officer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arrest_reports_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
        ]
      }
      citations: {
        Row: {
          citizen_id: string
          created_at: string
          date: string
          fine_amount: number
          id: string
          location: string | null
          officer_id: string
          paid: boolean | null
          violation: string
        }
        Insert: {
          citizen_id: string
          created_at?: string
          date: string
          fine_amount: number
          id?: string
          location?: string | null
          officer_id: string
          paid?: boolean | null
          violation: string
        }
        Update: {
          citizen_id?: string
          created_at?: string
          date?: string
          fine_amount?: number
          id?: string
          location?: string | null
          officer_id?: string
          paid?: boolean | null
          violation?: string
        }
        Relationships: [
          {
            foreignKeyName: "citations_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
        ]
      }
      citizens: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          date_of_birth: string
          first_name: string
          gender: string
          id: string
          image_url: string | null
          last_name: string
          license_status: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          date_of_birth: string
          first_name: string
          gender: string
          id?: string
          image_url?: string | null
          last_name: string
          license_status?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string
          first_name?: string
          gender?: string
          id?: string
          image_url?: string | null
          last_name?: string
          license_status?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      criminal_records: {
        Row: {
          citizen_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          offense: string
          officer_id: string
          status: string | null
        }
        Insert: {
          citizen_id: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          offense: string
          officer_id: string
          status?: string | null
        }
        Update: {
          citizen_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          offense?: string
          officer_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "criminal_records_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          badge_number: string | null
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          badge_number?: string | null
          created_at?: string
          id: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          badge_number?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          citizen_id: string
          color: string
          created_at: string
          created_by: string
          id: string
          model: string
          plate: string
          registered: boolean | null
          stolen: boolean | null
        }
        Insert: {
          citizen_id: string
          color: string
          created_at?: string
          created_by: string
          id?: string
          model: string
          plate: string
          registered?: boolean | null
          stolen?: boolean | null
        }
        Update: {
          citizen_id?: string
          color?: string
          created_at?: string
          created_by?: string
          id?: string
          model?: string
          plate?: string
          registered?: boolean | null
          stolen?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
        ]
      }
      warrants: {
        Row: {
          citizen_id: string
          created_at: string
          expiry_date: string
          id: string
          issue_date: string
          issuing_officer_id: string
          reason: string
          status: string | null
        }
        Insert: {
          citizen_id: string
          created_at?: string
          expiry_date: string
          id?: string
          issue_date: string
          issuing_officer_id: string
          reason: string
          status?: string | null
        }
        Update: {
          citizen_id?: string
          created_at?: string
          expiry_date?: string
          id?: string
          issue_date?: string
          issuing_officer_id?: string
          reason?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warrants_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
