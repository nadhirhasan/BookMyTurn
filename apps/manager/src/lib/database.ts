import type { Json } from '@core/database.types';
export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      barber_team: { Args: { p_salon: string }; Returns: Json };
      barber_invitation: { Args: { p_action: string; p_data: Json }; Returns: Json };
      manager_visit_command:{Args:{p_salon:string;p_action:string;p_id:string};Returns:Json};
      staff_alert_read:{Args:{p_id?:string|null};Returns:undefined};
      manager_state: {
        Args: Record<string, never>;
        Returns: Json;
      };
      manager_command: {
        Args: {
          p_action: string;
          p_data: Json;
        };
        Returns: Json;
      };
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
