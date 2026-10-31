import { getSupabaseClient } from './supabase/client';
import { randomUUID } from 'expo-crypto';
import type { Catalog, Slot, VisitState } from './customer-types';
export function customerError(error: {
  code?: string;
  message?: string;
}) {
  if (error.code === '23P01')
    return 'This time is no longer available. Choose another time.';
  if (error.code === '23505')
    return 'This was already submitted. Refresh your visits to see it.';
  if (error.code === '42501' || error.code === 'PGRST301')
    return 'Sign in to manage your own visits.';
  const allowed = ['Salon unavailable', 'Salon is closed', 'Service unavailable', 'Barber does not offer this service', 'No queue capacity today', 'No later alternative on this day', 'Demo controls disabled', 'Check in before completing a demo haircut', 'An earlier customer is waiting for this barber', 'No suitable barber', 'Service already started', 'Appointment cannot be cancelled', 'Request cannot be accepted', 'Request cannot be changed', 'Alternative unavailable', 'A completed haircut is required', 'Choose one to eight reference styles', 'Active visit not found'];
  return allowed.includes(error.message ?? '') ? error.message! : 'Could not update your visit. Refresh and try again.';
}
function client() {
  const { client } = getSupabaseClient();
  if (!client)
    throw new Error('The database connection is not configured.');
  return client;
}
export async function fetchCatalog(): Promise<Catalog> {
  const { data, error } = await client().rpc('customer_catalog');
  if (error || !data)
    throw new Error('Could not load salons. Check your connection and retry.');
  return data as unknown as Catalog;
}
export async function fetchVisits(): Promise<VisitState> {
  const { data, error } = await client().rpc('customer_state');
  if (error || !data)
    throw new Error('Could not load your visits. Check your connection and retry.');
  return data as unknown as VisitState;
}
export async function fetchSlots(salon: string, service: string | null, day: string, barber: string | null): Promise<Slot[]> {
  const { data, error } = await client().rpc('customer_slots', { p_salon: salon, p_service: service, p_day: day, p_barber: barber });
  if (error)
    throw new Error('Could not load available times. Please retry.');
  return data as Slot[];
}
export async function command(action: string, data: Record<string, string | boolean | string[] | number | null>) {
  const result = await client().rpc('customer_command', { p_action: action, p_data: data });
  if (result.error)
    throw new Error(customerError(result.error));
  return result.data as {
    id: string;
    existing?: boolean;
  };
}
export const requestKey = randomUUID;
