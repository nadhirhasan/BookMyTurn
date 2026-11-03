import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createSalon, fixture, login, seed } from './management-fixture';

test('salon → barber → invitation is guided, retry-safe and shareable', async ({ page }, info) => {
  const f = await fixture(page);
  const invitations: { id: string; token: string }[] = [];
  let fail = true;
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: { text: string }) => { (window as any).sharedInvitation = data.text; } }));
  await page.route('**/rest/v1/rpc/barber_team', r => r.fulfill({ json: { members: f.data.salons.flatMap(s => s.barbers.map(b => ({ barber_id: b.id, connected: false, account_email: null, invitation: invitations.length ? { id: invitations[0]!.id, status: 'pending', expires_at: new Date(Date.now() + 86400000).toISOString() } : null }))) } }));
  await page.route('**/rest/v1/rpc/barber_invitation', r => {
    const { p_action, p_data } = r.request().postDataJSON();
    expect(p_action).toBe('create'); invitations.push(p_data);
    if (fail) { fail = false; return r.fulfill({ status: 503, json: { message: 'Connection interrupted. Retry safely.' } }); }
    return r.fulfill({ json: { id: p_data.id } });
  });
  await login(page);
  await expect(page.getByText('Joining an existing team?', { exact: true })).toBeVisible();
  await createSalon(page, 'Guided Studio');
  await expect(page).toHaveURL(/tab=team/);
  await expect(page.getByText('Your salon is saved.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '+ Add barber', exact: true }).click();
  await page.getByLabel('Barber name', { exact: true }).fill('Amir');
  await page.getByRole('button', { name: 'Create barber', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Invite Amir to their chair.' })).toBeVisible();
  expect(invitations).toHaveLength(0); expect(f.data.salons[0]!.barbers).toHaveLength(1);
  await page.screenshot({ path: info.outputPath('barber-added-invite.png'), fullPage: true });
  await page.getByRole('button', { name: 'Create invitation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry access check', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Retry access check', exact: true }).click();
  await page.getByRole('button', { name: 'Replace invitation', exact: true }).click();
  await expect(page.getByLabel('Private invitation link')).toBeVisible();
  expect(invitations).toHaveLength(2); expect(invitations[0]!.id).toBe(invitations[1]!.id); expect(invitations[0]!.token).toBe(invitations[1]!.token);
  await page.getByRole('button', { name: 'Share invitation', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).sharedInvitation)).toContain(invitations[0]!.token);
  await page.screenshot({ path: info.outputPath('invitation-ready-to-share.png'), fullPage: true });
  await page.getByRole('button', { name: 'Back to team', exact: true }).click();
  await expect(page.getByText('Invitation pending', { exact: true })).toBeVisible();
  expect(f.data.salons[0]!.barbers).toHaveLength(1);
  await page.screenshot({ path: info.outputPath('team-invitation-status.png'), fullPage: true });
});

test('inviting later stays discoverable and access-load failure is recoverable', async ({ page }) => {
  const f = await fixture(page), salon = seed(); f.data.salons.push(salon);
  let failed = false;
  await page.route('**/rest/v1/rpc/barber_team', r => failed ? r.fulfill({ status: 503, json: { message: 'Offline' } }) : r.fulfill({ json: { members: [] } }));
  await login(page); await page.getByRole('button', { name: `Manage ${salon.name}`, exact: true }).click();
  await page.getByRole('button', { name: '+ Add barber', exact: true }).click();
  await page.getByLabel('Barber name', { exact: true }).fill('Nimal');
  await page.getByRole('button', { name: 'Create barber', exact: true }).click();
  await page.getByRole('button', { name: 'Back to team', exact: true }).click();
  await expect(page.getByText('Invitation needed', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: "Manage Nimal's login", exact: true })).toHaveText('Invite barber');
  failed = true; await page.getByRole('button', { name: 'Refresh salons', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry team access', exact: true })).toBeVisible();
  failed = false; await page.getByRole('button', { name: 'Retry team access', exact: true }).click();
  await expect(page.getByText('Invitation needed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: "Manage Nimal's login", exact: true }).click();
  await expect(page.getByRole('button', { name: 'Create invitation', exact: true })).toBeEnabled();
});

test('barber arrival tools precede the queue and reuse the existing customer code', async ({ page }) => {
  const f = await fixture(page), salon = seed(), barber = randomUUID();
  salon.barbers.push({ id: barber, salon_id: salon.id, display_name: 'Amir', bio: '', photo_url: null, experience_years: null, specialities: [], is_active: true, availability: 'available', service_ids: [] });
  salon.queues = [{ id: randomUUID(), reference: '123456', customer_name: 'Nadeem', mobile: null, service_id: null, status: 'joined', source: 'remote', estimated_start: null, barber_id: barber, preferred_barber_id: barber, assigned_barber_id: barber, created_at: new Date().toISOString(), arrived_at: null }];
  f.data.salons.push(salon);
  await page.route('**/rest/v1/rpc/barber_command', r => {
    const body = r.request().postDataJSON(); expect(body.p_action).toBe('check_in'); expect(body.p_data.reference).toBe('123456');
    salon.queues![0]!.status = 'arrived'; return r.fulfill({ json: { id: salon.queues![0]!.id } });
  });
  await login(page); await page.getByRole('button', { name: `Manage ${salon.name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Team', exact: true }).click(); await page.getByRole('button', { name: "Open Amir's chair", exact: true }).click();
  const input = await page.getByRole('button', { name: 'Check in an arrival', exact: true }).boundingBox();
  const queue = await page.getByRole('heading', { name: 'Your queue', exact: true }).boundingBox();
  expect(input!.y).toBeLessThan(queue!.y);
  await page.getByRole('button', { name: 'Mark arrived', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1 waiting for you.' })).toBeVisible(); expect(salon.queues).toHaveLength(1);
});

test('a mistyped customer code explains the empty view and can be cleared', async ({ page }) => {
  const f = await fixture(page), salon = seed(); f.data.salons.push(salon);
  await login(page); await page.getByRole('button', { name: `Manage ${salon.name}`, exact: true }).click();
  await page.getByLabel('Customer code', { exact: true }).fill('999999');
  await expect(page.getByText('No visit matches this code.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear customer code', exact: true }).click();
  await expect(page.getByLabel('Customer code', { exact: true })).toHaveValue('');
  await expect(page.getByText('No visits in this view.', { exact: true })).toBeVisible();
});
