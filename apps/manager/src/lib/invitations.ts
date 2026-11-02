import { getRandomValues, randomUUID } from 'expo-crypto';
import { createURL } from 'expo-linking';
import { db, errorMessage } from './api';
import type { Json } from './types';

export type TeamAccess = { barber_id: string; connected: boolean; account_email: string | null; invitation: null | { id: string; expires_at: string; status: 'pending' | 'accepted' | 'expired' | 'cancelled' } };
export type Invitation = { id: string; salon_id: string; barber_id: string; salon_name: string; barber_name: string; accepted: boolean; expires_at: string };
export function newInvitation() {
  return { id: randomUUID(), token: Array.from(getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('') };
}
export function invitationLink(token: string) { return createURL('/invite', { queryParams: { token } }); }
export function invitationToken(value: string) {
  const raw = value.trim();
  if (/^[a-f0-9]{64}$/.test(raw)) return raw;
  try { const token = new URL(raw).searchParams.get('token') ?? ''; return /^[a-f0-9]{64}$/.test(token) ? token : ''; } catch { return ''; }
}
export async function teamAccess(salon: string) {
  const { data, error } = await db().rpc('barber_team', { p_salon: salon });
  if (error) throw new Error(errorMessage(error));
  return (data as unknown as { members: TeamAccess[] }).members;
}
export async function invitationAction<T = { id: string; expires_at?: string }>(action: string, details: Json): Promise<T> {
  const { data, error } = await db().rpc('barber_invitation', { p_action: action, p_data: details });
  if (error) throw new Error(errorMessage(error));
  return data as unknown as T;
}
