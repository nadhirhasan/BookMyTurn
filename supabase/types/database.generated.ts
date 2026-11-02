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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointment_proposals: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          appointment_id: string
          barber_id: string
          ends_at: string
          id: string
          salon_id: string
          starts_at: string
          suggested_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          appointment_id: string
          barber_id: string
          ends_at: string
          id?: string
          salon_id: string
          starts_at: string
          suggested_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          appointment_id?: string
          barber_id?: string
          ends_at?: string
          id?: string
          salon_id?: string
          starts_at?: string
          suggested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_proposals_salon_id_appointment_id_fkey"
            columns: ["salon_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "appointment_proposals_salon_id_barber_id_fkey"
            columns: ["salon_id", "barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      appointments: {
        Row: {
          accepted_proposal_id: string | null
          arrived_at: string | null
          completed_at: string | null
          confirmed_barber_id: string | null
          confirmed_end: string | null
          confirmed_start: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          id: string
          mobile: string | null
          preferred_barber_id: string | null
          reference: string
          request_key: string
          requested_duration_minutes: number
          requested_start: string
          salon_id: string
          service_id: string | null
          status: string
          visit_code: string
        }
        Insert: {
          accepted_proposal_id?: string | null
          arrived_at?: string | null
          completed_at?: string | null
          confirmed_barber_id?: string | null
          confirmed_end?: string | null
          confirmed_start?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          mobile?: string | null
          preferred_barber_id?: string | null
          reference?: string
          request_key?: string
          requested_duration_minutes: number
          requested_start: string
          salon_id: string
          service_id?: string | null
          status?: string
          visit_code: string
        }
        Update: {
          accepted_proposal_id?: string | null
          arrived_at?: string | null
          completed_at?: string | null
          confirmed_barber_id?: string | null
          confirmed_end?: string | null
          confirmed_start?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          mobile?: string | null
          preferred_barber_id?: string | null
          reference?: string
          request_key?: string
          requested_duration_minutes?: number
          requested_start?: string
          salon_id?: string
          service_id?: string | null
          status?: string
          visit_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_salon_id_confirmed_barber_id_fkey"
            columns: ["salon_id", "confirmed_barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_salon_id_id_accepted_proposal_id_fkey"
            columns: ["salon_id", "id", "accepted_proposal_id"]
            isOneToOne: false
            referencedRelation: "appointment_proposals"
            referencedColumns: ["salon_id", "appointment_id", "id"]
          },
          {
            foreignKeyName: "appointments_salon_id_preferred_barber_id_fkey"
            columns: ["salon_id", "preferred_barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "appointments_salon_id_service_id_fkey"
            columns: ["salon_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      barber_hours: {
        Row: {
          barber_id: string
          ends_at: string
          salon_id: string
          starts_at: string
          weekday: number
        }
        Insert: {
          barber_id: string
          ends_at: string
          salon_id: string
          starts_at: string
          weekday: number
        }
        Update: {
          barber_id?: string
          ends_at?: string
          salon_id?: string
          starts_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "barber_hours_salon_id_barber_id_fkey"
            columns: ["salon_id", "barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      barber_services: {
        Row: {
          barber_id: string
          duration_minutes: number | null
          price_max_minor: number | null
          price_min_minor: number | null
          salon_id: string
          service_id: string
        }
        Insert: {
          barber_id: string
          duration_minutes?: number | null
          price_max_minor?: number | null
          price_min_minor?: number | null
          salon_id: string
          service_id: string
        }
        Update: {
          barber_id?: string
          duration_minutes?: number | null
          price_max_minor?: number | null
          price_min_minor?: number | null
          salon_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_services_salon_id_barber_id_fkey"
            columns: ["salon_id", "barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "barber_services_salon_id_service_id_fkey"
            columns: ["salon_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      barber_status: {
        Row: {
          availability: string
          barber_id: string
          observed_at: string
          salon_id: string
        }
        Insert: {
          availability?: string
          barber_id: string
          observed_at?: string
          salon_id: string
        }
        Update: {
          availability?: string
          barber_id?: string
          observed_at?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_status_salon_id_barber_id_fkey"
            columns: ["salon_id", "barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      barbers: {
        Row: {
          archived_at: string | null
          bio: string | null
          created_at: string
          display_name: string
          experience_years: number | null
          id: string
          is_active: boolean
          is_published: boolean
          photo_attribution: string | null
          photo_url: string | null
          salon_id: string
          specialities: string[]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          experience_years?: number | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          photo_attribution?: string | null
          photo_url?: string | null
          salon_id: string
          specialities?: string[]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          experience_years?: number | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          photo_attribution?: string | null
          photo_url?: string | null
          salon_id?: string
          specialities?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_haircuts: {
        Row: {
          collection_id: string
          created_at: string
          customer_id: string
          deleted_at: string | null
          hairstyle_id: string | null
          id: string
          storage_path: string | null
          title: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          hairstyle_id?: string | null
          id?: string
          storage_path?: string | null
          title?: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          hairstyle_id?: string | null
          id?: string
          storage_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_haircuts_customer_id_collection_id_fkey"
            columns: ["customer_id", "collection_id"]
            isOneToOne: false
            referencedRelation: "haircut_collections"
            referencedColumns: ["customer_id", "id"]
          },
          {
            foreignKeyName: "customer_haircuts_hairstyle_id_fkey"
            columns: ["hairstyle_id"]
            isOneToOne: false
            referencedRelation: "hairstyles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      haircut_collections: {
        Row: {
          created_at: string
          customer_id: string
          deleted_at: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      hairstyle_categories: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      hairstyles: {
        Row: {
          attribution: string
          category_id: string
          id: string
          image_url: string
          is_published: boolean
          title: string
        }
        Insert: {
          attribution: string
          category_id: string
          id?: string
          image_url: string
          is_published?: boolean
          title: string
        }
        Update: {
          attribution?: string
          category_id?: string
          id?: string
          image_url?: string
          is_published?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hairstyles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "hairstyle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          event_key: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          event_key: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          event_key?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      published_reviews: {
        Row: {
          barber_id: string
          body: string | null
          created_at: string
          id: string
          rating: number
          salon_id: string
        }
        Insert: {
          barber_id: string
          body?: string | null
          created_at: string
          id: string
          rating: number
          salon_id: string
        }
        Update: {
          barber_id?: string
          body?: string | null
          created_at?: string
          id?: string
          rating?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_reviews_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_reviews_salon_id_barber_id_fkey"
            columns: ["salon_id", "barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      queue_entries: {
        Row: {
          arrival_sequence: number | null
          arrived_at: string | null
          assigned_barber_id: string | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          id: string
          mobile: string | null
          note: string | null
          preference_change_reason: string | null
          preferred_barber_id: string | null
          reference: string
          request_key: string
          salon_id: string
          service_id: string | null
          source: string
          started_at: string | null
          status: string
          visit_code: string
        }
        Insert: {
          arrival_sequence?: number | null
          arrived_at?: string | null
          assigned_barber_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          mobile?: string | null
          note?: string | null
          preference_change_reason?: string | null
          preferred_barber_id?: string | null
          reference?: string
          request_key?: string
          salon_id: string
          service_id?: string | null
          source: string
          started_at?: string | null
          status?: string
          visit_code: string
        }
        Update: {
          arrival_sequence?: number | null
          arrived_at?: string | null
          assigned_barber_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          mobile?: string | null
          note?: string | null
          preference_change_reason?: string | null
          preferred_barber_id?: string | null
          reference?: string
          request_key?: string
          salon_id?: string
          service_id?: string | null
          source?: string
          started_at?: string | null
          status?: string
          visit_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_salon_id_assigned_barber_id_fkey"
            columns: ["salon_id", "assigned_barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "queue_entries_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_salon_id_preferred_barber_id_fkey"
            columns: ["salon_id", "preferred_barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "queue_entries_salon_id_service_id_fkey"
            columns: ["salon_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_by: string | null
          resolved_at: string | null
          review_id: string
          salon_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_by?: string | null
          resolved_at?: string | null
          review_id: string
          salon_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_by?: string | null
          resolved_at?: string | null
          review_id?: string
          salon_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_salon_id_review_id_fkey"
            columns: ["salon_id", "review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      reviews: {
        Row: {
          barber_id: string
          body: string | null
          created_at: string
          customer_id: string | null
          id: string
          publication_status: string
          publish_consent: boolean
          rating: number
          salon_id: string
          service_session_id: string
        }
        Insert: {
          barber_id: string
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          publication_status?: string
          publish_consent: boolean
          rating: number
          salon_id: string
          service_session_id: string
        }
        Update: {
          barber_id?: string
          body?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          publication_status?: string
          publish_consent?: boolean
          rating?: number
          salon_id?: string
          service_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_salon_id_barber_id_fkey"
            columns: ["salon_id", "barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "reviews_salon_id_service_session_id_fkey"
            columns: ["salon_id", "service_session_id"]
            isOneToOne: false
            referencedRelation: "service_sessions"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      salon_date_exceptions: {
        Row: {
          closes_at: string | null
          id: string
          is_closed: boolean
          local_date: string
          opens_at: string | null
          salon_id: string
        }
        Insert: {
          closes_at?: string | null
          id?: string
          is_closed: boolean
          local_date: string
          opens_at?: string | null
          salon_id: string
        }
        Update: {
          closes_at?: string | null
          id?: string
          is_closed?: boolean
          local_date?: string
          opens_at?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_date_exceptions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_hours: {
        Row: {
          closes_at: string
          opens_at: string
          salon_id: string
          weekday: number
        }
        Insert: {
          closes_at: string
          opens_at: string
          salon_id: string
          weekday: number
        }
        Update: {
          closes_at?: string
          opens_at?: string
          salon_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "salon_hours_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          address: string | null
          archived_at: string | null
          country_code: string
          created_at: string
          currency: string
          id: string
          is_demo: boolean
          is_open: boolean
          is_published: boolean
          locality: string
          name: string
          photo_attribution: string | null
          photo_url: string | null
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          country_code?: string
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          is_open?: boolean
          is_published?: boolean
          locality?: string
          name: string
          photo_attribution?: string | null
          photo_url?: string | null
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          country_code?: string
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          is_open?: boolean
          is_published?: boolean
          locality?: string
          name?: string
          photo_attribution?: string | null
          photo_url?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_items: {
        Row: {
          amount_minor: number
          description: string
          id: string
          kind: string
          salon_id: string
          service_session_id: string
        }
        Insert: {
          amount_minor: number
          description: string
          id?: string
          kind: string
          salon_id: string
          service_session_id: string
        }
        Update: {
          amount_minor?: number
          description?: string
          id?: string
          kind?: string
          salon_id?: string
          service_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_items_salon_id_service_session_id_fkey"
            columns: ["salon_id", "service_session_id"]
            isOneToOne: false
            referencedRelation: "service_sessions"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      service_sessions: {
        Row: {
          agreed_price_minor: number | null
          appointment_id: string | null
          barber_id: string
          commission_agreed_at: string | null
          commission_disclosure_snapshot: string | null
          commission_platform_minor: number
          commission_rule_id: string | null
          commission_salon_minor: number
          commission_surcharge_minor: number
          completed_at: string | null
          customer_id: string | null
          duration_minutes_snapshot: number
          final_amount_agreed_at: string | null
          final_amount_minor: number | null
          final_price_reason: string | null
          id: string
          payment_method: string | null
          price_agreed_at: string | null
          price_exception_reason: string | null
          price_max_minor_snapshot: number | null
          price_min_minor_snapshot: number | null
          pricing_mode: string
          queue_entry_id: string | null
          salon_id: string
          service_id: string | null
          service_name_snapshot: string
          source: string
          started_at: string
          status: string
        }
        Insert: {
          agreed_price_minor?: number | null
          appointment_id?: string | null
          barber_id: string
          commission_agreed_at?: string | null
          commission_disclosure_snapshot?: string | null
          commission_platform_minor?: number
          commission_rule_id?: string | null
          commission_salon_minor?: number
          commission_surcharge_minor?: number
          completed_at?: string | null
          customer_id?: string | null
          duration_minutes_snapshot: number
          final_amount_agreed_at?: string | null
          final_amount_minor?: number | null
          final_price_reason?: string | null
          id?: string
          payment_method?: string | null
          price_agreed_at?: string | null
          price_exception_reason?: string | null
          price_max_minor_snapshot?: number | null
          price_min_minor_snapshot?: number | null
          pricing_mode?: string
          queue_entry_id?: string | null
          salon_id: string
          service_id?: string | null
          service_name_snapshot: string
          source: string
          started_at?: string
          status?: string
        }
        Update: {
          agreed_price_minor?: number | null
          appointment_id?: string | null
          barber_id?: string
          commission_agreed_at?: string | null
          commission_disclosure_snapshot?: string | null
          commission_platform_minor?: number
          commission_rule_id?: string | null
          commission_salon_minor?: number
          commission_surcharge_minor?: number
          completed_at?: string | null
          customer_id?: string | null
          duration_minutes_snapshot?: number
          final_amount_agreed_at?: string | null
          final_amount_minor?: number | null
          final_price_reason?: string | null
          id?: string
          payment_method?: string | null
          price_agreed_at?: string | null
          price_exception_reason?: string | null
          price_max_minor_snapshot?: number | null
          price_min_minor_snapshot?: number | null
          pricing_mode?: string
          queue_entry_id?: string | null
          salon_id?: string
          service_id?: string | null
          service_name_snapshot?: string
          source?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_sessions_salon_id_appointment_id_fkey"
            columns: ["salon_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "service_sessions_salon_id_barber_id_fkey"
            columns: ["salon_id", "barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "service_sessions_salon_id_queue_entry_id_fkey"
            columns: ["salon_id", "queue_entry_id"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "service_sessions_salon_id_service_id_fkey"
            columns: ["salon_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      services: {
        Row: {
          archived_at: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price_max_minor: number
          price_min_minor: number
          salon_id: string
        }
        Insert: {
          archived_at?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean
          name: string
          price_max_minor: number
          price_min_minor: number
          salon_id: string
        }
        Update: {
          archived_at?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price_max_minor?: number
          price_min_minor?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      style_request_items: {
        Row: {
          hairstyle_id: string
          salon_id: string
          style_request_id: string
        }
        Insert: {
          hairstyle_id: string
          salon_id: string
          style_request_id: string
        }
        Update: {
          hairstyle_id?: string
          salon_id?: string
          style_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_request_items_hairstyle_id_fkey"
            columns: ["hairstyle_id"]
            isOneToOne: false
            referencedRelation: "hairstyles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "style_request_items_salon_id_style_request_id_fkey"
            columns: ["salon_id", "style_request_id"]
            isOneToOne: false
            referencedRelation: "style_requests"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      style_requests: {
        Row: {
          appointment_id: string | null
          customer_id: string | null
          id: string
          note: string | null
          queue_entry_id: string | null
          revision: number
          salon_id: string
          submitted_at: string
          viewed_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          customer_id?: string | null
          id?: string
          note?: string | null
          queue_entry_id?: string | null
          revision?: number
          salon_id: string
          submitted_at?: string
          viewed_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          customer_id?: string | null
          id?: string
          note?: string | null
          queue_entry_id?: string | null
          revision?: number
          salon_id?: string
          submitted_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "style_requests_salon_id_appointment_id_fkey"
            columns: ["salon_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["salon_id", "id"]
          },
          {
            foreignKeyName: "style_requests_salon_id_queue_entry_id_fkey"
            columns: ["salon_id", "queue_entry_id"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
    }
    Views: {
      barber_review_stats: {
        Row: {
          average_rating: number | null
          barber_id: string | null
          review_count: number | null
          salon_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "published_reviews_salon_id_barber_id_fkey"
            columns: ["salon_id", "barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["salon_id", "id"]
          },
        ]
      }
      salon_review_stats: {
        Row: {
          average_rating: number | null
          review_count: number | null
          salon_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      owner_finance: {
        Args: { p_action: string; p_data?: Json }
        Returns: Json
      }
      barber_command: {
        Args: { p_action: string; p_barber: string; p_data: Json }
        Returns: Json
      }
      barber_context: { Args: never; Returns: Json }
      barber_invitation: {
        Args: { p_action: string; p_data: Json }
        Returns: Json
      }
      barber_state: { Args: { p_barber: string }; Returns: Json }
      barber_team: { Args: { p_salon: string }; Returns: Json }
      customer_catalog: { Args: never; Returns: Json }
      customer_collections: {
        Args: { p_action: string; p_data?: Json }
        Returns: Json
      }
      customer_command: {
        Args: { p_action: string; p_data: Json }
        Returns: Json
      }
      customer_gallery: {
        Args: { p_action: string; p_data?: Json }
        Returns: Json
      }
      customer_quote: {
        Args: { p_barber?: string; p_salon: string; p_service?: string }
        Returns: Json
      }
      customer_slots: {
        Args: {
          p_barber?: string
          p_day: string
          p_salon: string
          p_service: string
        }
        Returns: {
          available: boolean
          barber_id: string
          ends_at: string
          starts_at: string
        }[]
      }
      customer_state: { Args: never; Returns: Json }
      manager_command: {
        Args: { p_action: string; p_data: Json }
        Returns: Json
      }
      manager_state: { Args: never; Returns: Json }
      manager_visit_command: {
        Args: { p_action: string; p_id: string; p_salon: string }
        Returns: Json
      }
      qr_visit: {
        Args: {
          p_action: string
          p_data?: Json
          p_slug: string
          p_token: string
        }
        Returns: Json
      }
      setup_salon: { Args: { p_data: Json }; Returns: Json }
      staff_alert_read: { Args: { p_id?: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
