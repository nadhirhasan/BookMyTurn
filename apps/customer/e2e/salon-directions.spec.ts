import { test, expect } from '@playwright/test';
import { mockDatabase } from './fixtures';

test('customer directions hand the exact salon pin to Google Maps', async ({ page }) => {
  const f = await mockDatabase(page); Object.assign(f.catalog.salons[0]!, { latitude: 7.370123, longitude: 80.619456 });
  // Assert our handoff without depending on external Maps or local browser policies.
  await page.addInitScript(() => { window.open = url => { (window as unknown as { mapsHandoff: string }).mapsHandoff = String(url); return null; }; });
  await page.goto('/salon/royal-saloon'); await page.getByRole('button', { name: 'Get directions in Google Maps', exact: true }).click();
  const url = await page.evaluate(() => (window as unknown as { mapsHandoff: string }).mapsHandoff);
  const map = new URL(url); expect(map.origin).toBe('https://www.google.com'); expect(map.searchParams.get('destination')).toBe('7.370123,80.619456'); expect(map.searchParams.get('api')).toBe('1');
  await expect(page.getByRole('button', { name: 'Join Queue', exact: true })).toBeVisible();
});

test('legacy salon without a pin gives no misleading directions', async ({ page }) => {
  await mockDatabase(page); await page.goto('/salon/royal-saloon'); await expect(page.getByText(/The salon has not added its map pin yet/)).toBeVisible(); await expect(page.getByRole('button', { name: 'Get directions in Google Maps', exact: true })).toHaveCount(0);
});
