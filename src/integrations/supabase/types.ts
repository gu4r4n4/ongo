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
      insurance_inquiries: {
        Row: {
          area_m2: number | null
          broker_notes: string | null
          building_construction: string | null
          cargo_delivery_country: string | null
          cargo_format: string | null
          cargo_pickup_country: string | null
          cargo_type: string | null
          cattle_type: string | null
          country_code: string | null
          crop_area_ha: number | null
          crop_risks: string | null
          crop_type: string | null
          email: string | null
          equipment_type: string | null
          form_data: string | null
          full_name: string
          id: number
          insurance_from: string | null
          insurance_to: string | null
          insured_age: string | null
          insured_count: number | null
          invoice_number: string | null
          invoiced_at: string | null
          leisure_activities: boolean | null
          license_plate: string | null
          phone: string | null
          price: number | null
          product_type: string
          property_address: string | null
          property_type: string | null
          quoted_at: string | null
          quoted_price: number | null
          received_at: string | null
          source: string | null
          sports: boolean | null
          status: string | null
          travel_zone: string | null
          trip_type: string | null
          units: number | null
          year: number | null
        }
        Insert: {
          area_m2?: number | null
          broker_notes?: string | null
          building_construction?: string | null
          cargo_delivery_country?: string | null
          cargo_format?: string | null
          cargo_pickup_country?: string | null
          cargo_type?: string | null
          cattle_type?: string | null
          country_code?: string | null
          crop_area_ha?: number | null
          crop_risks?: string | null
          crop_type?: string | null
          email?: string | null
          equipment_type?: string | null
          form_data?: string | null
          full_name: string
          id?: number
          insurance_from?: string | null
          insurance_to?: string | null
          insured_age?: string | null
          insured_count?: number | null
          invoice_number?: string | null
          invoiced_at?: string | null
          leisure_activities?: boolean | null
          license_plate?: string | null
          phone?: string | null
          price?: number | null
          product_type: string
          property_address?: string | null
          property_type?: string | null
          quoted_at?: string | null
          quoted_price?: number | null
          received_at?: string | null
          source?: string | null
          sports?: boolean | null
          status?: string | null
          travel_zone?: string | null
          trip_type?: string | null
          units?: number | null
          year?: number | null
        }
        Update: {
          area_m2?: number | null
          broker_notes?: string | null
          building_construction?: string | null
          cargo_delivery_country?: string | null
          cargo_format?: string | null
          cargo_pickup_country?: string | null
          cargo_type?: string | null
          cattle_type?: string | null
          country_code?: string | null
          crop_area_ha?: number | null
          crop_risks?: string | null
          crop_type?: string | null
          email?: string | null
          equipment_type?: string | null
          form_data?: string | null
          full_name?: string
          id?: number
          insurance_from?: string | null
          insurance_to?: string | null
          insured_age?: string | null
          insured_count?: number | null
          invoice_number?: string | null
          invoiced_at?: string | null
          leisure_activities?: boolean | null
          license_plate?: string | null
          phone?: string | null
          price?: number | null
          product_type?: string
          property_address?: string | null
          property_type?: string | null
          quoted_at?: string | null
          quoted_price?: number | null
          received_at?: string | null
          source?: string | null
          sports?: boolean | null
          status?: string | null
          travel_zone?: string | null
          trip_type?: string | null
          units?: number | null
          year?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          id: number
          inquiry_id: number | null
          invoice_number: string | null
          notes: string | null
          paid_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: number
          inquiry_id?: number | null
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: number
          inquiry_id?: number | null
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "insurance_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          category_name: string | null
          city: string | null
          id: number
          phone: string | null
          title: string
          website: string | null
        }
        Insert: {
          category_name?: string | null
          city?: string | null
          id?: number
          phone?: string | null
          title: string
          website?: string | null
        }
        Update: {
          category_name?: string | null
          city?: string | null
          id?: number
          phone?: string | null
          title?: string
          website?: string | null
        }
        Relationships: []
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
