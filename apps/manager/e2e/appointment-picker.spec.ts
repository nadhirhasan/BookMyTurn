import { test, expect, type Page, type Route } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { fixture, login, seed } from './management-fixture';

async function setup(page: Page) {
  const f = await fixture(page), salon = seed(), barber = randomUUID(), appointment = randomUUID();
  salon.barbers.push({ id: barber, salon_id: salon.id, display_name: 'Sameer', bio: null, photo_url: null, experience_years: 4, specialities: [], is_active: true, availability: 'available', service_ids: [] });
  salon.appointments = [{ id: appointment, reference: '123456', customer_name: 'Amir', service_id: null, status: 'pending', requested_start: '2026-10-31T03:30:00Z', confirmed_start: null, barber_id: barber }];
  salon.pending = 1; f.data.salons.push(salon);
  const calls: { p_barber: string; p_action: string; p_data: { id: string; starts_at: string } }[] = [];
  const state = { loadError: false, empty: false, reserved: false, conflict: false };
  const rows = (day: string) => state.empty ? [] : [
    { starts_at: `${day}T03:30:00Z`, ends_at: `${day}T04:15:00Z`, barber_id: barber, available: true },
    { starts_at: `${day}T04:00:00Z`, ends_at: `${day}T04:45:00Z`, barber_id: barber, available: false },
    { starts_at: `${day}T08:30:00Z`, ends_at: `${day}T09:15:00Z`, barber_id: barber, available: !state.reserved },
    { starts_at: `${day}T12:00:00Z`, ends_at: `${day}T12:45:00Z`, barber_id: barber, available: true },
  ];
  await page.route('**/rest/v1/rpc/customer_slots', route => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({ p_salon: salon.id, p_service: null, p_barber: barber });
    return state.loadError ? route.fulfill({ status: 503, json: { message: 'Fixture outage' } }) : route.fulfill({ json: rows(body.p_day) });
  });
  await page.route('**/rest/v1/rpc/barber_command', route => {
    const body = route.request().postDataJSON(); calls.push(body);
    expect(body.p_action).toBe('suggest');
    if (state.conflict) { state.reserved = true; return route.fulfill({ status: 409, json: { code: '23P01', message: 'Proposed time is unavailable' } }); }
    salon.appointments![0]!.status = 'alternative_suggested';
    return route.fulfill({ json: { id: randomUUID() } });
  });
  const open = async (manager = false) => {
    await login(page);
    if (manager) {
      await page.getByRole('button', { name: `Manage ${salon.name}`, exact: true }).click();
      await page.getByRole('button', { name: 'Agenda', exact: true }).click();
      await page.getByRole('button', { name: 'Suggest time', exact: true }).click();
    } else {
      await page.getByRole('button', { name: `Manage ${salon.name}`, exact: true }).click();
      await page.getByRole('button', { name: 'Team', exact: true }).click();
      await page.getByRole('button', { name: "Open Sameer's chair", exact: true }).click();
      await page.getByRole('tab', { name: 'Appointments', exact: true }).click();
      await page.getByRole('button', { name: 'Suggest Another Time', exact: true }).click();
    }
    await expect(page.getByRole('heading', { name: 'Offer a better time.' })).toBeVisible();
  };
  return { state, calls, rows, open, salon, barber, appointment };
}

