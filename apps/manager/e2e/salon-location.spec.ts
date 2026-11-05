import { expect, test, type Page } from '@playwright/test';
import { fixture, login, seed } from './management-fixture';

async function readyMap(page: Page) { await expect(page.getByRole('region', { name: 'Salon location map' }).locator('.leaflet-tile-container')).toBeAttached(); }
async function mapClick(page: Page, x = 160, y = 130) { await readyMap(page); await page.getByRole('region', { name: 'Salon location map' }).click({ position: { x, y } }); }
test.beforeEach(async ({ page }) => {
  if (!process.env.MAP_VISUAL_LIVE_TILES) await page.route('https://tile.openstreetmap.org/**', r => r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eeeae4"/><path d="M0 80h256M100 0v256" stroke="white" stroke-width="12"/><text x="15" y="45" fill="#70665d" font-size="12">Map test tile</text></svg>' }));
});

test('create requires a map pin and persists the confirmed point after reload', async ({ page }, info) => {
  const f = await fixture(page); await login(page); await page.getByRole('button', { name: '+ Add salon', exact: true }).click();
  await page.getByLabel('Salon name', { exact: true }).fill('Pinned Studio'); await page.getByLabel('Address in Akurana').fill('Main Street, Akurana');
  await page.getByRole('button', { name: 'Create salon', exact: true }).click(); await expect(page.getByRole('button', { name: 'Choose salon location', exact: true })).toHaveAttribute('aria-invalid', 'true'); expect(f.data.salons).toHaveLength(0);
  await page.getByRole('button', { name: 'Choose salon location', exact: true }).click(); await expect(page.getByRole('button', { name: 'Use this pin', exact: true })).toBeDisabled();
  await mapClick(page); await expect(page.getByTestId('draft-salon-location')).not.toContainText('No location');
  if (process.env.MAP_VISUAL_LIVE_TILES) await expect.poll(() => page.locator('.leaflet-tile-loaded').count(), { timeout: 15000 }).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('location-picker.png') });
  await page.getByRole('button', { name: 'Use this pin', exact: true }).click(); await page.getByRole('button', { name: 'Create salon', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pinned Studio', exact: true })).toBeVisible(); expect(f.data.salons[0]!.latitude).toBeGreaterThan(7); expect(f.data.salons[0]!.longitude).toBeGreaterThan(80);
  const pin = `${f.data.salons[0]!.latitude!.toFixed(6)}, ${f.data.salons[0]!.longitude!.toFixed(6)}`;
  await page.reload(); await page.getByRole('button', { name: 'Edit salon', exact: true }).click(); await expect(page.getByText(pin, { exact: true })).toBeVisible();
});

test('editing, dragging and cancelling preserve the form and prior pin until confirmation', async ({ page }) => {
  const f = await fixture(page), salon = seed(); f.data.salons.push(salon); await login(page); await page.getByRole('button', { name: `Manage ${salon.name}`, exact: true }).click(); await page.getByRole('button', { name: 'Edit salon', exact: true }).click();
  await page.getByLabel('Salon name', { exact: true }).fill('Updated Studio'); await page.getByRole('button', { name: 'Change salon location', exact: true }).click(); await mapClick(page, 230, 180); await page.getByRole('button', { name: 'Close location picker', exact: true }).click();
  await expect(page.getByLabel('Salon name', { exact: true })).toHaveValue('Updated Studio'); await expect(page.getByText('7.368000, 80.615000', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Change salon location', exact: true }).click(); await readyMap(page);
  const marker = page.locator('.leaflet-marker-icon'); await marker.hover();
  const bounds = await marker.boundingBox(); if (!bounds) throw new Error('No draggable pin');
  await page.mouse.move(bounds.x + 14, bounds.y + 10); await page.mouse.down(); await page.mouse.move(bounds.x + 55, bounds.y + 45, { steps: 8 }); await page.mouse.up();
  await expect(page.getByTestId('draft-salon-location')).not.toHaveText('Selected: 7.368000, 80.615000');
  await page.getByRole('button', { name: 'Use this pin', exact: true }).click(); await page.getByRole('button', { name: 'Save salon', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Updated Studio', exact: true })).toBeVisible(); expect(salon.latitude).not.toBe(7.368);
  await page.getByRole('button', { name: 'View salon location', exact: true }).scrollIntoViewIfNeeded();
});

test('current location is shown and selected only after the manager requests it', async ({ page, context }) => {
  await context.setGeolocation({ latitude: 7.370123, longitude: 80.619456, accuracy: 12 }); await context.grantPermissions(['geolocation']);
  await fixture(page); await login(page); await page.getByRole('button', { name: '+ Add salon', exact: true }).click(); await page.getByRole('button', { name: 'Choose salon location', exact: true }).click(); await readyMap(page);
  await expect(page.getByTestId('draft-salon-location')).toHaveText('No location selected yet'); await page.getByRole('button', { name: 'Use my location', exact: true }).click();
  await expect(page.getByTestId('draft-salon-location')).toHaveText('Selected: 7.370123, 80.619456'); await expect(page.getByText(/approximately 12 m accuracy/)).toBeVisible();
  await page.getByRole('button', { name: 'Use this pin', exact: true }).click(); await expect(page.getByText('7.370123, 80.619456', { exact: true })).toBeVisible();
});

test('denied GPS still allows manual map pinning', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator.permissions, 'query', { value: async () => ({ state: 'denied' }) }); });
  await fixture(page); await login(page); await page.getByRole('button', { name: '+ Add salon', exact: true }).click(); await page.getByRole('button', { name: 'Choose salon location', exact: true }).click();
  await page.getByRole('button', { name: 'Use my location', exact: true }).click(); await expect(page.getByText(/Location permission is off/)).toBeVisible(); await mapClick(page); await expect(page.getByRole('button', { name: 'Use this pin', exact: true })).toBeEnabled();
});

test('late GPS cannot overwrite a manual selection or a closed picker', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.permissions, 'query', { value: async () => ({ state: 'granted' }) });
    Object.defineProperty(navigator.geolocation, 'getCurrentPosition', { value: (success: PositionCallback) => { (window as unknown as { completeGPS: () => void }).completeGPS = () => success({ coords: { latitude: 9, longitude: 81, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null, toJSON: () => ({}) }, timestamp: Date.now(), toJSON: () => ({}) }); } });
  });
  await fixture(page); await login(page); await page.getByRole('button', { name: '+ Add salon', exact: true }).click(); await page.getByRole('button', { name: 'Choose salon location', exact: true }).click(); await page.getByRole('button', { name: 'Use my location', exact: true }).click();
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { completeGPS?: unknown }).completeGPS)).toBe('function');
  await mapClick(page); const manual = await page.getByTestId('draft-salon-location').textContent(); await page.evaluate(() => (window as unknown as { completeGPS: () => void }).completeGPS()); await expect(page.getByTestId('draft-salon-location')).toHaveText(manual!);
  await page.getByRole('button', { name: 'Use my location', exact: true }).click(); await page.getByRole('button', { name: 'Close location picker', exact: true }).click(); await page.evaluate(() => (window as unknown as { completeGPS: () => void }).completeGPS());
  await expect(page.getByRole('button', { name: 'Choose salon location', exact: true })).toBeVisible();
});

test('location picker fits a narrow phone and keeps confirmation reachable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 }); await fixture(page); await login(page); await page.getByRole('button', { name: '+ Add salon', exact: true }).click(); await page.getByRole('button', { name: 'Choose salon location', exact: true }).click(); await mapClick(page);
  await expect(page.getByRole('button', { name: 'Use this pin', exact: true })).toBeInViewport(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
