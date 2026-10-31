// Schema contract for 20261030015043_customer_profiles.sql.
// Row/Insert fields verified against hosted generated types on 30 October 2026.
// Update intentionally follows column grants: only display_name is client-editable.
export type CustomerProfile = {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};
export type Database = {
  public: {
    Tables: {
      customer_profiles: {
        Row: CustomerProfile;
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
        };
        Relationships: [
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      customer_gallery: { Args: {p_action:string;p_data?:Json};Returns:Json; };
      customer_catalog: {
        Args: Record<string, never>;
        Returns: Json;
      };
      customer_state: {
        Args: Record<string, never>;
        Returns: Json;
      };
      customer_quote: {
        Args: {
          p_salon: string;
          p_service?: string | null;
          p_barber?: string | null;
        };
        Returns: Json;
      };
      qr_visit: {
        Args: {
          p_action: string;
          p_slug: string;
          p_token: string;
          p_data?: Json;
        };
        Returns: Json;
      };
      customer_slots: {
        Args: {
          p_salon: string;
          p_service: string | null;
          p_day: string;
          p_barber?: string | null;
        };
        Returns: {
          starts_at: string;
          ends_at: string;
          barber_id: string;
          available: boolean;
        }[];
      };
      customer_command: {
        Args: {
          p_action: string;
          p_data: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
export type Json = string | number | boolean | null | Json[] | {
  [key: string]: Json | undefined;
};
