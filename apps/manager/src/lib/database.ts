import type { Json } from '@core/database.types';
export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      barber_context: {
        Args: Record<string, never>;
        Returns: Json;
      };
      barber_state: {
        Args: {
          p_barber: string;
        };
        Returns: Json;
      };
      barber_command: {
        Args: {
          p_barber: string;
          p_action: string;
          p_data: Json;
        };
        Returns: Json;
      };
      setup_salon: {
        Args: {
          p_data: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
