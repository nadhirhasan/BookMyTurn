import { expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { fixture, seed } from './management-fixture';
import type { Expense, SaleEvent } from '../src/lib/finance';

export const today = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const day = (value: string) => new Date(new Date(value).getTime() + 330 * 60000).toISOString().slice(0, 10);
export async function financeFixture(page: Page) {
  const f = await fixture(page), salon = seed(), second = seed(), barber = randomUUID(), secondBarber = randomUUID(); second.name = 'Second Studio';
  salon.barbers.push({ id: barber, salon_id: salon.id, display_name: 'Amir', bio: '', photo_url: null, experience_years: 4, specialities: [], is_active: true, availability: 'available', service_ids: [] });
  second.barbers.push({ id: secondBarber, salon_id: second.id, display_name: 'Hassan', bio: '', photo_url: null, experience_years: 2, specialities: [], is_active: true, availability: 'available', service_ids: [] }); f.data.salons.push(salon, second);
  const sales: SaleEvent[] = [{ id: randomUUID(), event_kind: 'sale', salon_id: salon.id, salon_name: salon.name, barber_id: barber, barber_name: 'Amir', service_session_id: randomUUID(), source: 'remote', recorded_at: `${today()}T06:30:00Z`, amount_minor: 130000, payment_method: null, reason: null, duration_minutes: 40 }, { id: randomUUID(), event_kind: 'sale', salon_id: second.id, salon_name: second.name, barber_id: secondBarber, barber_name: 'Hassan', service_session_id: randomUUID(), source: 'walk_in', recorded_at: `${today()}T07:30:00Z`, amount_minor: 70000, payment_method: null, reason: null, duration_minutes: 30 }];
  const expenses: Expense[] = [], writes: { action: string; data: Record<string, unknown> }[] = [], requests = new Map<string, { id: string; version: number }>();
  let loseResponse = false;
  const matches = (s: { salon_id: string }, p: Record<string, unknown>) => !p.salon_id || s.salon_id === p.salon_id;
  await page.route('**/rest/v1/rpc/owner_finance', r => {
    const { p_action: action, p_data: p } = r.request().postDataJSON();
    const selectedSales = sales.filter(s => matches(s, p) && day(s.recorded_at) >= p.from && day(s.recorded_at) <= p.to);
    const selectedExpenses = expenses.filter(e => matches(e, p) && (e.status === 'paid' ? e.paid_on! : e.due_on) >= p.from && (e.status === 'paid' ? e.paid_on! : e.due_on) <= p.to);
    if (action === 'report') {
      const revenue = selectedSales.reduce((n, s) => n + s.amount_minor, 0), operating = selectedExpenses.filter(e => e.status === 'paid' && e.kind === 'operating').reduce((n, e) => n + e.amount_minor, 0);
      const summary = { revenue_minor: revenue, completed_count: selectedSales.filter(s => s.event_kind === 'sale').length, adjustments_minor: 0, operating_minor: operating, capital_minor: selectedExpenses.filter(e => e.status === 'paid' && e.kind === 'capital').reduce((n, e) => n + e.amount_minor, 0), expected_minor: selectedExpenses.filter(e => e.status === 'expected').reduce((n, e) => n + e.amount_minor, 0), commission_minor: 0, commission_paid_minor: 0, commission_outstanding_minor: 0, profit_minor: revenue - operating };
      return r.fulfill({ json: { observed_at: new Date().toISOString(), today: today(), from: p.from, to: p.to, summary, salons: f.data.salons.map(s => ({ id: s.id, name: s.name, archived: false })), categories: [{ code: 'rent', name: 'Rent' }, { code: 'supplies', name: 'Hair products and supplies' }], daily: [{ day: today(), ...summary }], monthly: [{ month: today().slice(0, 7), ...summary }], barbers: f.data.salons.filter(s => !p.salon_id || s.id === p.salon_id).flatMap(s => s.barbers.map(b => ({ id: b.id, display_name: b.display_name, salon_id: s.id, salon_name: s.name, archived_at: null, completed_count: selectedSales.filter(e => e.barber_id === b.id).length, revenue_minor: selectedSales.filter(e => e.barber_id === b.id).reduce((n, e) => n + e.amount_minor, 0), average_minutes: 35, rating: 4.8, review_count: 5 }))) } });
    }
    if (action === 'sales' || action === 'expenses') { const list = action === 'sales' ? selectedSales.filter(s => (!p.barber_id || s.barber_id === p.barber_id) && (!p.source || s.source === p.source)) : selectedExpenses.filter(e => !p.status || e.status === p.status); const offset = p.offset ?? 0; return r.fulfill({ json: { rows: list.slice(offset, offset + 25), total: list.length, next_offset: list.length > offset + 25 ? offset + 25 : null, observed_at: new Date().toISOString() } }); }
    if (action === 'expense') { const expense = expenses.find(e => e.id === p.id); return r.fulfill(expense ? { json: expense } : { status: 400, json: { code: 'P0001', message: 'Expense unavailable' } }); }
    writes.push({ action, data: p }); expect(p.request_id).toMatch(/^[a-f0-9-]{36}$/);
    const prior = requests.get(p.request_id); if (prior) return r.fulfill({ json: prior });
    let expense = expenses.find(e => e.id === p.id);
    if (expense && expense.version !== p.version) return r.fulfill({ status: 400, json: { code: 'P0001', message: 'This expense changed. Refresh before saving' } });
    if (action === 'save_expense') { if (!expense) { expense = { ...p, version: 0 } as Expense; expenses.push(expense); } Object.assign(expense, p, { version: expense.version + 1, salon_name: f.data.salons.find(s => s.id === p.salon_id)!.name, category_name: p.category_code === 'rent' ? 'Rent' : 'Hair products and supplies', ever_paid: expense.ever_paid || p.status === 'paid', paid_on: p.status === 'paid' ? p.paid_on : null }); }
    else { expect(action).toBe('cancel_expense'); Object.assign(expense!, { status: 'cancelled', paid_on: null, version: expense!.version + 1 }); }
    const result = { id: expense!.id, version: expense!.version }; requests.set(p.request_id, result);
    if (loseResponse) { loseResponse = false; return r.fulfill({ status: 503, json: { message: 'Lost response fixture' } }); }
    return r.fulfill({ json: result });
  });
  return { ...f, salon, second, barber, sales, expenses, writes, loseNextResponse: () => { loseResponse = true; } };
}
export async function choose(page: Page, label: string, value: string) { await page.getByRole('button', { name: label, exact: true }).filter({ visible: true }).click(); await page.getByRole('button', { name: `Choose ${label}: ${value}`, exact: true }).click(); }
