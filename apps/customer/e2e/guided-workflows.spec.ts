import { expect, test } from '@playwright/test';
import { appointmentId, barberId, mockDatabase, salonId, signInFixture } from './fixtures';

test('arrived appointments stay active on Home and My Appointments', async ({ page }, info) => {
  await mockDatabase(page);
  const entry = { id: appointmentId, salon_id: salonId, reference: '284205', status: 'arrived', requested_start: new Date().toISOString(), confirmed_start: new Date().toISOString(), confirmed_barber_id: barberId, preferred_barber_id: barberId, service_id: null };
  await page.route('**/rest/v1/rpc/customer_state', r => r.fulfill({ json: { queues: [], appointments: [entry], proposals: [], sessions: [], reviews: [], style_requests: [], notifications: [] } }));
  await signInFixture(page); await page.goto('/');
  await page.getByRole('button', { name: 'View my appointment', exact: true }).click();
  await expect(page.getByText('You are checked in.', { exact: false })).toBeVisible();
  await expect(page.getByText('Past appointments', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cancel appointment', exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('arrived-appointment.png'), fullPage: true });
  entry.status = 'completed'; await page.reload();
  await expect(page.getByText('Past appointments', { exact: true })).toBeVisible();
});

test('appointment guidance follows status and a declined visit leads back to the calendar', async ({ page }) => {
  await mockDatabase(page);
  const entry = { id: appointmentId, salon_id: salonId, reference: '284205', status: 'pending', requested_start: new Date().toISOString(), confirmed_start: null, confirmed_barber_id: null, preferred_barber_id: barberId, service_id: null };
  await page.route('**/rest/v1/rpc/customer_state', r => r.fulfill({ json: { queues: [], appointments: [entry], proposals: [], sessions: [], reviews: [], style_requests: [], notifications: [] } }));
  await signInFixture(page); await page.goto('/appointments');
  await expect(page.getByText('Wait for confirmation here before travelling', { exact: false })).toBeVisible();
  entry.status = 'confirmed'; await page.reload();
  await expect(page.getByText('They will check in this appointment', { exact: false })).toBeVisible();
  entry.status = 'declined'; await page.reload();
  await page.getByRole('button', { name: 'Choose another time', exact: true }).click();
  await expect(page.getByText('Choose a date', { exact: true })).toBeVisible();
});

test('an empty hairstyle filter offers a way back to available styles', async ({ page }) => {
  const f = await mockDatabase(page);
  f.catalog.categories.push({ id: 'empty-category', name: 'Long hair' });
  await page.goto('/hairstyles');
  await page.getByRole('button', { name: 'Explore styles', exact: true }).click();
  await page.getByRole('button', { name: 'Long hair', exact: true }).click();
  await expect(page.getByText('No styles in this category yet.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Show all styles', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View Low Fade', exact: true })).toBeVisible();
});
