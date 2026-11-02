import { randomUUID } from 'expo-crypto';
import { db, errorMessage } from './api';
import type { Json } from './types';

export type FinanceFilters = { salon_id: string | null; from: string; to: string };
export type FinancePeriod = { revenue_minor: number; completed_count: number; operating_minor: number; commission_minor: number; profit_minor: number };
export type FinanceSummary = FinancePeriod & { capital_minor: number; expected_minor: number; adjustments_minor: number; commission_paid_minor: number; commission_outstanding_minor: number };
export type FinanceBarber = { id: string; display_name: string; salon_id: string; salon_name: string; archived_at: string | null; completed_count: number; revenue_minor: number; average_minutes: number | null; rating: number | null; review_count: number };
export type FinanceReport = { observed_at: string; today: string; from: string; to: string; summary: FinanceSummary; salons: { id: string; name: string; archived: boolean }[]; categories: { code: string; name: string }[]; daily: (FinancePeriod & { day: string })[]; monthly: (FinancePeriod & { month: string })[]; barbers: FinanceBarber[] };
export type SaleEvent = { id: string; event_kind: 'sale' | 'adjustment'; salon_id: string; salon_name: string; barber_id: string; barber_name: string; service_session_id: string; source: string; recorded_at: string; amount_minor: number; payment_method: string | null; reason: string | null; duration_minutes: number | null };
export type Expense = { id: string; salon_id: string; salon_name: string; category_code: string; category_name: string; due_on: string; paid_on: string | null; kind: 'operating' | 'capital'; description: string; amount_minor: number; status: 'paid' | 'expected' | 'cancelled'; payment_method: string | null; note: string | null; version: number; ever_paid: boolean; last_change_reason: string | null };
export type FinancePage<T> = { rows: T[]; total: number; next_offset: number | null; observed_at: string };
export async function finance<T>(action: string, data: Json = {}): Promise<T> {
  const result = await db().rpc('owner_finance', { p_action: action, p_data: data });
  if (result.error) throw Object.assign(new Error(errorMessage(result.error)), { code: result.error.code });
  return result.data as unknown as T;
}
export function retryKey(previous: { body: string; id: string } | null, body: unknown) {
  const signature = JSON.stringify(body);
  return previous?.body === signature ? previous : { body: signature, id: randomUUID() };
}
export function colomboDay() { return new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10); }
export function periodRange(period: 'today' | 'week' | 'month', today = colomboDay()) {
  const date = new Date(`${today}T12:00:00Z`);
  if (period === 'today') return { from: today, to: today };
  if (period === 'week') { const monday = new Date(date); monday.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7); const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6); return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) }; }
  return { from: `${today.slice(0, 7)}-01`, to: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).toISOString().slice(0, 10) };
}
export function validRange(from: string, to: string) {
  const first = Date.parse(`${from}T00:00:00Z`), last = Date.parse(`${to}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && Number.isFinite(first) && Number.isFinite(last) && first <= last && (last - first) / 86400000 <= 365;
}
