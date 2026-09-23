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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_secrets: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          company_address: string | null
          company_name: string | null
          company_vat: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          entity_type: string
          event_end_time: string | null
          event_start_time: string | null
          guest_count: number | null
          id: string
          includes_piknik: boolean
          includes_zar: boolean
          km_distance: number | null
          location: string | null
          meat_preferences: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string
          price_total: number | null
          rules_accepted_at: string | null
          status: string
          stripe_session_id: string | null
          upsell_selections: Json | null
        }
        Insert: {
          booking_date: string
          company_address?: string | null
          company_name?: string | null
          company_vat?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          entity_type: string
          event_end_time?: string | null
          event_start_time?: string | null
          guest_count?: number | null
          id?: string
          includes_piknik?: boolean
          includes_zar?: boolean
          km_distance?: number | null
          location?: string | null
          meat_preferences?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          price_total?: number | null
          rules_accepted_at?: string | null
          status?: string
          stripe_session_id?: string | null
          upsell_selections?: Json | null
        }
        Update: {
          booking_date?: string
          company_address?: string | null
          company_name?: string | null
          company_vat?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          entity_type?: string
          event_end_time?: string | null
          event_start_time?: string | null
          guest_count?: number | null
          id?: string
          includes_piknik?: boolean
          includes_zar?: boolean
          km_distance?: number | null
          location?: string | null
          meat_preferences?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          price_total?: number | null
          rules_accepted_at?: string | null
          status?: string
          stripe_session_id?: string | null
          upsell_selections?: Json | null
        }
        Relationships: []
      }
      km_pricing: {
        Row: {
          distance_km: number
          id: string
          location: string
          sort_order: number
        }
        Insert: {
          distance_km: number
          id?: string
          location: string
          sort_order?: number
        }
        Update: {
          distance_km?: number
          id?: string
          location?: string
          sort_order?: number
        }
        Relationships: []
      }
      meal_addon_pricing: {
        Row: {
          id: string
          key: string
          label: string
          unit_price: number
        }
        Insert: {
          id?: string
          key: string
          label: string
          unit_price: number
        }
        Update: {
          id?: string
          key?: string
          label?: string
          unit_price?: number
        }
        Relationships: []
      }
      piknik_pricing: {
        Row: {
          day_type: string
          id: string
          label: string
          price: number
        }
        Insert: {
          day_type: string
          id?: string
          label: string
          price: number
        }
        Update: {
          day_type?: string
          id?: string
          label?: string
          price?: number
        }
        Relationships: []
      }
      space_rules: {
        Row: {
          active: boolean
          id: string
          sort_order: number
          text: string
        }
        Insert: {
          active?: boolean
          id?: string
          sort_order?: number
          text: string
        }
        Update: {
          active?: boolean
          id?: string
          sort_order?: number
          text?: string
        }
        Relationships: []
      }
      upsell_offers: {
        Row: {
          active: boolean
          description: string | null
          id: string
          key: string
          price_note: string | null
          title: string
          unit: string | null
          unit_price: number | null
        }
        Insert: {
          active?: boolean
          description?: string | null
          id?: string
          key: string
          price_note?: string | null
          title: string
          unit?: string | null
          unit_price?: number | null
        }
        Update: {
          active?: boolean
          description?: string | null
          id?: string
          key?: string
          price_note?: string | null
          title?: string
          unit?: string | null
          unit_price?: number | null
        }
        Relationships: []
      }
      zar_pricing_tiers: {
        Row: {
          id: string
          label: string
          max_guests: number | null
          min_guests: number
          price: number
          sort_order: number
        }
        Insert: {
          id?: string
          label: string
          max_guests?: number | null
          min_guests: number
          price: number
          sort_order?: number
        }
        Update: {
          id?: string
          label?: string
          max_guests?: number | null
          min_guests?: number
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      piknik_availability: {
        Row: {
          booking_date: string | null
        }
        Insert: {
          booking_date?: string | null
        }
        Update: {
          booking_date?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_booking: {
        Args: {
          p_booking_date: string
          p_company_address: string | null
          p_company_name: string | null
          p_company_vat: string | null
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string | null
          p_entity_type: string
          p_event_end_time?: string | null
          p_event_start_time?: string | null
          p_guest_count: number | null
          p_includes_piknik: boolean
          p_includes_zar: boolean
          p_km_distance: number | null
          p_location: string | null
          p_meat_preferences: Json
          p_notes: string | null
          p_price_total: number
          p_upsell_selections: Json
        }
        Returns: {
          booking_date: string
          company_address: string | null
          company_name: string | null
          company_vat: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          entity_type: string
          event_end_time: string | null
          event_start_time: string | null
          guest_count: number | null
          id: string
          includes_piknik: boolean
          includes_zar: boolean
          km_distance: number | null
          location: string | null
          meat_preferences: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string
          price_total: number | null
          rules_accepted_at: string | null
          status: string
          stripe_session_id: string | null
          upsell_selections: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_booking_paid: {
        Args: { p_secret: string; p_session_id: string }
        Returns: {
          booking_date: string
          company_address: string | null
          company_name: string | null
          company_vat: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          entity_type: string
          event_end_time: string | null
          event_start_time: string | null
          guest_count: number | null
          id: string
          includes_piknik: boolean
          includes_zar: boolean
          km_distance: number | null
          location: string | null
          meat_preferences: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string
          price_total: number | null
          rules_accepted_at: string | null
          status: string
          stripe_session_id: string | null
          upsell_selections: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_booking_stripe_session: {
        Args: { p_booking_id: string; p_session_id: string }
        Returns: undefined
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
