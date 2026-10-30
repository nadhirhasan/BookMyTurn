import { db, errorMessage } from './api';
import type { Json, Service } from './types';
export type TeamMember = {
  id: string;
  salon_id: string;
  display_name: string;
  bio: string | null;
  photo_url: string | null;
  experience_years: number | null;
  specialities: string[];
  is_active: boolean;
  availability: string;
  service_ids: string[];
};
export type ManagedSalon = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  photo_url: string | null;
  is_open: boolean;
  waiting: number;
  pending: number;
  barbers: TeamMember[];
  services: Service[];
  hours: {
    weekday: number;
    opens_at: string;
    closes_at: string;
  }[];
};
export type Management = {
  profile: {
    display_name: string;
    avatar_path: string | null;
  };
  salons: ManagedSalon[];
};
export async function management(): Promise<Management> { const r = await db().rpc('manager_state'); if (r.error)
  throw new Error(errorMessage(r.error)); return r.data as unknown as Management; }
export async function manage(action: string, data: Json) { const r = await db().rpc('manager_command', { p_action: action, p_data: data }); if (r.error)
  throw new Error(errorMessage(r.error)); return r.data as {
  id: string;
}; }
