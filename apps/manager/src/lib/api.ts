import { createAuthActions } from '@core/auth-actions';
import { getSupabaseClient } from './client';
import type { Context, State, Json } from './types';
import type { Slot } from '@customer/lib/customer-types';
export const auth = createAuthActions({ getClient: getSupabaseClient });
export function db() {
  const { client } = getSupabaseClient();
  if (!client)
    throw new Error('Database connection is not configured.');
  return client;
}
export function errorMessage(error: {
  code?: string;
  message?: string;
}) {
  const financeErrors = ['Choose a salon', 'Check expense details', 'This request has already been used', 'Expense unavailable', 'This expense changed. Refresh before saving', 'Explain the correction to this paid expense', 'Enter a valid expense amount', 'Choose a valid expense date', 'Enter an expense description', 'Choose an expense category', 'Choose a payment date up to today', 'Choose a date range up to 366 days', 'Check report filters', 'Choose a barber from this salon'];
  if (financeErrors.includes(error.message ?? '')) return error.message!;
  const invitationErrors = ['Invitation unavailable or expired', 'This account already belongs to this salon', 'This barber already has an account', 'Activate this barber before inviting', 'Check invitation details', 'Barber unavailable'];
  if (invitationErrors.includes(error.message ?? '')) return error.message!;
  if (error.code === '42501')
    return 'Your access is unavailable. Refresh or sign in again.';
  if (error.code === '23P01')
    return 'This time overlaps an appointment or break. Choose another time.';
  if (error.code === '23505')
    return 'Already recorded. Refresh to see the saved record.';
  const allowed = ['Active customer code not found', 'Enter a valid final price', 'Enter a salon name', 'Photo unavailable', 'Handle active queue visits and appointments before removing this record', 'This record has history. Archive it instead of deleting it', 'Restore this salon before making changes', 'Restore this barber before making changes', 'Restore this service before making changes', 'Restore or assign a service before restoring this barber', 'Enter a salon address', 'A service with this name already exists in this salon', 'Check weekly opening hours', 'Finish active queue visits before changing opening hours', 'Opening hours must include existing appointments', 'Handle active visits before changing service duration', 'Enter your name', 'Enter a salon and service name', 'Check salon information', 'Check barber profile', 'Choose at least one service', 'Choose services from this salon', 'Finish or reassign active visits before deactivating this barber', 'Keep services needed by active visits', 'Enter a service name', 'This account already owns a salon', 'Enter a salon and barber name', 'Choose working days', 'Closing time must be after opening time', 'Check service duration and price range', 'Choose a valid availability', 'Finish your current service first', 'Choose a break between 1 and 240 minutes', 'Service unavailable', 'Queue entry cannot be checked in', 'Appointment is not confirmed', 'Request cannot be accepted', 'Request cannot be declined', 'Request cannot be changed', 'Proposed time is unavailable', 'Customer must be arrived and assigned to you', 'This customer is not next for your chair', 'Choose a service you offer', 'Set yourself available first', 'Confirm the customer agreed to the price', 'Explain a price outside the estimated range', 'Confirm the disclosed commission with the customer', 'Service is not in progress', 'Confirm the customer agreed to the final amount', 'Check extra service items', 'Extras exceed the final amount'];
  return allowed.includes(error.message ?? '') ? error.message! : 'Could not save. Check the entered values and retry.';
}
export async function contexts(): Promise<Context[]> {
  const r = await db().rpc('barber_context');
  if (r.error)
    throw new Error(errorMessage(r.error));
  return r.data as unknown as Context[];
}
export async function state(barber: string): Promise<State> {
  const r = await db().rpc('barber_state', { p_barber: barber });
  if (r.error)
    throw new Error(errorMessage(r.error));
  return r.data as unknown as State;
}
export async function command(barber: string, action: string, data: Json) {
  const r = await db().rpc('barber_command', { p_barber: barber, p_action: action, p_data: data });
  if (r.error)
    throw new Error(errorMessage(r.error));
  return r.data as {
    id: string;
  };
}
export async function setup(data: Json) {
  const r = await db().rpc('setup_salon', { p_data: data });
  if (r.error)
    throw new Error(errorMessage(r.error));
  return r.data as {
    barber_id: string;
  };
}
export async function appointmentSlots(salon: string, service: string | null, day: string, barber: string): Promise<Slot[]> {
  const { data, error } = await db().rpc('customer_slots', { p_salon: salon, p_service: service, p_day: day, p_barber: barber });
  if (error) throw new Error('Could not load available times. Try again.');
  return data;
}
