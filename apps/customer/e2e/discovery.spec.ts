import { test, expect } from '@playwright/test';

test('a cold load waits for JavaScript before offering interactive controls', async ({ page }) => {
  let releaseScripts: () => void = () => {};
  const scriptsReady = new Promise<void>(resolve => { releaseScripts = resolve; });
  await page.route('**/*', async route => {
    if (route.request().resourceType() === 'script') await scriptsReady;
    await route.continue();
  });
  try {
    await page.goto('/salons', { waitUntil: 'commit' });
    await expect(page.getByLabel('Loading BookMyTurn')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Search salons or barbers' })).toHaveCount(0);
  } finally {
    releaseScripts();
  }
  await page.getByRole('textbox', { name: 'Search salons or barbers' }).fill('Sameer');
  await expect(page.getByRole('button', { name: /^View / })).toHaveCount(1);
});

test('guest can browse, open availability, select a window and return', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find a good time' })).toBeVisible();
  await page.getByRole('button', { name: 'View Royal Saloon', exact: true }).click();
  await expect(page.getByText('physically waiting', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Visit window 2:30 pm', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Visit window 2:30 pm', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Join Queue', exact: true }).click();
  await expect(page.getByText('Coming next: Queue joining')).toBeVisible();
  await page.getByRole('button', { name: 'Keep exploring' }).click();
  await page.getByRole('button', { name: 'Request Appointment', exact: true }).click();
  await expect(page.getByText('Coming next: Appointment requests')).toBeVisible();
  await page.getByRole('button', { name: 'Keep exploring' }).click();
  await page.getByRole('button', { name: 'Go back' }).click();
  await expect(page.getByRole('heading', { name: 'Find a good time' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('searches salon and barber names and handles no results', async ({ page }) => {
  await page.goto('/salons');
  await expect(page.getByRole('button', { name: /^View / })).toHaveCount(13);
  const search = page.getByRole('textbox', { name: 'Search salons or barbers' });
  await search.fill('sameer');
  await expect(page.getByRole('button', { name: /^View / })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'View Royal Saloon', exact: true })).toBeVisible();
  await search.fill('Noire');
  await expect(page.getByText('0 waiting · Barbers in service')).toBeVisible();
  await expect(page.getByText('Earliest service 2:15 pm')).toBeVisible();
  await search.fill('nothing matches');
  await expect(page.getByRole('heading', { name: 'No salons found' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset search and filters' }).click();
  await expect(page.getByRole('button', { name: /^View / })).toHaveCount(13);
});

test('filters open salons and sorts by starting haircut price', async ({ page }) => {
  await page.goto('/salons');
  await page.getByRole('button', { name: 'Open now', exact: true }).click();
  await expect(page.getByRole('button', { name: /^View / })).toHaveCount(12);
  await page.getByRole('button', { name: 'Price', exact: true }).click();
  await expect(page.getByRole('button', { name: /^View / }).first()).toHaveAttribute('aria-label', 'View Saloon Kumar');
  await page.getByRole('button', { name: 'Shortest wait', exact: true }).click();
  await expect(page.getByRole('button', { name: /^View / }).first()).toHaveAttribute('aria-label', 'View Royal Saloon');
  await page.getByRole('button', { name: 'Filter options' }).click();
  await page.getByRole('button', { name: 'Lowest price', exact: true }).click();
  await page.getByRole('button', { name: 'Show salons' }).click();
  await expect(page.getByRole('button', { name: /^View / }).first()).toHaveAttribute('aria-label', 'View Saloon Kumar');
});

test('supports planned visits, closed salons and invalid salon links', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Plan a visit' }).click();
  await expect(page.getByText(/Planning a visit/)).toBeVisible();
  await page.getByRole('button', { name: 'View Saloon Bhai', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Salon closed', exact: true })).toBeDisabled();
  await expect(page.getByText('No estimated windows while closed')).toBeVisible();
  await page.goto('/salon/does-not-exist');
  await expect(page.getByText('We could not find this salon.')).toBeVisible();
  await page.getByRole('button', { name: 'Browse salons' }).click();
  await expect(page.getByRole('heading', { name: '13 salons in Akurana' })).toBeVisible();
});

for (const width of [320, 393, 430, 1440]) {
  test(`screens fit ${width}px and keep their navigation accessible`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 852 });
    for (const [name, path] of [['home', '/'], ['salons', '/salons'], ['availability', '/salon/royal-saloon']]) {
      await page.goto(path!);
      await expect(page.getByText('DEMO', { exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (name === 'availability') await expect(page.getByRole('button', { name: 'Join Queue', exact: true })).toBeInViewport();
      else await expect(page.getByRole('tab', { name: /My Appointments/ })).toBeInViewport();
      if (width === 393) await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
    }
  });
}