test('barber chooses a date and available slot without typing a time', async ({ page }, info) => {
  const f = await setup(page); await f.open();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Choose date 2026-10-31', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: '9:30 AM unavailable', exact: true })).toBeDisabled();
  await page.screenshot({ path: info.outputPath('calendar.png') });
  await page.getByRole('button', { name: '2:00 PM', exact: true }).click();
  await expect(page.getByRole('button', { name: '2:00 PM', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.screenshot({ path: info.outputPath('time-selection.png') });
  await page.getByRole('button', { name: 'Send Alternative Time' }).click();
  await expect(page).toHaveURL(/\/appointments$/);
  expect(f.calls).toEqual([{ p_barber: f.barber, p_action: 'suggest', p_data: { id: f.appointment, starts_at: '2026-10-31T08:30:00Z' } }]);
});

test('manager suggestion returns to the same salon agenda', async ({ page }) => {
  const f = await setup(page); await f.open(true);
  await page.getByRole('button', { name: '5:30 PM', exact: true }).click();
  await page.getByRole('button', { name: 'Send Alternative Time' }).click();
  await expect(page).toHaveURL(new RegExp(`/manage/salon/${f.salon.id}\\?tab=agenda$`));
  expect(f.calls).toHaveLength(1);
});

test('missing selection is highlighted and changing dates clears the chosen time', async ({ page }) => {
  const f = await setup(page); await f.open();
  await page.getByRole('button', { name: 'Send Alternative Time' }).click();
  await expect(page.getByText('Choose an available time above.')).toBeVisible(); expect(f.calls).toHaveLength(0);
  await page.getByRole('button', { name: '2:00 PM', exact: true }).click();
  await page.getByRole('button', { name: 'Choose date 2026-10-30', exact: true }).click();
  await expect(page.getByRole('button', { name: '2:00 PM', exact: true })).toHaveAttribute('aria-selected', 'false');
  await page.getByRole('button', { name: 'Send Alternative Time' }).click(); expect(f.calls).toHaveLength(0);
  await page.getByRole('button', { name: '9:00 AM', exact: true }).click();
  await page.getByRole('button', { name: 'Send Alternative Time' }).click();
  await expect(page).toHaveURL(/\/appointments$/); expect(f.calls[0]!.p_data.starts_at).toBe('2026-10-30T03:30:00Z');
});

test('loading failures and empty days have recovery actions', async ({ page }) => {
  const f = await setup(page); f.state.loadError = true; await f.open();
  await expect(page.getByText('Could not load available times. Try again.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send Alternative Time' })).toBeDisabled();
  f.state.loadError = false; f.state.empty = true; await page.getByRole('button', { name: 'Retry loading times' }).click();
  await expect(page.getByText('No available times on this day. Choose another date.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send Alternative Time' })).toBeDisabled();
  f.state.empty = false; await page.getByRole('button', { name: 'Choose date 2026-10-30', exact: true }).click();
  await expect(page.getByRole('button', { name: '2:00 PM', exact: true })).toBeEnabled(); expect(f.calls).toHaveLength(0);
});

test('late responses cannot replace the slots for the newly selected day', async ({ page }) => {
  const f = await setup(page); let held: Route | undefined;
  await page.route('**/rest/v1/rpc/customer_slots', route => {
    const day = route.request().postDataJSON().p_day;
    if (day === '2026-10-31') { held = route; return; }
    return route.fulfill({ json: f.rows(day).filter(row => row.starts_at.includes('12:00:00')) });
  });
  await f.open(); await expect.poll(() => !!held).toBe(true);
  await expect(page.getByRole('button', { name: 'Send Alternative Time' })).toBeDisabled();
  await page.getByRole('button', { name: 'Choose date 2026-10-30', exact: true }).click();
  await expect(page.getByRole('button', { name: '5:30 PM', exact: true })).toBeEnabled();
  await held!.fulfill({ json: f.rows('2026-10-31') });
  await expect(page.getByRole('button', { name: '2:00 PM', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '5:30 PM', exact: true }).click(); await page.getByRole('button', { name: 'Send Alternative Time' }).click();
  await expect(page).toHaveURL(/\/appointments$/); expect(f.calls[0]!.p_data.starts_at).toBe('2026-10-30T12:00:00Z');
});

test('a slot reserved after selection is disabled and a server conflict refreshes times', async ({ page }) => {
  const f = await setup(page); await f.open();
  await page.getByRole('button', { name: '2:00 PM', exact: true }).click(); f.state.reserved = true;
  await page.getByRole('button', { name: 'Refresh times', exact: true }).click();
  await expect(page.getByRole('button', { name: '2:00 PM unavailable', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Send Alternative Time' }).click(); expect(f.calls).toHaveLength(0);
  f.state.reserved = false; await page.getByRole('button', { name: 'Refresh times', exact: true }).click();
  await page.getByRole('button', { name: '2:00 PM', exact: true }).click(); f.state.conflict = true;
  await page.getByRole('button', { name: 'Send Alternative Time' }).click();
  await expect(page.getByText('This time overlaps an appointment or break. Choose another time.')).toBeVisible();
  await expect(page.getByRole('button', { name: '2:00 PM unavailable', exact: true })).toBeDisabled();
  expect(f.calls).toHaveLength(1); f.state.conflict = false;
  await page.getByRole('button', { name: '5:30 PM', exact: true }).click(); await page.getByRole('button', { name: 'Send Alternative Time' }).click();
  await expect(page).toHaveURL(/\/appointments$/); expect(f.calls).toHaveLength(2);
});

for (const width of [320, 430]) test(`calendar and time slots fit ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 780 }); const f = await setup(page); await f.open();
  await expect(page.getByRole('button', { name: '2:00 PM', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '2:00 PM', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Send Alternative Time' })).toBeVisible();
});
