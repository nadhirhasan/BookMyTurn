import { test, expect } from '@playwright/test';
import { mockDatabase } from './fixtures';
test.beforeEach(async ({ page }) => { await mockDatabase(page); });
test('guest discovery loads the database catalogue and supports search, price, name and open filters', async ({ page }) => {
  await page.goto('/salons');
  await expect(page.getByRole('heading', { name: '13 salons in Akurana' })).toBeVisible();
  const cards = page.getByRole('button', { name: /^View / });
  await expect(cards).toHaveCount(13);
  await page.getByRole('textbox', { name: 'Search salons or barbers' }).fill('Sameer');
  await expect(cards).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Search salons or barbers' }).fill('no results');
  await expect(page.getByText('No salons found')).toBeVisible();
  await page.getByRole('button', { name: 'Reset search and filters' }).click();
  await expect(cards).toHaveCount(13);
  await page.getByRole('button', { name: 'Open now', exact: true }).click();
  await expect(cards).toHaveCount(12);
  await page.getByRole('button', { name: 'Lowest price', exact: true }).click();
  await expect(cards.first()).toHaveAttribute('aria-label', 'View Noire');
  await page.getByRole('button', { name: 'A–Z', exact: true }).click();
  await expect(cards.first()).toHaveAttribute('aria-label', 'View Mr Handsome');
});
test('salon details expose calendar booking, profiles and the QR shortcut without fake statistics', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Royal Saloon', exact: true }).click();
  await expect(page.getByText('No reviews yet · Open now', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View calendar & times' }).click();
  await page.getByRole('button', { name: 'Haircut · 30 min' }).click();
  await expect(page.getByRole('button', { name: 'Choose date 2026-10-31' })).toBeVisible();
  await page.goto('/');
  await page.getByRole('button', { name: /Simulate QR Scan/ }).click();
  await expect(page.getByRole('heading', { name: 'Join the queue in seconds.' })).toBeVisible();
});
test('database failures show a retry instead of hardcoded listings', async ({ page }) => {
  await page.route('**/rest/v1/rpc/customer_catalog', r => r.fulfill({ status: 403, json: { message: 'private error' } }));
  await page.goto('/salons');
  await expect(page.getByRole('button', { name: 'Retry connection' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^View / })).toHaveCount(0);
  await expect(page.getByText('private error')).toHaveCount(0);
});
for (const width of [320, 393, 430, 1440])
  test(`customer screens and calendar fit ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 852 });
    for (const path of ['/', '/salons', '/salon/royal-saloon', '/salon/royal-saloon/appointment', '/hairstyles']) {
      await page.goto(path);
      await expect(page.getByText('DEMO', { exact: true })).toBeVisible();
      if (path.endsWith('/appointment')) {
        await page.getByRole('button', { name: 'Haircut · 30 min' }).click();
        await expect(page.getByRole('button', { name: 'Choose date 2026-10-31' })).toBeVisible();
      }
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 393)
        await page.screenshot({ path: info.outputPath(path.replaceAll('/', '-') || 'home') + '.png' });
    }
  });
