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
        Insert: { id: string; display_name?: string | null; created_at?: string; updated_at?: string };
        Update: { display_name?: string | null };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
