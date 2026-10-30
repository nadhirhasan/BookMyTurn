// Schema contract for 20261029000100_customer_profiles.sql.
// Keep the contract aligned with the migration; these are not generated remotely.
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
