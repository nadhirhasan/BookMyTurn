import { expect, test, type Page } from '@playwright/test';
import { financeFixture, choose } from './finance-fixture';
import { fixture, login } from './management-fixture';
import type { PerformanceBucket, PerformanceSummary } from '../src/lib/performance';

const currentDay = '2026-11-05';
function shift(day: string, n: number) { const d = new Date(`${day}T12:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
async function analyticsFixture(page: Page) {
  await page.clock.setFixedTime(new Date(`${currentDay}T08:00:00Z`));
  const f = await financeFixture(page), secondBarber = f.second.barbers[0]!.id;
  const events = [
    { salon: f.salon.id, barber: f.barber, day: currentDay, amount: 130000, sale: true },
    { salon: f.salon.id, barber: f.barber, day: shift(currentDay, -1), amount: 90000, sale: true },
    { salon: f.second.id, barber: secondBarber, day: currentDay, amount: 70000, sale: true },
    { salon: f.second.id, barber: secondBarber, day: shift(currentDay, -2), amount: -10000, sale: false },
    { salon: f.salon.id, barber: f.barber, day: shift(currentDay, -5), amount: 100000, sale: true },
  ];
  const requests: Record<string, string | null>[] = [];
  await page.route('**/rest/v1/rpc/owner_finance', r => {
    const { p_action, p_data: p } = r.request().postDataJSON(); if (p_action !== 'performance') return r.fallback();
    requests.push(p);
    const length = (Date.parse(p.to) - Date.parse(p.from)) / 86400000 + 1, previousFrom = shift(p.from, -length), previousTo = shift(p.from, -1);
    const allowed = events.filter(e => !p.salon_id || e.salon === p.salon_id);
    const summary = (from: string, to: string, barber = p.barber_id): PerformanceSummary => {
      const rows = allowed.filter(e => e.day >= from && e.day <= to && (!barber || e.barber === barber)), cuts = rows.filter(e => e.sale);
      return { revenue_minor: rows.reduce((n, e) => n + e.amount, 0), completed_count: cuts.length, adjustments_minor: rows.filter(e => !e.sale).reduce((n, e) => n + e.amount, 0), average_sale_minor: cuts.length ? Math.round(cuts.reduce((n, e) => n + e.amount, 0) / cuts.length) : null, average_minutes: cuts.length ? 45 : null };
    };
    const daily: PerformanceBucket[] = Array.from({ length }, (_, i) => ({ day: shift(p.from, i), ...summary(shift(p.from, i), shift(p.from, i)) }));
    const weeks = new Map<string, PerformanceBucket>();
    for (const d of daily) { const n = new Date(`${d.day}T12:00Z`).getUTCDay(), monday = shift(d.day, -(n + 6) % 7), row = weeks.get(monday); if (row) { row.until = d.day; row.revenue_minor += d.revenue_minor; row.completed_count += d.completed_count; } else weeks.set(monday, { ...d, until: d.day }); }
    return r.fulfill({ json: { observed_at: `${currentDay}T08:00Z`, today: currentDay, from: p.from, to: p.to, comparison_from: previousFrom, comparison_to: previousTo, summary: summary(p.from, p.to), previous: summary(previousFrom, previousTo), daily, weekly: [...weeks.values()], salons: f.data.salons.map(s => ({ id: s.id, name: s.name, archived: false })), team: f.data.salons.filter(s => !p.salon_id || s.id === p.salon_id).flatMap(s => s.barbers.map(b => ({ ...b, salon_name: s.name, archived_at: null, ...summary(p.from, p.to, b.id), previous_revenue_minor: summary(previousFrom, previousTo, b.id).revenue_minor, previous_completed_count: summary(previousFrom, previousTo, b.id).completed_count, rating: b.id === f.barber ? 4.5 : null, review_count: b.id === f.barber ? 2 : 0 }))) } });
  });
  return { ...f, events, requests, secondBarber };
}
async function openAnalytics(page: Page) { await login(page); await page.getByRole('button', { name: 'Team performance', exact: true }).click(); }

test('owner explores daily and weekly results and individual barber performance', async ({ page }, info) => {
  const f = await analyticsFixture(page); await openAnalytics(page);
  await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 2,800');
  await expect(page.getByTestId('performance-cuts')).toHaveText('3');
  await expect(page.getByText('+180.0% vs previous period')).toBeVisible();
  await page.screenshot({ path: info.outputPath('analytics-overview.png') });
  await page.getByRole('button', { name: '4 Nov: Rs. 900', exact: true }).click();
  await expect(page.getByTestId('chart-selection')).toContainText('Rs. 900');
  await page.screenshot({ path: info.outputPath('analytics-daily-chart.png') });
  await expect(page.getByTestId('negative-bar')).toHaveCount(1);
  await page.getByRole('button', { name: 'Haircuts', exact: true }).click(); await page.getByRole('button', { name: 'Weekly', exact: true }).click();
  await expect(page.getByTestId('chart-selection')).toContainText('3 haircuts');
  await page.getByRole('button', { name: 'View performance: Amir', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Amir', exact: true })).toBeVisible();
  await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 2,200');
  await expect(page.getByTestId('performance-cuts')).toHaveText('2');
  await expect(page.getByText('4.5/5 · 2 reviews in this period')).toBeVisible();
  expect(f.requests.at(-1)?.barber_id).toBe(f.barber);
  await page.screenshot({ path: info.outputPath('analytics-barber.png') });
  await page.getByRole('button', { name: 'Back to whole team', exact: true }).click();
  await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 2,800');
});

test('date presets, salon/barber filters and calendar ranges scope the report', async ({ page }) => {
  const f = await analyticsFixture(page); await openAnalytics(page);
  await page.getByRole('button', { name: 'Filter performance', exact: true }).click();
  await choose(page, 'Analytics salon', f.salon.name); await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 2,200');
  await choose(page, 'Analytics barber', `Amir · ${f.salon.name}`);
  await choose(page, 'Analytics salon', f.second.name); await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 600');
  expect(f.requests.at(-1)?.barber_id).toBeNull();
  await page.getByRole('button', { name: 'Done filtering', exact: true }).click();
  await page.getByRole('button', { name: 'Today', exact: true }).click(); await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 700');
  await page.getByRole('button', { name: 'This month', exact: true }).click(); expect(f.requests.at(-1)?.to).toBe(currentDay);
  await page.getByRole('button', { name: 'Custom dates', exact: true }).click();
  await page.getByRole('button', { name: 'Analytics from date', exact: true }).click(); await page.getByRole('button', { name: 'Choose date 2026-11-04', exact: true }).click();
  await page.getByRole('button', { name: 'Analytics to date', exact: true }).click(); await page.getByRole('button', { name: 'Choose date 2026-11-03', exact: true }).click();
  await page.getByRole('button', { name: 'Apply analytics dates', exact: true }).click(); await expect(page.getByRole('button', { name: 'Analytics to date', exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Analytics to date', exact: true }).click(); await expect(page.getByRole('button', { name: 'Choose date 2026-11-06', exact: true })).toBeDisabled(); await page.getByRole('button', { name: 'Choose date 2026-11-05', exact: true }).click();
  await page.getByRole('button', { name: 'Apply analytics dates', exact: true }).click(); await expect(page.getByRole('button', { name: 'Analytics to date', exact: true })).toHaveAttribute('aria-invalid', 'false');
  await expect.poll(() => f.requests.at(-1)?.from).toBe('2026-11-04');
});

test('zero and negative results remain honest and readable', async ({ page }, info) => {
  const f = await analyticsFixture(page); f.events.splice(0); await openAnalytics(page);
  await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 0'); await expect(page.getByTestId('performance-cuts')).toHaveText('0');
  await expect(page.getByText('No revenue in this period yet.')).toBeVisible(); await expect(page.getByText('No previous revenue').filter({visible:true})).toBeVisible();
  await page.screenshot({ path: info.outputPath('analytics-empty.png') });
  f.events.push({ salon: f.salon.id, barber: f.barber, day: currentDay, amount: -50000, sale: false });
  await page.getByRole('button', { name: 'Refresh performance', exact: true }).click();
  await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. -500'); await expect(page.getByTestId('negative-bar')).toHaveCount(1);
  await expect(page.getByTestId('performance-cuts')).toHaveText('0');
});

test('offline figures show stale status and revoked permission clears financial data', async ({ page }) => {
  await analyticsFixture(page); await openAnalytics(page); await expect(page.getByTestId('performance-revenue')).toBeVisible();
  const offline = (r: import('@playwright/test').Route) => r.fulfill({ status: 503, json: { message: 'Offline fixture' } });
  await page.route('**/rest/v1/rpc/owner_finance', offline); await page.getByRole('button', { name: 'Refresh performance', exact: true }).click();
  await expect(page.getByText('Performance data may be out of date. Refresh before relying on these figures.')).toBeVisible();
  await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 2,800');
  await page.unroute('**/rest/v1/rpc/owner_finance', offline);
  await page.route('**/rest/v1/rpc/owner_finance', r => r.fulfill({ status: 403, json: { code: '42501', message: 'Owner access required' } }));
  await page.getByRole('button', { name: 'Refresh performance', exact: true }).click(); await expect(page.getByTestId('performance-revenue')).toHaveCount(0);
});

test('late analytics responses cannot replace a newer date filter or survive sign out', async ({ page }) => {
  await analyticsFixture(page); await openAnalytics(page); await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 2,800');
  let release!: () => void, requested!: () => void; const gate = new Promise<void>(r => { release = r; }), started = new Promise<void>(r => { requested = r; });
  await page.route('**/rest/v1/rpc/owner_finance', async r => { if (r.request().postDataJSON().p_data.from === '2026-11-03') { requested(); await gate; } await r.fallback(); });
  await page.getByRole('button', { name: 'Custom dates', exact: true }).click(); await page.getByRole('button', { name: 'Analytics from date', exact: true }).click(); await page.getByRole('button', { name: 'Choose date 2026-11-03', exact: true }).click(); await page.getByRole('button', { name: 'Apply analytics dates', exact: true }).click(); await started;
  await page.getByRole('button', { name: 'Today', exact: true }).click(); await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 2,000'); release();
  await expect(page.getByTestId('performance-revenue')).toHaveText('Rs. 2,000');
  let releaseLogout!: () => void, requestedLogout!: () => void;
  const logoutGate = new Promise<void>(r => { releaseLogout = r; }), logoutStarted = new Promise<void>(r => { requestedLogout = r; });
  await page.route('**/rest/v1/rpc/owner_finance', async r => { requestedLogout(); await logoutGate; await r.fallback(); });
  await page.getByRole('button', { name: 'Refresh performance', exact: true }).click(); await logoutStarted;
  await page.getByRole('button', { name: 'My account', exact: true }).click(); await page.getByRole('button', { name: 'Sign out', exact: true }).click(); releaseLogout();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible(); await expect(page.getByTestId('performance-revenue').filter({ visible: true })).toHaveCount(0);
});

for (const width of [320, 393, 430]) test(`analytics fits ${width}px and exposes a clear manager shortcut`, async ({ page }, info) => {
  await analyticsFixture(page); await page.setViewportSize({ width, height: 852 }); await login(page);
  await page.getByRole('button', { name: 'Team performance', exact: true }).click();
  await expect(page.getByTestId('performance-revenue')).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Overview', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View performance: Hassan', exact: true }).scrollIntoViewIfNeeded(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath(`team-${width}.png`) });
  await page.getByRole('button', { name: 'Custom dates', exact: true }).click(); await page.getByRole('button', { name: 'Analytics from date', exact: true }).click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('an account without owner access has no financial analytics controls', async ({ page }) => {
  await fixture(page); let requests = 0; await page.route('**/rest/v1/rpc/owner_finance', r => { requests++; return r.fulfill({ status: 403, json: { code: '42501' } }); });
  await login(page); await page.goto('/manage/analytics'); await expect(page.getByText('Performance and revenue reports are available to salon owners only.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Team performance', exact: true })).toHaveCount(0); expect(requests).toBe(0);
});
