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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: number
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: number
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: number
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
          created_by_user_id: number | null
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
          org_id: number | null
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
          created_by_user_id?: number | null
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
          org_id?: number | null
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
          created_by_user_id?: number | null
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
          org_id?: number | null
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
        Relationships: [
          {
            foreignKeyName: "insurance_inquiries_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_inquiries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          created_by_user_id: number | null
          id: number
          inquiry_id: number | null
          invoice_number: string | null
          notes: string | null
          org_id: number | null
          paid_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by_user_id?: number | null
          id?: number
          inquiry_id?: number | null
          invoice_number?: string | null
          notes?: string | null
          org_id?: number | null
          paid_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by_user_id?: number | null
          id?: number
          inquiry_id?: number | null
          invoice_number?: string | null
          notes?: string | null
          org_id?: number | null
          paid_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "insurance_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      offer_feature_values: {
        Row: {
          confidence: number | null
          created_at: string
          feature_key: string
          id: number
          offer_id: number
          provenance: Json | null
          updated_at: string
          value_num: number | null
          value_text: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          feature_key: string
          id?: number
          offer_id: number
          provenance?: Json | null
          updated_at?: string
          value_num?: number | null
          value_text?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          feature_key?: string
          id?: number
          offer_id?: number
          provenance?: Json | null
          updated_at?: string
          value_num?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_feature_values_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_templates: {
        Row: {
          created_at: string
          created_by_user_id: number | null
          defaults: Json
          employees_bucket: number | null
          id: number
          insurer: string | null
          label: string | null
          org_id: number | null
          program_code: string | null
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by_user_id?: number | null
          defaults?: Json
          employees_bucket?: number | null
          id?: number
          insurer?: string | null
          label?: string | null
          org_id?: number | null
          program_code?: string | null
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by_user_id?: number | null
          defaults?: Json
          employees_bucket?: number | null
          id?: number
          insurer?: string | null
          label?: string | null
          org_id?: number | null
          program_code?: string | null
          usage_count?: number
        }
        Relationships: []
      }
      offers: {
        Row: {
          base_sum_eur: number | null
          company_hint: string | null
          company_name: string | null
          created_at: string | null
          created_by_user_id: number | null
          employee_count: number | null
          error: string | null
          features: Json
          filename: string | null
          id: number
          inquiry_id: number | null
          insurer: string | null
          org_id: number | null
          payment_method: string | null
          premium_eur: number | null
          program_code: string | null
          raw_json: Json | null
          source: string | null
          status: string | null
        }
        Insert: {
          base_sum_eur?: number | null
          company_hint?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by_user_id?: number | null
          employee_count?: number | null
          error?: string | null
          features?: Json
          filename?: string | null
          id?: number
          inquiry_id?: number | null
          insurer?: string | null
          org_id?: number | null
          payment_method?: string | null
          premium_eur?: number | null
          program_code?: string | null
          raw_json?: Json | null
          source?: string | null
          status?: string | null
        }
        Update: {
          base_sum_eur?: number | null
          company_hint?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by_user_id?: number | null
          employee_count?: number | null
          error?: string | null
          features?: Json
          filename?: string | null
          id?: number
          inquiry_id?: number | null
          insurer?: string | null
          org_id?: number | null
          payment_method?: string | null
          premium_eur?: number | null
          program_code?: string | null
          raw_json?: Json | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_inquiry_fk"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "insurance_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          domain: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      share_links: {
        Row: {
          created_at: string
          created_by_user_id: number | null
          expires_at: string | null
          id: number
          inquiry_id: number | null
          org_id: number | null
          payload: Json
          token: string
          view_prefs: Json | null
        }
        Insert: {
          created_at?: string
          created_by_user_id?: number | null
          expires_at?: string | null
          id?: number
          inquiry_id?: number | null
          org_id?: number | null
          payload?: Json
          token: string
          view_prefs?: Json | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: number | null
          expires_at?: string | null
          id?: number
          inquiry_id?: number | null
          org_id?: number | null
          payload?: Json
          token?: string
          view_prefs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "share_links_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "insurance_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_org_memberships: {
        Row: {
          created_at: string | null
          id: number
          org_id: number
          org_role: string
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          org_id: number
          org_role?: string
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          org_id?: number
          org_role?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_share_links: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_feature_values_for_shared_inquiry: {
        Args: { share_token: string }
        Returns: {
          feature_key: string
          offer_id: number
          value_num: number
          value_text: string
        }[]
      }
      get_offers_for_shared_inquiry: {
        Args: { share_token: string }
        Returns: {
          base_sum_eur: number
          company_name: string
          created_at: string
          employee_count: number
          features: Json
          filename: string
          id: number
          inquiry_id: number
          insurer: string
          payment_method: string
          premium_eur: number
          program_code: string
        }[]
      }
      get_share_by_token: {
        Args: { share_token: string }
        Returns: {
          created_at: string
          expires_at: string
          inquiry_id: number
          payload: Json
        }[]
      }
      upsert_offer_with_features: {
        Args: { p: Json }
        Returns: number
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

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
