import { db, errorMessage } from './api';
import type { Json, Service, Queue, Appointment } from './types';
export type LiveQueue=Queue&{barber_id:string|null;preferred_barber_id:string|null;assigned_barber_id:string|null;created_at:string;arrived_at:string|null};
export type LiveAppointment=Appointment&{barber_id:string|null};
export type StaffAlert={id:string;salon_id:string;salon_name:string;barber_id:string|null;entity_kind:'queue'|'appointment';entity_id:string;title:string;body:string;created_at:string;read_at:string|null};
export type TeamMember = {
  id: string;
  salon_id: string;
  display_name: string;
  bio: string | null;
  photo_url: string | null;
  experience_years: number | null;
  specialities: string[];
  is_active: boolean;
  archived_at?: string | null;
  availability: string;
  service_ids: string[];
};
export type ManagedSalon = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photo_url: string | null;
  is_open: boolean;
  archived_at?: string | null;
  waiting: number;
  pending: number;
  incoming?:number;
  in_service?:number;
  queues?:LiveQueue[];
  appointments?:LiveAppointment[];
  barbers: TeamMember[];
  services: Service[];
  hours: {
    weekday: number;
    opens_at: string;
    closes_at: string;
  }[];
};
export type Management = {
  alerts?:StaffAlert[];
  unread?:number;
  observed_at?:string;
  today?:string;
  profile: {
    display_name: string;
    avatar_path: string | null;
  };
  salons: ManagedSalon[];
};
export async function management(): Promise<Management> { const r = await db().rpc('manager_state'); if (r.error)
  throw Object.assign(new Error(errorMessage(r.error)),{code:r.error.code}); return r.data as unknown as Management; }
export async function manage(action: string, data: Json) { const r = await db().rpc('manager_command', { p_action: action, p_data: data }); if (r.error)
  throw Object.assign(new Error(errorMessage(r.error)),{code:r.error.code}); return r.data as {
  id: string;
}; }
export async function visit(salon:string,action:string,id:string){const r=await db().rpc('manager_visit_command',{p_salon:salon,p_action:action,p_id:id});if(r.error)throw Object.assign(new Error(errorMessage(r.error)),{code:r.error.code});}
export async function readAlert(id:string|null){const r=await db().rpc('staff_alert_read',{p_id:id});if(r.error)throw Object.assign(new Error(errorMessage(r.error)),{code:r.error.code});}
