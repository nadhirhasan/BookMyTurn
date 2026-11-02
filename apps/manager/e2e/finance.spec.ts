import { test, expect, type Route } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { login } from './management-fixture';
import { financeFixture, choose, today } from './finance-fixture';

test('owner sees recorded revenue and creates, pays, corrects and cancels an expense', async ({ page }, info) => {
  const f = await financeFixture(page); await login(page); await page.getByRole('button', { name: 'Finance', exact: true }).click();
  await expect(page.getByTestId('finance-revenue')).toHaveText('Rs. 2,000'); await expect(page.getByTestId('finance-profit')).toHaveText('Rs. 2,000');
  await page.screenshot({ path: info.outputPath('owner-finance-overview.png') });
  await page.getByRole('button', { name: 'Add expense', exact: true }).click(); await page.getByRole('button', { name: 'Create expense', exact: true }).click();
  await expect(page.getByLabel('Expense description', { exact: true })).toHaveAttribute('aria-invalid', 'true'); await expect(page.getByRole('button', { name: 'Expense category', exact: true })).toHaveAttribute('aria-invalid', 'true'); expect(f.writes).toHaveLength(0);
  await choose(page, 'Expense salon', f.salon.name); await page.getByLabel('Expense description', { exact: true }).fill('Chair rent'); await choose(page, 'Expense category', 'Rent'); await page.getByLabel('Expense amount (Rs.)').fill('200');
  await page.screenshot({ path: info.outputPath('owner-expense-entry.png') }); await page.getByRole('button', { name: 'Create expense', exact: true }).click();
  await expect(page.getByTestId('finance-profit')).toHaveText('Rs. 2,000'); await expect(page.getByText('Rs. 200', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Finance expenses', exact: true }).click(); await page.getByRole('button', { name: 'Edit expense: Chair rent', exact: true }).click();
  await choose(page, 'Payment status', 'Paid'); await page.getByRole('button', { name: 'Save expense', exact: true }).click();
  await page.getByRole('button', { name: 'Finance overview', exact: true }).click(); await expect(page.getByTestId('finance-profit')).toHaveText('Rs. 1,800');
  await page.getByRole('button', { name: 'Finance expenses', exact: true }).click(); await page.getByRole('button', { name: 'Edit expense: Chair rent', exact: true }).click();
  await page.getByLabel('Expense amount (Rs.)').fill('250'); await page.getByRole('button', { name: 'Save expense', exact: true }).click(); await expect(page.getByLabel('Reason for correction')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Reason for correction').fill('Correct receipt amount'); await page.getByRole('button', { name: 'Save expense', exact: true }).click();
  await page.getByRole('button', { name: 'Edit expense: Chair rent', exact: true }).click(); await page.getByLabel('Reason for correction').fill('Refund received'); await page.getByRole('button', { name: 'Cancel expense', exact: true }).click(); await page.getByRole('button', { name: 'Confirm cancellation', exact: true }).click();
  await page.getByRole('button', { name: 'Finance overview', exact: true }).click(); await expect(page.getByTestId('finance-profit')).toHaveText('Rs. 2,000'); expect(f.expenses).toHaveLength(1); expect(f.expenses[0]!.status).toBe('cancelled');
});

test('salon, barber, source and date filters work with sales pagination and reports', async ({ page }, info) => {
  const f = await financeFixture(page); for (let i = 0; i < 27; i++) f.sales.push({ ...f.sales[0]!, id: randomUUID(), amount_minor: 100 });
  await login(page); await page.getByRole('button', { name: 'Finance', exact: true }).click(); await choose(page, 'Report salon', f.salon.name); await expect(page.getByTestId('finance-revenue')).toHaveText('Rs. 1,327');
  await page.getByRole('button', { name: 'Finance sales', exact: true }).click(); await expect(page.getByText('28 records · page 1')).toBeVisible(); await page.getByRole('button', { name: 'Next sales', exact: true }).click(); await expect(page.getByText('28 records · page 2')).toBeVisible();
  await choose(page, 'Customer source', 'Salon QR'); await expect(page.getByText('No recorded sales match these dates and filters.')).toBeVisible(); await choose(page, 'Customer source', 'All sources'); await choose(page, 'Sales barber', `Amir · ${f.salon.name}`); await expect(page.getByText('28 records · page 1')).toBeVisible();
  await page.getByRole('button', { name: 'Finance reports', exact: true }).click(); await expect(page.getByText('Barber performance', { exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Monthly report', exact: true }).click(); await expect(page.getByText(new RegExp(`${today().slice(0, 7)}.*28 haircuts`))).toBeVisible(); await page.screenshot({ path: info.outputPath('owner-monthly-report.png') });
  await page.getByRole('button', { name: 'Custom dates', exact: true }).click(); await page.getByRole('button', { name: 'From date', exact: true }).click(); await page.getByRole('button', { name: 'Next month', exact: true }).click(); const next = new Date(`${today().slice(0, 7)}-15T12:00Z`); next.setUTCMonth(next.getUTCMonth() + 1); const nextDay = `${next.toISOString().slice(0, 7)}-01`; await page.getByRole('button', { name: `Choose date ${nextDay}`, exact: true }).click(); await page.getByRole('button', { name: 'Apply dates', exact: true }).click(); await expect(page.getByRole('button', { name: 'To date', exact: true })).toHaveAttribute('aria-invalid', 'true');
});

test('expense retry uses one request and stale versions require reload', async ({ page }) => {
  const f = await financeFixture(page); await login(page); await page.getByRole('button', { name: 'Finance', exact: true }).click(); await page.getByRole('button', { name: 'Add expense', exact: true }).click();
  await choose(page, 'Expense salon', f.salon.name); await page.getByLabel('Expense description', { exact: true }).fill('Supplies'); await choose(page, 'Expense category', 'Hair products and supplies'); await page.getByLabel('Expense amount (Rs.)').fill('100');
  f.loseNextResponse(); await page.getByRole('button', { name: 'Create expense', exact: true }).click(); await expect(page.getByRole('alert').filter({ hasText: 'Could not save.' })).toBeVisible(); await page.getByRole('button', { name: 'Create expense', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Your business, in view.' })).toBeVisible();
  expect(f.writes).toHaveLength(2); expect(f.writes[0]!.data.request_id).toBe(f.writes[1]!.data.request_id); expect(f.expenses).toHaveLength(1);
  await page.getByRole('button', { name: 'Finance expenses', exact: true }).click(); await page.getByRole('button', { name: 'Edit expense: Supplies', exact: true }).click(); await expect(page.getByLabel('Expense amount (Rs.)')).toHaveValue('100'); f.expenses[0]!.version++; f.expenses[0]!.amount_minor = 11000;
  await page.getByLabel('Expense amount (Rs.)').fill('120'); await page.getByRole('button', { name: 'Save expense', exact: true }).click(); await expect(page.getByText('This expense changed. Refresh before saving', { exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Reload saved financial data', exact: true }).click(); await expect(page.getByLabel('Expense amount (Rs.)')).toHaveValue('110');
});

test('a non-owner cannot open financial routes or trigger finance requests', async ({ page }) => {
  const f = await financeFixture(page); f.data.salons = []; let requests = 0; page.on('request', r => { if (r.url().endsWith('/owner_finance')) requests++; }); await login(page); await expect(page.getByRole('button', { name: 'Finance', exact: true })).toHaveCount(0); await page.goto('/manage/finance'); await expect(page.getByText('Financial records are available to salon owners only.')).toBeVisible(); await page.goto('/manage/finance/expense/new'); await expect(page.getByText('Financial records are available to salon owners only.')).toBeVisible(); expect(requests).toBe(0);
});

test('offline finance data stays labelled stale and recovers with financial refresh', async ({ page }) => {
  await financeFixture(page); await login(page); await page.getByRole('button', { name: 'Finance', exact: true }).click(); await expect(page.getByTestId('finance-revenue')).toHaveText('Rs. 2,000');
  const offline = (r: Route) => r.fulfill({ status: 503, json: { message: 'Offline fixture' } });
  await page.route('**/rest/v1/rpc/owner_finance', offline);
  await page.getByRole('button', { name: 'Refresh financial data', exact: true }).click(); await expect(page.getByText('Financial data may be out of date. Refresh before relying on these totals.')).toBeVisible(); await expect(page.getByTestId('finance-revenue')).toHaveText('Rs. 2,000');
  await page.unroute('**/rest/v1/rpc/owner_finance', offline);
  await page.getByRole('button', { name: 'Refresh financial data', exact: true }).click(); await expect(page.getByText('Financial data may be out of date. Refresh before relying on these totals.')).toHaveCount(0);
});

test('late financial responses cannot reappear after sign-out', async ({ page }) => {
  await financeFixture(page); await login(page); await page.getByRole('button', { name: 'Finance', exact: true }).click(); await expect(page.getByTestId('finance-revenue')).toHaveText('Rs. 2,000');
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; }); let requested!: () => void; const started = new Promise<void>(resolve => { requested = resolve; });
  await page.route('**/rest/v1/rpc/owner_finance', async r => { requested(); await gate; await r.fallback(); });
  await page.getByRole('button', { name: 'Refresh financial data', exact: true }).click(); await started;
  await page.getByRole('button', { name: 'My account', exact: true }).click(); await page.getByRole('button', { name: 'Sign out', exact: true }).click(); release();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible(); await expect(page.getByTestId('finance-revenue').filter({ visible: true })).toHaveCount(0);
});

for (const width of [320, 393, 430]) test(`owner finance and expense forms fit ${width}px`, async ({ page }) => {
  await financeFixture(page); await page.setViewportSize({ width, height: 780 }); await login(page); await page.getByRole('button', { name: 'Finance', exact: true }).click(); await expect(page.getByTestId('finance-revenue')).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.getByRole('button', { name: 'Finance reports', exact: true }).click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.getByRole('button', { name: 'Finance expenses', exact: true }).click(); await page.getByRole('button', { name: 'Add expense', exact: true }).click(); await expect(page.getByRole('button', { name: 'Create expense', exact: true })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
