import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { fixture, login, seed } from './management-fixture';

test('owner creates, replaces, cancels and revokes a personal barber invitation', async ({ page }, info) => {
  const f = await fixture(page), salon = seed(), barber = randomUUID();
  salon.barbers.push({ id: barber, salon_id: salon.id, display_name: 'Amir', bio: '', photo_url: null, experience_years: 3, specialities: [], is_active: true, availability: 'available', service_ids: [] }); f.data.salons.push(salon);
  const access = { barber_id: barber, connected: false, account_email: null as string | null, invitation: null as null | { id: string; expires_at: string; status: string } };
  const calls: string[] = [];
  await page.route('**/rest/v1/rpc/barber_team', r => r.fulfill({ json: { members: [access] } }));
  await page.route('**/rest/v1/rpc/barber_invitation', r => { const { p_action, p_data } = r.request().postDataJSON(); calls.push(p_action); expect(p_data.salon_id).toBe(salon.id); expect(p_data.barber_id).toBe(barber);
    if (p_action === 'create') { expect(p_data.token).toMatch(/^[a-f0-9]{64}$/); access.invitation = { id: p_data.id, expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), status: 'pending' }; }
    if (p_action === 'cancel') access.invitation!.status = 'cancelled';
    if (p_action === 'revoke') { access.connected = false; access.invitation!.status = 'cancelled'; }
    return r.fulfill({ json: { id: p_data.id ?? barber, expires_at: access.invitation?.expires_at } });
  });
  await login(page); await page.getByRole('button', { name: `Manage ${salon.name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Team', exact: true }).click();
  await page.getByRole('button', { name: "Manage Amir's login", exact: true }).click();
  await page.getByRole('button', { name: 'Create invitation', exact: true }).click();
  const first = await page.getByLabel('Private invitation link').inputValue(); expect(first).toContain('/invite?token=');
  await page.screenshot({ path: info.outputPath('owner-barber-invitation.png') });
  await page.getByRole('button', { name: 'Replace invitation', exact: true }).click();
  await expect(page.getByLabel('Private invitation link')).not.toHaveValue(first);
  await page.getByRole('button', { name: 'Cancel invitation', exact: true }).click();
  await expect(page.getByLabel('Private invitation link')).toHaveCount(0);
  access.connected = true; access.account_email = 'amir@example.invalid';
  await page.reload(); await expect(page.getByText('amir@example.invalid')).toBeVisible();
  await page.getByRole('button', { name: 'Remove barber access', exact: true }).click();
  await expect(page.getByText('Remove this account’s access?', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm remove access', exact: true }).click();
  await expect(page.getByText('No account connected', { exact: true })).toBeVisible();
  expect(calls).toEqual(['create', 'create', 'cancel', 'revoke']);
});

async function staffFixture(page: Page) {
  const uid = randomUUID(), chair = randomUUID(), salon = randomUUID(); let connected = false;
  const user = { id: uid, email: 'amir@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString(), identities: [] };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: uid, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fixture`;
  await page.route('**/auth/v1/**', r => r.fulfill(r.request().url().includes('/logout') ? { status: 204 } : { json: r.request().url().includes('/user') ? user : { user, access_token: token, refresh_token: 'fixture-refresh', token_type: 'bearer', expires_in: 3600 } }));
  const state = { observed_at: new Date().toISOString(), today: '2026-11-02', salon: { id: salon, name: 'Amir Studio', slug: 'amir-studio', is_open: true }, barber: { id: chair, display_name: 'Amir', bio: '', experience_years: 3, specialities: [], photo_url: null, availability: 'available' }, can_manage_catalog: false, can_read_finance: false, queues: [], appointments: [], sessions: [], styles: [], hours: [], reviews: [{ id: randomUUID(), rating: 5, body: 'Great haircut.', created_at: new Date().toISOString() }], services: [], breaks: [], commission_rules: [], performance: { today_count: 2, total_count: 8, today_revenue_minor: 9999900, total_revenue_minor: 9999900 } };
  let unavailable = false;
  await page.route('**/rest/v1/rpc/**', r => {
    const name = new URL(r.request().url()).pathname.split('/').at(-1), body = r.request().postDataJSON() ?? {};
    if (name === 'manager_state') return r.fulfill({ json: { profile: { display_name: '', avatar_path: null }, salons: [] } });
    if (name === 'barber_context') return r.fulfill({ json: connected ? [{ barber_id: chair, salon_id: salon, barber_name: 'Amir', salon_name: 'Amir Studio', role: 'barber' }] : [] });
    if (name === 'barber_state') return r.fulfill({ json: state });
    expect(name).toBe('barber_invitation');
    if (unavailable) return r.fulfill({ status: 400, json: { code: 'P0001', message: 'Invitation unavailable or expired' } });
    expect(body.p_data.token).toBe('a'.repeat(64));
    if (body.p_action === 'accept') connected = true;
    return r.fulfill({ json: { id: randomUUID(), salon_id: salon, barber_id: chair, salon_name: 'Amir Studio', barber_name: 'Amir', accepted: connected, expires_at: new Date(Date.now() + 86400000).toISOString() } });
  });
  return { expire: () => { unavailable = true; } };
}

test('invited barber signs up, accepts the existing chair and sees nonfinancial work', async ({ page }, info) => {
  await staffFixture(page); await page.goto(`/invite?token=${'a'.repeat(64)}`);
  await expect(page.getByText('Sign in or create your own account, then accept your barber invitation.')).toBeVisible();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Email address', { exact: true }).fill('amir@example.invalid'); await page.getByLabel('Password', { exact: true }).fill('Fixture password 123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByLabel('Invitation link or token')).toHaveValue('a'.repeat(64));
  await expect(page.getByText('Amir Studio', { exact: true })).toBeVisible(); await page.screenshot({ path: info.outputPath('accept-barber-invitation.png') });
  await page.getByRole('button', { name: 'Accept invitation', exact: true }).click();
  await expect(page.getByRole('heading', { name: '0 waiting for you.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'My salons', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: /My Work/ }).click();
  await expect(page.getByText('2 completed', { exact: true })).toBeVisible(); await expect(page.getByText('Great haircut.', { exact: true })).toBeVisible();
  await expect(page.getByText(/revenue|profit|Rs\./i)).toHaveCount(0); await page.screenshot({ path: info.outputPath('barber-nonfinancial-work.png') });
});

test('manual invitation entry highlights missing input and handles expired links', async ({ page }) => {
  const f = await staffFixture(page); await page.goto('/invite');
  await page.getByLabel('Email address', { exact: true }).fill('amir@example.invalid'); await page.getByLabel('Password', { exact: true }).fill('Fixture password 123'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Check invitation', exact: true }).click(); await expect(page.getByLabel('Invitation link or token')).toHaveAttribute('aria-invalid', 'true');
  f.expire(); await page.getByLabel('Invitation link or token').fill(`https://example.invalid/invite?token=${'a'.repeat(64)}`); await page.getByRole('button', { name: 'Check invitation', exact: true }).click();
  await expect(page.getByText('Invitation unavailable or expired', { exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Accept invitation', exact: true })).toHaveCount(0);
});

for (const width of [320, 430]) test(`invitation acceptance fits ${width}px`, async ({ page }) => {
  await staffFixture(page); await page.setViewportSize({ width, height: 780 }); await page.goto(`/invite?token=${'a'.repeat(64)}`);
  await page.getByLabel('Email address', { exact: true }).fill('amir@example.invalid'); await page.getByLabel('Password', { exact: true }).fill('Fixture password 123'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Accept invitation', exact: true })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('offline salon data is labelled stale and cannot perform check-in until refreshed', async ({ page }) => {
  const f = await fixture(page), salon = seed(), visit = randomUUID();
  salon.queues = [{ id: visit, reference: '123456', customer_name: 'Customer', mobile: null, service_id: null, status: 'joined', source: 'remote', estimated_start: null, barber_id: null, preferred_barber_id: null, assigned_barber_id: null, created_at: new Date().toISOString(), arrived_at: null }]; f.data.salons.push(salon);
  let mutations = 0; page.on('request', r => { if (r.url().endsWith('/manager_visit_command')) mutations++; });
  await login(page); await page.getByRole('button', { name: `Manage ${salon.name}`, exact: true }).click();
  await page.route('**/rest/v1/rpc/manager_state', r => r.fulfill({ status: 503, json: { message: 'offline fixture' } }));
  await page.getByRole('button', { name: 'Refresh salons', exact: true }).click();
  await expect(page.getByText('Data may be out of date. Refresh before changing the queue.', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mark arrived', exact: true }).click();
  await expect(page.getByText('Your salon data is out of date. Refresh before making changes.', { exact: true })).toBeVisible(); expect(mutations).toBe(0);
  await page.unroute('**/rest/v1/rpc/manager_state'); await page.getByRole('button', { name: 'Refresh salons', exact: true }).click();
  await expect(page.getByText('Data may be out of date. Refresh before changing the queue.', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mark arrived', exact: true }).click(); await expect(page.getByTestId(`queue-${visit}`).getByText('Waiting', { exact: true })).toBeVisible(); expect(mutations).toBe(1);
});
